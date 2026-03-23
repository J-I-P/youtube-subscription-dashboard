#!/usr/bin/env python3
"""
Fetches YouTube subscription data and writes public/data/subscriptions.json.

In CI (GitHub Actions), credentials come from environment variables:
  YOUTUBE_CLIENT_ID      — OAuth 2.0 client ID
  YOUTUBE_CLIENT_SECRET  — OAuth 2.0 client secret
  YOUTUBE_REFRESH_TOKEN  — refresh token obtained from the local auth helper

The script exchanges the refresh token for a fresh access token on every run.

Usage:
  pip install -r scripts/requirements.txt
  YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=... \
    python scripts/fetch_subscriptions.py
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
OUTPUT_FILE = Path("public/data/subscriptions.json")
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)


def get_access_token() -> str:
    client_id = os.environ["YOUTUBE_CLIENT_ID"]
    client_secret = os.environ["YOUTUBE_CLIENT_SECRET"]
    refresh_token = os.environ["YOUTUBE_REFRESH_TOKEN"]

    resp = requests.post(
        TOKEN_URL,
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


_RETRY_STATUS_CODES = {429, 500, 502, 503, 504}
_MAX_RETRIES = 5


def youtube_get(access_token: str, endpoint: str, params: dict) -> dict:
    url = f"https://www.googleapis.com/youtube/v3/{endpoint}"
    headers = {"Authorization": f"Bearer {access_token}"}
    delay = 2.0

    for attempt in range(1, _MAX_RETRIES + 1):
        resp = requests.get(url, headers=headers, params=params, timeout=30)

        if resp.status_code not in _RETRY_STATUS_CODES:
            resp.raise_for_status()
            return resp.json()

        if attempt == _MAX_RETRIES:
            resp.raise_for_status()

        retry_after = resp.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else delay
        print(f"  Rate-limited (HTTP {resp.status_code}), retrying in {wait:.0f}s (attempt {attempt}/{_MAX_RETRIES})...")
        time.sleep(wait)
        delay = min(delay * 2, 60)

    raise RuntimeError("unreachable")


def fetch_all_subscriptions(access_token: str) -> list[str]:
    channel_ids: list[str] = []
    page_token = None
    api_total: int | None = None
    page_num = 0

    while True:
        params = {"part": "snippet", "mine": "true", "maxResults": "50"}
        if page_token:
            params["pageToken"] = page_token

        data = youtube_get(access_token, "subscriptions", params)
        page_num += 1
        items = data.get("items", [])

        if api_total is None:
            api_total = data.get("pageInfo", {}).get("totalResults")

        for item in items:
            channel_ids.append(item["snippet"]["resourceId"]["channelId"])

        next_token = data.get("nextPageToken")
        print(f"    page {page_num:>3}: {len(items):>2} items, nextPageToken={'yes' if next_token else 'NO (last page)'}")

        page_token = next_token
        if not page_token:
            break

    print(f"  Total: {len(channel_ids)} IDs across {page_num} pages (API reported total: {api_total})")
    return channel_ids


def fetch_channel_details(access_token: str, channel_ids: list[str]) -> list[dict]:
    channels = []
    returned_ids: set[str] = set()

    for i in range(0, len(channel_ids), 50):
        batch = channel_ids[i : i + 50]
        page_token = None

        while True:
            params: dict = {
                "part": "snippet,statistics",
                "id": ",".join(batch),
                "maxResults": "50",
            }
            if page_token:
                params["pageToken"] = page_token

            data = youtube_get(access_token, "channels", params)

            for item in data.get("items", []):
                returned_ids.add(item["id"])
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                thumbnails = snippet.get("thumbnails", {})
                thumbnail_url = (
                    thumbnails.get("high", {}).get("url")
                    or thumbnails.get("medium", {}).get("url")
                    or thumbnails.get("default", {}).get("url")
                    or ""
                )

                channels.append(
                    {
                        "id": item["id"],
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "thumbnailUrl": thumbnail_url,
                        "subscriberCount": int(stats["subscriberCount"])
                        if stats.get("subscriberCount")
                        else None,
                        "videoCount": int(stats["videoCount"])
                        if stats.get("videoCount")
                        else None,
                        "viewCount": int(stats["viewCount"])
                        if stats.get("viewCount")
                        else None,
                        "publishedAt": snippet.get("publishedAt", ""),
                        "customUrl": snippet.get("customUrl") or None,
                        "country": snippet.get("country") or None,
                    }
                )

            page_token = data.get("nextPageToken")
            if not page_token:
                break

    missing_ids = [cid for cid in channel_ids if cid not in returned_ids]
    if missing_ids:
        print(
            f"WARNING: {len(missing_ids)} channel(s) were subscribed but not returned "
            f"by channels.list (likely deleted, private, or terminated):"
        )
        for cid in missing_ids:
            print(f"  - {cid}")
    else:
        print("All subscribed channel IDs were returned by channels.list.")

    return channels


def main():
    print("Obtaining access token...")
    access_token = get_access_token()

    print("Fetching subscriptions...")
    channel_ids = fetch_all_subscriptions(access_token)
    subscribed_count = len(channel_ids)
    print(f"Found {subscribed_count} subscription IDs")

    print("Fetching channel details...")
    channels = fetch_channel_details(access_token, channel_ids)
    channels.sort(key=lambda c: c["title"].lower())

    if subscribed_count != len(channels):
        print(
            f"SUMMARY: {subscribed_count} subscriptions → {len(channels)} channels with details "
            f"({subscribed_count - len(channels)} skipped by YouTube API)"
        )

    payload = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "subscribedChannelCount": subscribed_count,
        "totalCount": len(channels),
        "channels": channels,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Written {len(channels)} channels to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
