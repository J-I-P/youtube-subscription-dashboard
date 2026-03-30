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
HISTORY_FILE = Path("public/data/history.json")
AUTO_TAGS_CACHE_FILE = Path("public/data/auto-tags-cache.json")
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GEMINI_DEFAULT_MODEL = "gemini-2.5-flash-lite"

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

# Predefined tag taxonomy for consistent classification
TAG_CATEGORIES = [
    "Programming", "Gaming", "Music", "Education", "Science", "Food & Cooking",
    "Travel", "Fitness & Health", "Business", "Finance", "Entertainment",
    "News & Politics", "Art & Design", "Film & Cinema", "DIY & Crafts",
    "Sports", "Tech & Gadgets", "Anime & Manga", "Podcast", "Language Learning",
    "History", "Comedy", "Fashion & Beauty", "Nature & Wildlife", "Automotive",
    "Photography", "Architecture", "Philosophy", "Vlog", "Kids & Family",
]


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


def fetch_all_subscriptions(access_token: str) -> dict[str, str]:
    """Return a mapping of channelId -> subscriptionId."""
    subscriptions: dict[str, str] = {}
    page_token = None

    while True:
        params = {"part": "snippet", "mine": "true", "maxResults": "50"}
        if page_token:
            params["pageToken"] = page_token

        data = youtube_get(access_token, "subscriptions", params)

        for item in data.get("items", []):
            channel_id = item["snippet"]["resourceId"]["channelId"]
            subscription_id = item["id"]
            subscriptions[channel_id] = subscription_id

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return subscriptions


def fetch_latest_video(access_token: str, uploads_playlist_id: str) -> dict | None:
    """Return the latest video's id, title, publishedAt, thumbnailUrl, and url, or None if unavailable."""
    try:
        data = youtube_get(
            access_token,
            "playlistItems",
            {
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": "1",
            },
        )
    except Exception:
        return None

    items = data.get("items", [])
    if not items:
        return None

    snippet = items[0].get("snippet", {})
    video_id = snippet.get("resourceId", {}).get("videoId")
    if not video_id:
        return None

    thumbnails = snippet.get("thumbnails", {})
    thumbnail_url = (
        thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
        or None
    )
    # Skip videos without thumbnails (e.g. private or deleted videos)
    if not thumbnail_url:
        return None

    return {
        "id": video_id,
        "title": snippet.get("title", ""),
        "publishedAt": snippet.get("publishedAt", ""),
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "thumbnailUrl": thumbnail_url,
    }


def fetch_channel_details(access_token: str, channel_ids: list[str], subscription_map: dict[str, str] | None = None) -> list[dict]:
    channels = []
    returned_ids: set[str] = set()

    for i in range(0, len(channel_ids), 50):
        batch = channel_ids[i : i + 50]
        page_token = None

        while True:
            params: dict = {
                "part": "snippet,statistics,contentDetails",
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
                uploads_playlist_id = (
                    item.get("contentDetails", {})
                    .get("relatedPlaylists", {})
                    .get("uploads")
                )

                channels.append(
                    {
                        "id": item["id"],
                        "subscriptionId": (subscription_map or {}).get(item["id"]),
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
                        "_uploadsPlaylistId": uploads_playlist_id,
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


def load_auto_tags_cache() -> dict[str, list[str]]:
    """Load the auto-tags cache. Returns a dict of channelId -> [tags]."""
    if AUTO_TAGS_CACHE_FILE.exists():
        with open(AUTO_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("tags", {})
    return {}


def save_auto_tags_cache(cache: dict[str, list[str]]) -> None:
    with open(AUTO_TAGS_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({"version": 1, "tags": cache}, f, ensure_ascii=False, indent=2)


def _build_classification_prompt(channels: list[dict]) -> str:
    categories_str = ", ".join(TAG_CATEGORIES)
    channel_list = "\n".join(
        f'{i+1}. ID={c["id"]} | Title: {c["title"]} | Description: {c["description"][:200]}'
        for i, c in enumerate(channels)
    )
    return f"""You are classifying YouTube channels into categories.

Available categories: {categories_str}

For each channel below, pick 1-3 categories that best describe its content.
Respond ONLY with a JSON object mapping channel ID to an array of category strings.
Example: {{"UCxxxxx": ["Programming", "Education"], "UCyyyyy": ["Gaming"]}}

Channels:
{channel_list}"""


def _parse_classification_response(raw_text: str) -> dict[str, list[str]]:
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    result = json.loads(raw_text.strip())
    valid_set = set(TAG_CATEGORIES)
    return {
        cid: [t for t in tags if t in valid_set]
        for cid, tags in result.items()
        if isinstance(tags, list)
    }


def classify_channels_with_gemini(channels: list[dict]) -> dict[str, list[str]] | None:
    """
    Call Gemini API to classify a batch of channels.
    Returns a dict of channelId -> [tags], or None if the daily quota is exceeded.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {}

    model = os.environ.get("GEMINI_MODEL", GEMINI_DEFAULT_MODEL)
    api_url = GEMINI_API_URL_TEMPLATE.format(model=model)
    prompt = _build_classification_prompt(channels)

    try:
        delay = 5.0
        for attempt in range(1, _MAX_RETRIES + 1):
            resp = requests.post(
                f"{api_url}?key={api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=60,
            )
            if resp.status_code == 429:
                if attempt == _MAX_RETRIES:
                    try:
                        err = resp.json()
                        if any("quota" in str(d).lower() for d in err.get("error", {}).get("details", [])):
                            print("  Gemini daily quota (RPD) exceeded.")
                            return None
                    except Exception:
                        pass
                    resp.raise_for_status()
                retry_after = resp.headers.get("Retry-After")
                wait = float(retry_after) if retry_after else delay
                print(f"  Gemini rate-limited, retrying in {wait:.0f}s (attempt {attempt}/{_MAX_RETRIES})...")
                time.sleep(wait)
                delay = min(delay * 2, 60)
                continue
            resp.raise_for_status()
            break
        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return _parse_classification_response(raw_text)
    except Exception as e:
        print(f"  Gemini classification error: {e}")
        return {}


def classify_channels_with_openai(channels: list[dict]) -> dict[str, list[str]] | None:
    """
    Call OpenAI API to classify a batch of channels.
    Returns a dict of channelId -> [tags], or None if the quota is exceeded.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return {}

    model = os.environ.get("OPENAI_MODEL", OPENAI_DEFAULT_MODEL)
    prompt = _build_classification_prompt(channels)

    try:
        delay = 2.0
        for attempt in range(1, _MAX_RETRIES + 1):
            resp = requests.post(
                OPENAI_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                },
                timeout=60,
            )
            if resp.status_code == 429:
                if attempt == _MAX_RETRIES:
                    resp.raise_for_status()
                retry_after = resp.headers.get("Retry-After")
                wait = float(retry_after) if retry_after else delay
                print(f"  OpenAI rate-limited, retrying in {wait:.0f}s (attempt {attempt}/{_MAX_RETRIES})...")
                time.sleep(wait)
                delay = min(delay * 2, 60)
                continue
            resp.raise_for_status()
            break
        raw_text = resp.json()["choices"][0]["message"]["content"]
        return _parse_classification_response(raw_text)
    except Exception as e:
        print(f"  OpenAI classification error: {e}")
        return {}


def get_ai_provider() -> str | None:
    """Determine which AI provider to use. Returns 'gemini', 'openai', or None."""
    explicit = os.environ.get("AI_PROVIDER", "").lower()
    if explicit in ("gemini", "openai"):
        return explicit
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("GEMINI_API_KEY"):
        return "gemini"
    return None


def classify_new_channels(channels: list[dict], cache: dict[str, list[str]]) -> dict[str, list[str]]:
    """Classify only channels not already in the cache. Updates and returns the cache."""
    new_channels = [c for c in channels if c["id"] not in cache]

    if not new_channels:
        print("All channels already classified, skipping AI API calls.")
        return cache

    provider = get_ai_provider()
    if not provider:
        print("No AI API key set (GEMINI_API_KEY or OPENAI_API_KEY), skipping auto-tag classification.")
        return cache

    # OpenAI has generous rate limits; Gemini free tier has RPD=20 so needs larger batches
    if provider == "openai":
        batch_size = 20
        batch_sleep = 1.0
        classify_fn = classify_channels_with_openai
    else:
        batch_size = 50  # Keep total batches within Gemini RPD=20 (984 / 50 ≈ 20 batches)
        batch_sleep = 7.0  # 10 RPM free tier (1 req / 6s)
        classify_fn = classify_channels_with_gemini

    print(f"Classifying {len(new_channels)} new channels with {provider} ({model_label(provider)})...")
    total_batches = (len(new_channels) + batch_size - 1) // batch_size
    for i in range(0, len(new_channels), batch_size):
        batch = new_channels[i : i + batch_size]
        print(f"  Batch {i // batch_size + 1}/{total_batches}...")
        results = classify_fn(batch)
        if results is None:
            print("  Daily request limit reached. Progress saved; remaining channels will be classified on next run.")
            break
        cache.update(results)
        if i + batch_size < len(new_channels):
            time.sleep(batch_sleep)

    print(f"Classification complete. Cache now has {len(cache)} entries.")
    return cache


def model_label(provider: str) -> str:
    if provider == "openai":
        return os.environ.get("OPENAI_MODEL", OPENAI_DEFAULT_MODEL)
    return os.environ.get("GEMINI_MODEL", GEMINI_DEFAULT_MODEL)


def main():
    print("Obtaining access token...")
    access_token = get_access_token()

    print("Fetching subscriptions...")
    subscription_map = fetch_all_subscriptions(access_token)
    channel_ids = list(subscription_map.keys())
    subscribed_count = len(channel_ids)
    print(f"Found {subscribed_count} subscription IDs")

    print("Fetching channel details...")
    channels = fetch_channel_details(access_token, channel_ids, subscription_map)

    print("Fetching latest video for each channel...")
    for idx, channel in enumerate(channels, 1):
        playlist_id = channel.pop("_uploadsPlaylistId", None)
        if playlist_id:
            channel["lastVideo"] = fetch_latest_video(access_token, playlist_id)
        else:
            channel["lastVideo"] = None
        if idx % 50 == 0:
            print(f"  {idx}/{len(channels)} done...")

    # Auto-tag classification with Gemini
    print("Loading auto-tags cache...")
    auto_tags_cache = load_auto_tags_cache()
    auto_tags_cache = classify_new_channels(channels, auto_tags_cache)

    # Prune stale cache entries for unsubscribed channels
    current_ids = {c["id"] for c in channels}
    stale_count = sum(1 for k in auto_tags_cache if k not in current_ids)
    if stale_count:
        auto_tags_cache = {k: v for k, v in auto_tags_cache.items() if k in current_ids}
        print(f"Removed {stale_count} stale entries from auto-tags cache.")
    save_auto_tags_cache(auto_tags_cache)

    # Inject autoTags into each channel
    for channel in channels:
        channel["autoTags"] = auto_tags_cache.get(channel["id"], [])

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

    # Append data point to history.json
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    history: list[dict] = []
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)

    # Update today's entry if it already exists, otherwise append
    existing = next((h for h in history if h["date"] == today), None)
    if existing:
        existing["count"] = subscribed_count
    else:
        history.append({"date": today, "count": subscribed_count})

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"Updated history ({len(history)} data points) in {HISTORY_FILE}")


if __name__ == "__main__":
    main()
