// Vercel Serverless Function — fetches historical daily prices for SPY, QQQ, BTC, ETH
// Returns daily close prices as { symbol: { "YYYY-MM-DD": price, ... } }
// Client matches these to yield curve dates and computes +3mo forward values

const SYMBOLS = [
  { key: "spy", ticker: "SPY" },
  { key: "qqq", ticker: "QQQ" },
  { key: "btc", ticker: "BTC-USD" },
  { key: "eth", ticker: "ETH-USD" },
];

async function fetchHistory(ticker, startEpoch, endEpoch) {
  // Try Yahoo Finance v8 chart API first
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}` +
    `?period1=${startEpoch}&period2=${endEpoch}&interval=1d&includePrePost=false`;

  let resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; YieldCurveApp/1.0)" },
  });

  // If v8 fails, try with query2 endpoint
  if (!resp.ok) {
    const url2 =
      `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}` +
      `?period1=${startEpoch}&period2=${endEpoch}&interval=1d&includePrePost=false`;
    resp = await fetch(url2, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; YieldCurveApp/1.0)" },
    });
  }

  if (!resp.ok) throw new Error(`${ticker}: HTTP ${resp.status}`);

  const json = await resp.json();
  const r = json.chart.result[0];
  const ts = r.timestamp || [];
  const cl = r.indicators.quote[0].close || [];
  const map = {};

  for (let i = 0; i < ts.length; i++) {
    if (cl[i] == null) continue;
    const d = new Date(ts[i] * 1000);
    const key =
      d.getUTCFullYear() +
      "-" +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getUTCDate()).padStart(2, "0");
    map[key] = Math.round(cl[i] * 100) / 100;
  }
  return map;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    // 2019-10-01 so we have data before the 2020-01 yield curve start
    const startEpoch = Math.floor(new Date("2019-10-01").getTime() / 1000);
    const endEpoch = Math.floor(Date.now() / 1000) + 86400;

    const results = await Promise.all(
      SYMBOLS.map(({ key, ticker }) =>
        fetchHistory(ticker, startEpoch, endEpoch)
          .then((data) => ({ key, data, ok: true }))
          .catch((err) => {
            console.error(err.message);
            return { key, data: {}, ok: false };
          })
      )
    );

    const prices = {};
    for (const { key, data } of results) {
      prices[key] = data;
    }

    res.status(200).json({
      success: true,
      symbols: SYMBOLS.map((s) => s.key),
      lastUpdated: new Date().toISOString(),
      prices,
    });
  } catch (error) {
    console.error("Market API error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
