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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Mars Survival Map running on http://localhost:${port}`));
