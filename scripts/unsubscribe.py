#!/usr/bin/env python3
"""
Reads the unsubscribe queue from a GitHub Gist, unsubscribes from each channel,
then clears the queue.

The queue Gist contains a file named `yt-dashboard-unsubscribe-queue.json`
with a JSON array of YouTube channel IDs (e.g. ["UCxxxxxx", "UCyyyyyy"]).
This file is written by the dashboard UI using the user's GitHub token (gist scope).

Required environment variables:
  GIST_TOKEN      — GitHub PAT with gist scope (to read/clear the queue)
  YOUTUBE_CLIENT_ID      — OAuth 2.0 client ID
  YOUTUBE_CLIENT_SECRET  — OAuth 2.0 client secret
  YOUTUBE_REFRESH_TOKEN  — refresh token with youtube (read+write) scope

Add GIST_TOKEN to GitHub Secrets (same value as the token used in the UI).

Usage:
  GIST_TOKEN=... YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... \\
    YOUTUBE_REFRESH_TOKEN=... python scripts/unsubscribe.py
"""

import json
import os
import sys
import time
from pathlib import Path

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
GITHUB_API = "https://api.github.com"
QUEUE_FILENAME = "yt-dashboard-unsubscribe-queue.json"
SUBSCRIPTIONS_FILE = Path("public/data/subscriptions.json")
_RETRY_STATUS_CODES = {429, 500, 502, 503, 504}
_MAX_RETRIES = 5


# ── GitHub Gist helpers ────────────────────────────────────────────────────────

def find_queue_gist(gh_token: str) -> tuple[str, str] | None:
    """Return (gist_id, content) for the queue Gist, or None if not found."""
    resp = requests.get(
        f"{GITHUB_API}/gists?per_page=100",
        headers={"Authorization": f"Bearer {gh_token}"},
        timeout=30,
    )
    resp.raise_for_status()
    for gist in resp.json():
        if QUEUE_FILENAME in gist.get("files", {}):
            # Fetch full content
            detail = requests.get(
                f"{GITHUB_API}/gists/{gist['id']}",
                headers={"Authorization": f"Bearer {gh_token}"},
                timeout=30,
            )
            detail.raise_for_status()
            content = detail.json()["files"][QUEUE_FILENAME]["content"]
            return gist["id"], content
    return None


def clear_queue_gist(gh_token: str, gist_id: str) -> None:
    """Overwrite the queue file with an empty array."""
    resp = requests.patch(
        f"{GITHUB_API}/gists/{gist_id}",
        headers={"Authorization": f"Bearer {gh_token}", "Content-Type": "application/json"},
        json={"files": {QUEUE_FILENAME: {"content": "[]"}}},
        timeout=30,
    )
    resp.raise_for_status()


# ── YouTube helpers ────────────────────────────────────────────────────────────

def get_youtube_access_token() -> str:
    resp = requests.post(
        TOKEN_URL,
        data={
            "client_id": os.environ["YOUTUBE_CLIENT_ID"],
            "client_secret": os.environ["YOUTUBE_CLIENT_SECRET"],
            "refresh_token": os.environ["YOUTUBE_REFRESH_TOKEN"],
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def load_subscription_map() -> dict[str, str]:
    """Return a mapping of channelId -> subscriptionId from the local JSON."""
    if not SUBSCRIPTIONS_FILE.exists():
        raise FileNotFoundError(
            f"{SUBSCRIPTIONS_FILE} not found. "
            "Run fetch_subscriptions.py first to generate it."
        )
    with open(SUBSCRIPTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        ch["id"]: ch["subscriptionId"]
        for ch in data.get("channels", [])
        if ch.get("id") and ch.get("subscriptionId")
    }


def delete_subscription(access_token: str, subscription_id: str) -> None:
    """Call subscriptions.delete with retry logic."""
    url = "https://www.googleapis.com/youtube/v3/subscriptions"
    headers = {"Authorization": f"Bearer {access_token}"}
    delay = 2.0

    for attempt in range(1, _MAX_RETRIES + 1):
        resp = requests.delete(url, headers=headers, params={"id": subscription_id}, timeout=30)
        if resp.status_code == 204:
            return
        if resp.status_code not in _RETRY_STATUS_CODES:
            resp.raise_for_status()
        if attempt == _MAX_RETRIES:
            resp.raise_for_status()
        retry_after = resp.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else delay
        print(f"  Rate-limited (HTTP {resp.status_code}), retrying in {wait:.0f}s ({attempt}/{_MAX_RETRIES})...")
        time.sleep(wait)
        delay = min(delay * 2, 60)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    gh_token = os.environ["GIST_TOKEN"]

    print("Reading unsubscribe queue from Gist...")
    result = find_queue_gist(gh_token)
    if not result:
        print("No queue Gist found. Nothing to do.")
        return
    gist_id, raw = result

    try:
        channel_ids: list[str] = [cid for cid in json.loads(raw) if cid]
    except json.JSONDecodeError:
        print(f"WARNING: Could not parse queue content: {raw!r}. Nothing to do.")
        return

    if not channel_ids:
        print("Queue is empty. Nothing to do.")
        return

    print(f"Queue contains {len(channel_ids)} channel(s): {channel_ids}")

    print(f"Loading subscription map from {SUBSCRIPTIONS_FILE}...")
    subscription_map = load_subscription_map()
    print(f"  Loaded {len(subscription_map)} subscription entries.")

    print("Obtaining YouTube access token...")
    access_token = get_youtube_access_token()

    success: list[str] = []
    not_found: list[str] = []
    failed: list[str] = []

    for channel_id in channel_ids:
        subscription_id = subscription_map.get(channel_id)
        if not subscription_id:
            print(f"  SKIP  {channel_id} — not in subscriptions.json (already unsubscribed or missing subscriptionId)")
            not_found.append(channel_id)
            continue
        try:
            print(f"  DELETE {channel_id} (subscriptionId={subscription_id})...")
            delete_subscription(access_token, subscription_id)
            print(f"  ✓ Unsubscribed from {channel_id}")
            success.append(channel_id)
        except Exception as exc:
            print(f"  ✗ Failed to unsubscribe from {channel_id}: {exc}")
            failed.append(channel_id)

    print()
    print(f"Done. Success: {len(success)}, Not found: {len(not_found)}, Failed: {len(failed)}")

    print("Clearing queue Gist...")
    clear_queue_gist(gh_token, gist_id)
    print("  Queue cleared.")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
