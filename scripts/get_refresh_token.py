#!/usr/bin/env python3
"""
One-time local helper to obtain OAuth 2.0 credentials.

Prerequisites:
  1. Create an OAuth 2.0 Client ID in Google Cloud Console
     (Application type: Desktop app)
  2. Download client_secret.json to the project root
  3. Enable YouTube Data API v3

Usage:
  pip install -r requirements.txt
  python scripts/get_refresh_token.py

After running, copy the printed values to GitHub Secrets:
  YOUTUBE_CLIENT_ID
  YOUTUBE_CLIENT_SECRET
  YOUTUBE_REFRESH_TOKEN

NOTE: The scope is `youtube` (read + write) to support unsubscribing.
If you previously used `youtube.readonly`, you must re-run this script
and update the YOUTUBE_REFRESH_TOKEN secret with the new value.
"""

import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube"]
CLIENT_SECRET_FILE = "client_secret.json"
HOST = "127.0.0.1"
PORT = 8765


def main() -> None:
    secret_path = Path(CLIENT_SECRET_FILE)
    if not secret_path.exists():
        raise FileNotFoundError(
            f"{CLIENT_SECRET_FILE} not found in project root."
        )

    with secret_path.open("r", encoding="utf-8") as f:
        secret = json.load(f)

    installed = secret.get("installed") or secret.get("web")
    if not installed:
        raise ValueError(
            "client_secret.json does not contain 'installed' or 'web' config."
        )

    flow = InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
    )

    print(f"Starting local OAuth callback server at http://{HOST}:{PORT}")
    creds = flow.run_local_server(
        host=HOST,
        port=PORT,
        open_browser=True,
        access_type="offline",
        prompt="consent",
        success_message="Authorization successful. You can close this tab.",
    )

    if not creds.refresh_token:
        raise RuntimeError(
            "No refresh token returned. "
            "Try revoking the app access in your Google account and run again."
        )

    print("\n=== Add these to GitHub Secrets ===")
    print(f"YOUTUBE_CLIENT_ID:     {installed['client_id']}")
    print(f"YOUTUBE_CLIENT_SECRET: {installed['client_secret']}")
    print(f"YOUTUBE_REFRESH_TOKEN: {creds.refresh_token}")


if __name__ == "__main__":
    main()