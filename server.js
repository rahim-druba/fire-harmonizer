require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Keeps the Anthropic key server-side; the map page never sees it.
app.post('/api/brief', async (req, res) => {
  const { siteName, lat, lon, elevationNote, weather } = req.body;
  if (!siteName || typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ error: 'siteName, lat, lon required' });
  }
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a Mars mission planning assistant. Write a concrete, NASA-briefing-style mission brief (120-180 words) for a human explorer visiting "${siteName}" at Mars coordinates lat=${lat}, lon=${lon}.
Elevation/terrain context: ${elevationNote || 'none supplied'}.
Reference weather/climate data: ${weather || 'none supplied'}.
Cover exactly three things: (1) terrain hazard level and why, (2) one specific nearby science opportunity, (3) one practical EVA (spacewalk) planning tip tied to the data above. No generic filler, no disclaimers.`
      }]
    });
    res.json({ brief: msg.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'brief generation failed' });
  }
});

// Proxies NASA FIRMS so the browser never sees the MAP_KEY. Real-time: this calls
// FIRMS live on every request, no caching, for whatever bbox/date the region picker sends.
const BBOX_RE = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function firmsCount(source, bbox, date) {
  const key = process.env.FIRMS_MAP_KEY;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bbox}/1/${date}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || /invalid|error/i.test(text.split('\n')[0])) {
    throw new Error(text.split('\n')[0] || `FIRMS request failed (${res.status})`);
  }
  const lines = text.trim().split('\n');
  return Math.max(0, lines.length - 1); // minus header row; empty result is a lone header line
}

app.get('/api/hotspots', async (req, res) => {
  const { bbox, date } = req.query;
  if (typeof bbox !== 'string' || !BBOX_RE.test(bbox)) {
    return res.status(400).json({ error: 'bbox must be "west,south,east,north" in decimal degrees' });
  }
  if (typeof date !== 'string' || !DATE_RE.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (!process.env.FIRMS_MAP_KEY) {
    return res.status(500).json({ error: 'FIRMS_MAP_KEY not configured on the server' });
  }
  try {
    const [modis, viirs] = await Promise.all([
      firmsCount('MODIS_NRT', bbox, date),
      firmsCount('VIIRS_NOAA20_NRT', bbox, date)
    ]);
    res.json({ bbox, date, modis, viirs, combined: modis + viirs });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'FIRMS lookup failed: ' + err.message });
  }
});

const port = process.env.PORT || 3000;
// Keep app.listen() for local dev (`node server.js`); Vercel imports the exported
// app instead and never calls this branch.
if (require.main === module) {
  app.listen(port, () => console.log(`Fire Harmonizer server running on http://localhost:${port}`));
}
module.exports = app;
