#!/usr/bin/env python3
"""Quick diagnostic: 確認 OAuth token 對應的 YouTube 帳號與訂閱總數。"""

import os
import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"


def main() -> None:
    resp = requests.post(TOKEN_URL, data={
        "client_id": os.environ["YOUTUBE_CLIENT_ID"],
        "client_secret": os.environ["YOUTUBE_CLIENT_SECRET"],
        "refresh_token": os.environ["YOUTUBE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }, timeout=30)
    resp.raise_for_status()
    token = resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 帳號資訊
    ch = requests.get(
        "https://www.googleapis.com/youtube/v3/channels",
        headers=headers,
        params={"part": "snippet,statistics", "mine": "true"},
        timeout=30,
    ).json()
    info = ch["items"][0]
    print("=== 認證帳號 ===")
    print(f"  頻道名稱 : {info['snippet']['title']}")
    print(f"  頻道 ID  : {info['id']}")
    print(f"  Custom URL: {info['snippet'].get('customUrl', '無')}")

    # 訂閱數（API 回報的 totalResults）
    subs = requests.get(
        "https://www.googleapis.com/youtube/v3/subscriptions",
        headers=headers,
        params={"part": "id", "mine": "true", "maxResults": "1"},
        timeout=30,
    ).json()
    total = subs.get("pageInfo", {}).get("totalResults", "unknown")
    print(f"\n=== 訂閱資訊 ===")
    print(f"  API pageInfo.totalResults : {total}")
    print(f"  （此數字為 YouTube API 的估算值，不一定精確）")


if __name__ == "__main__":
    main()
