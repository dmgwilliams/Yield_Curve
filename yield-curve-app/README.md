# U.S. Treasury Yield Curve — Live Animation

Animated visualization of the US Treasury yield curve from 2020 to present, with live data fetched from Treasury.gov.

## Features
- **Live data** — Fetches weekly yield curve snapshots directly from Treasury.gov
- **320+ weeks** of historical data (Jan 2020 – present)
- Smooth animated playback with adjustable speed (1x / 2x / 4x / 8x)
- 2s-10s spread tracker with inversion indicator
- Bull/bear market reference curves
- Ghost trail effect showing recent history
- Interactive timeline scrubber

## Deploy to Vercel (Free — ~5 minutes)

### Prerequisites
- A [GitHub](https://github.com) account (free)
- A [Vercel](https://vercel.com) account (free — sign up with GitHub)

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Name it `yield-curve` (or anything you like)
3. Keep it **Public** or **Private** — either works
4. Click **Create repository**
5. You'll see instructions — follow "push an existing repository" below

### Step 2: Push the Code
Open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yield-curve.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your `yield-curve` repository
3. Vercel auto-detects the Vite framework — leave defaults
4. Click **Deploy**
5. Wait ~60 seconds — done!

Vercel gives you a URL like `yield-curve-abc123.vercel.app`. Every time you visit it, it fetches the latest Treasury data automatically.

### Updating
The app auto-fetches fresh data from Treasury.gov on each page load (cached for 1 hour). No code changes needed to stay current.

## How It Works
- **Frontend**: React + Vite — the animated chart component
- **Backend**: Vercel Serverless Function (`/api/yields.js`) — proxies Treasury.gov CSV data to avoid browser CORS restrictions
- **Fallback**: If the API fetch fails, the app uses embedded historical data

## Project Structure
```
yield-curve-app/
├── api/
│   └── yields.js          # Serverless function (fetches Treasury data)
├── src/
│   ├── main.jsx           # React entry point
│   └── YieldCurveAnimation.jsx  # Main chart component
├── index.html             # HTML shell
├── package.json
├── vite.config.js
├── vercel.json            # Vercel deployment config
└── README.md
```

## Newcomer Onboarding Guide

### Mental model (30 seconds)
This project is a **single-page React app** that draws and animates the U.S. Treasury yield curve over time. Data comes from two serverless API routes under `api/`:
- `/api/yields` for Treasury curve history (weekly snapshots)
- `/api/market` for market price history (SPY/QQQ/BTC/ETH)

At runtime, the front end tries live API data first and falls back to embedded historical data if needed.

### Key files to read first
1. `src/main.jsx` — app entrypoint that mounts one root component.
2. `src/YieldCurveAnimation.jsx` — almost all UI, animation state, rendering, and data fetch logic.
3. `api/yields.js` — ingestion/parsing/cleanup pipeline for Treasury CSV data.
4. `api/market.js` — Yahoo Finance fetcher used for market overlays.

### Data flow and responsibilities
- **Serverless layer (`api/`)**
  - Fetches raw external data.
  - Normalizes dates and values.
  - Handles resilience concerns (retry/fallback endpoint for Yahoo, partial-year failures, cache headers).
- **Client layer (`src/`)**
  - Requests processed data from `/api/yields`.
  - Chooses `live` vs `fallback` source.
  - Runs requestAnimationFrame-based playback.
  - Computes chart/scales/spreads and renders all visual elements.

### Important implementation details
- The chart currently uses a **single large component** (`YieldCurveAnimation.jsx`) with colocated helper logic and embedded fallback data.
- Weekly sampling happens in the API (`pickWeekly`) so the browser animates a smaller, cleaner sequence.
- Missing tenor values are interpolated in `parseCSV`, which is a critical data-quality assumption.
- The app is optimized for serverless hosting (Vercel cache headers + rewrites in `vercel.json`).

### Suggested learning path (next steps)
1. Run locally with `npm install` then `npm run dev`; interact with timeline/playback controls.
2. Trace one request end-to-end: `YieldCurveAnimation.jsx` -> `/api/yields` -> `parseCSV` -> `pickWeekly` -> rendered frame.
3. Add a small feature (for example, a new spread metric) to learn where computed metrics belong.
4. Refactor a thin slice out of `YieldCurveAnimation.jsx` (e.g., scales/utilities) to reduce component size safely.
5. Add tests around API parsing/sampling behavior since those transformations are the highest-leverage logic.
