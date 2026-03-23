# Copilot Instructions

## Architecture

This project has two separate layers:

**Data pipeline (Python → JSON)**
- `scripts/fetch_subscriptions.py` calls the YouTube Data API v3 (subscriptions.list + channels.list), then writes `public/data/subscriptions.json`.
- `scripts/get_refresh_token.py` is a one-time local helper that opens a browser OAuth flow and prints the refresh token to copy into GitHub Secrets.
- GitHub Actions (`.github/workflows/fetch-data.yml`) runs the fetch script weekly (Monday 02:00 UTC). It exchanges `YOUTUBE_REFRESH_TOKEN` + `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` (GitHub Secrets) for a fresh access token on every run, then commits the updated JSON.

**Frontend (React + Vite + TypeScript)**
- The React app fetches `/data/subscriptions.json` at runtime (static file, no API calls from the browser).
- `src/hooks/useSubscriptions.ts` — single hook that fetches and exposes `{ data, status, error }`.
- `src/types/youtube.ts` — canonical TypeScript types (`Channel`, `SubscriptionsData`) that both the hook and components use.
- `src/components/` — presentational components only; all data logic lives in the hook.
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (configured in `vite.config.ts`). Import is `@import "tailwindcss"` in `src/index.css`.

**JSON schema** (`public/data/subscriptions.json`):
```json
{
  "lastUpdated": "<ISO 8601 UTC>",
  "totalCount": 123,
  "channels": [
    {
      "id": "UC...",
      "title": "Channel Name",
      "description": "...",
      "thumbnailUrl": "https://...",
      "subscriberCount": 123456,
      "videoCount": 500,
      "viewCount": 9876543,
      "publishedAt": "2018-01-01T00:00:00Z",
      "customUrl": "@handle",
      "country": "US"
    }
  ]
}
```
`subscriberCount`, `videoCount`, `viewCount`, `customUrl`, and `country` can be `null`.

## Commands

```bash
# Frontend dev server
npm run dev

# Type-check + production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview

# Python: one-time local OAuth (generates refresh token to put in GitHub Secrets)
pip install -r scripts/requirements.txt
python scripts/get_refresh_token.py

# Python: run data fetch manually (requires env vars)
YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=... \
  python scripts/fetch_subscriptions.py
```

## Key Conventions

- **Never add YouTube API calls to the frontend.** All data fetching happens in the Python script; the React app only reads the static JSON file.
- **Credentials never touch the repo.** `client_secret.json` and `token.json` are gitignored. Secrets live in GitHub Secrets only.
- **`public/data/subscriptions.json` is committed.** It is the build artifact that the frontend consumes. The GitHub Actions workflow commits it automatically; it should also be committed manually after a first local run.
- **Tailwind v4 syntax.** No `tailwind.config.js` — configuration is done via CSS or Vite plugin options. Use `@import "tailwindcss"` (not `@tailwind base/components/utilities`).
- **Component pattern.** Components in `src/components/` are props-only and do not fetch data. Data fetching and state belong in hooks (`src/hooks/`).
- **`null` vs `undefined` for missing channel fields.** The Python script emits `null` for unknown counts/strings; TypeScript types reflect this as `number | null` and `string | null`.

## GitHub Actions Setup

Required GitHub Secrets:
| Secret | Description |
|---|---|
| `YOUTUBE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `YOUTUBE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `YOUTUBE_REFRESH_TOKEN` | Obtained by running `scripts/get_refresh_token.py` locally |

The workflow needs `contents: write` permission to commit the updated JSON.
