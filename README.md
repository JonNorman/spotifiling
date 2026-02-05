# Spotifiling

A web app to organize your Spotify library by finding "unfiled" liked songs and making it easy to add them to playlists.

## What It Does

Spotifiling identifies songs in your Liked Songs that don't appear in any of your playlists. It presents these songs one at a time, auto-playing from the middle of the track, so you can quickly decide which playlist(s) to file them into.

Think of it as using playlists as tags - a song can belong to multiple playlists, and Spotifiling helps you systematically organize your library.

## Features

- Connects to your Spotify account (requires Premium for playback)
- Shows "unfiled" songs - liked songs not in any playlist
- Auto-plays songs from ~30% in so you can quickly identify them
- Keyboard-driven interface for fast filing (`/` search, `1-0` select, `Enter` next)
- Playlists sorted by how often you use them (self-organizing)
- Create new playlists on the fly
- Smart caching for snappy performance with large libraries
- Batched API writes to avoid rate limits

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Spotify Web API + Web Playback SDK
- Deployed to Cloudflare Pages via GitHub Actions

## Requirements

- Spotify Premium account (required for Web Playback SDK)
- Modern browser with JavaScript enabled

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Spotify app credentials

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SPOTIFY_CLIENT_ID` | Your Spotify app's Client ID |
| `VITE_SPOTIFY_REDIRECT_URI` | OAuth callback URL (e.g., `http://localhost:5173/callback`) |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Search playlists |
| `1-0` | Toggle playlists 1-10 |
| `Enter` | Next song |
| `Space` | Pause/resume |
| `N` | New playlist |
| `Esc` | Clear search |
| `?` | Show help |

## License

MIT
