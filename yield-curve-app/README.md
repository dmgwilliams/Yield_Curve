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
