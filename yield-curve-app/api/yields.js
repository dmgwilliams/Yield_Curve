// Vercel Serverless Function — fetches Treasury yield curve data from treasury.gov
// This runs server-side, so no CORS issues

const MATURITY_COLUMNS = [
  "1 Mo", "2 Mo", "3 Mo", "4 Mo", "6 Mo",
  "1 Yr", "2 Yr", "3 Yr", "5 Yr", "7 Yr", "10 Yr", "20 Yr", "30 Yr"
];

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const colIndices = MATURITY_COLUMNS.map(col => header.indexOf(col));
  const dateIdx = header.indexOf("Date");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
    if (!cells[dateIdx]) continue;

    const rates = colIndices.map(idx => {
      if (idx === -1) return null;
      const val = parseFloat(cells[idx]);
      return isNaN(val) ? null : val;
    });

    // Skip rows with too many missing values
    const validCount = rates.filter(r => r !== null).length;
    if (validCount < 10) continue;

    // Fill nulls with interpolated values
    for (let j = 0; j < rates.length; j++) {
      if (rates[j] === null) {
        let prev = j - 1;
        while (prev >= 0 && rates[prev] === null) prev--;
        let next = j + 1;
        while (next < rates.length && rates[next] === null) next++;
        if (prev >= 0 && next < rates.length) {
          rates[j] = rates[prev] + (rates[next] - rates[prev]) * ((j - prev) / (next - prev));
        } else if (prev >= 0) {
          rates[j] = rates[prev];
        } else if (next < rates.length) {
          rates[j] = rates[next];
        } else {
          rates[j] = 0;
        }
      }
    }

    // Parse date — Treasury uses MM/DD/YYYY
    const rawDate = cells[dateIdx];
    let dateStr;
    if (rawDate.includes("/")) {
      const [mm, dd, yyyy] = rawDate.split("/");
      dateStr = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    } else {
      dateStr = rawDate;
    }

    const d = new Date(dateStr + "T00:00:00Z");
    const label = d.toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric", timeZone: "UTC"
    });

    rows.push({
      date: dateStr,
      label,
      rates: rates.map(r => Math.round(r * 100) / 100),
      dayOfWeek: d.getUTCDay()
    });
  }

  return rows;
}

function pickWeekly(allDays) {
  // Pick one data point per week (prefer Fridays, then closest to Friday)
  const weekly = [];
  let currentWeekStart = null;
  let currentWeekBest = null;

  for (const row of allDays) {
    const d = new Date(row.date + "T00:00:00Z");
    // ISO week start (Monday)
    const dayNum = (d.getUTCDay() + 6) % 7;
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - dayNum);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (weekKey !== currentWeekStart) {
      if (currentWeekBest) weekly.push(currentWeekBest);
      currentWeekStart = weekKey;
      currentWeekBest = row;
    } else {
      // Prefer Friday (day 5), else latest day in week
      if (row.dayOfWeek === 5 || (!currentWeekBest || row.dayOfWeek > currentWeekBest.dayOfWeek)) {
        currentWeekBest = row;
      }
    }
  }
  if (currentWeekBest) weekly.push(currentWeekBest);

  return weekly.map(({ date, label, rates }) => ({ date, label, rates }));
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const years = [];
    for (let y = startYear; y <= currentYear; y++) years.push(y);

    const fetches = years.map(y =>
      fetch(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${y}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${y}&page&_format=csv`)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to fetch ${y}: ${r.status}`);
          return r.text();
        })
        .then(csv => ({ year: y, csv }))
        .catch(err => {
          console.error(`Error fetching year ${y}:`, err.message);
          return { year: y, csv: "" };
        })
    );

    const results = await Promise.all(fetches);

    let allDays = [];
    for (const { csv } of results) {
      if (csv) {
        const parsed = parseCSV(csv);
        allDays = allDays.concat(parsed);
      }
    }

    // Sort chronologically
    allDays.sort((a, b) => a.date.localeCompare(b.date));

    // Pick weekly data points
    const weeklyData = pickWeekly(allDays);

    res.status(200).json({
      success: true,
      count: weeklyData.length,
      lastUpdated: new Date().toISOString(),
      data: weeklyData
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
