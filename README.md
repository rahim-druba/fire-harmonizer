<div align="center">

# Fire Harmonizer

**One fire record out of two disagreeing satellites.**

![Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0b3d91?style=flat-square)
![Status](https://img.shields.io/badge/status-hackathon%20prototype-eb6834?style=flat-square)
![Python](https://img.shields.io/badge/ml-scikit--learn-1baf7a?style=flat-square)
![Event](https://img.shields.io/badge/event-Almaty%2C%20Kazakhstan-6250d6?style=flat-square)

</div>

---

## The problem

NASA has tracked active fire hotspots from space for over two decades — but the record is split across two sensors, **MODIS** and **VIIRS**, that were never designed to agree with each other. Different pixel sizes, different saturation temperatures, different overpass times. The same wildfire produces two different detection counts depending on which satellite you ask.

Fire managers, researchers, and emergency responders are left without one consistent picture of when and where burning actually happened. That's the gap NASA's **"Harmonization of MODIS and VIIRS Hot Spots"** Space Apps Challenge asks teams to close.

**Fire Harmonizer** is our answer: a web app that reconciles both sensors into a single burning-activity calendar, flags statistically unusual fire activity against a seasonal baseline, and explains what it's seeing in plain language.

## Live demo

| Artifact | What it shows |
|---|---|
| **[Fire Harmonizer Prototype](https://claude.ai/artifact/4mLbtg7VCFqEqd3JJ58EED)** | The interactive product — severity-colored calendar, MODIS-vs-VIIRS gap chart, 30-day trend, real NASA satellite snapshots, a live Claude-generated narrative, a real ML anomaly score, and CSV export |
| **[Architecture diagrams](https://claude.ai/artifact/GTXE5hpJBJT8VVf31PXvD4)** | How data actually moves: satellite → harmonization → anomaly engine → narrative, and who calls whom over the network |

Both links are currently private to the author — ask for access if you're reviewing this as a judge or collaborator.

## What it actually does

- **Calendar view** — every day of the month colored by anomaly severity (normal → elevated → high → critical), click any day to drill in.
- **The gap, made explicit** — a direct MODIS-vs-VIIRS bar chart and a "sensor gap" stat for the selected day, so the harmonization problem is something you point at, not just explain.
- **Seasonal baseline + anomaly flagging** — a transparent z-score against a 10-year seasonal average, not a black-box correction factor (the literature says no universal one exists — see [`RESEARCH.md`](RESEARCH.md)).
- **A real ML cross-check** — an Isolation Forest model (scikit-learn), run against the same series, independently flags the same event window.
- **Real satellite imagery** — live NASA GIBS snapshots (MODIS true-color + fire-detection overlay) for key dates, not illustrations.
- **A live AI narrative** — a plain-language read of each day's anomaly, generated on demand by a real call to Claude, not pre-written copy.
- **CSV export** — download the full month of detections, counts, and anomaly tiers.

## What's real vs. illustrative (read this before you cite a number)

Being upfront about this is part of the project, not an afterthought:

| Component | Status |
|---|---|
| Satellite imagery (5 dates) | **Real** — fetched live from NASA GIBS |
| Live Claude narrative | **Real** — actual API call, generated on demand |
| ML anomaly score | **Real model** (Isolation Forest, scikit-learn), run on the demo's own illustrative series — proof of methodology, not a production model trained on years of FIRMS history |
| CSV export mechanism | **Real** |
| MODIS/VIIRS daily detection counts | **Illustrative** — hand-shaped to match the real event's reported severity pattern, not pulled from the live FIRMS API (that needs a personal API key — see Roadmap) |
| The underlying event (Sept 2026 Kazakhstan steppe & forest fires, ~2,870 ha) | **Real**, reported in local news |

## The local case study

The demo is grounded in a real, recent event rather than a generic example: the **September 2026 steppe and forest fires in Kazakhstan**, which burned an estimated 2,870 hectares. Validating the tool against a fire your own region actually experienced is the point — this isn't a hypothetical.

## Architecture

```
MODIS ─┐
       ├─▶ NASA FIRMS API ─▶ Harmonization Layer ─▶ Baseline + Anomaly Engine ─▶ Claude Narrative Layer ─▶ Map + Calendar UI
VIIRS ─┘
```

Full diagrams (data pipeline + request flow, with network hops numbered) are in the [architecture artifact](https://claude.ai/artifact/GTXE5hpJBJT8VVf31PXvD4).

**Why this split:** the published literature on MODIS/VIIRS reconciliation shows no single global correction factor works — fitted coefficients are sensor-pair- and region-specific. So instead of claiming a universal calibration we don't have, the harmonization layer puts both sensors on a common grid/time basis, and the anomaly layer does honest statistics (seasonal z-score + an independent ML cross-check) rather than a black-box number.

## Repository structure

```
.
├── web/
│   ├── fire-harmonizer.html    # The product — calendar, charts, satellite view, live AI, CSV export
│   └── architecture.html       # The two block diagrams
├── ml/
│   ├── anomaly_model.py        # Real Isolation Forest anomaly model (scikit-learn)
│   └── requirements.txt
├── server.js                   # Express scaffold (Claude API kept server-side)
├── public/index.html           # Earlier challenge direction (Mars landing-site map), kept for reference
├── RESEARCH.md                 # Literature review on MODIS/VIIRS harmonization, fully cited
├── NOTES.md / CHEATSHEET.md    # Event logistics, pitch, mentor prep
└── NASA Space Apps Challenge.pdf
```

## Running it locally

The product itself (`web/fire-harmonizer.html`) is a self-contained static page — open it directly in a browser, no build step.

To re-run the anomaly model:

```bash
cd ml
pip install -r requirements.txt
python3 anomaly_model.py
```

The Express scaffold (`server.js`) is from an earlier challenge direction and calls the Claude API server-side:

```bash
npm install
cp .env.example .env   # add your own ANTHROPIC_API_KEY
npm start
```

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS, hand-authored inline SVG for charts (no charting library)
- **ML:** Python, scikit-learn (Isolation Forest)
- **AI narrative:** Claude
- **Data sources:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (MODIS + VIIRS active-fire detections), [NASA GIBS](https://wiki.earthdata.nasa.gov/display/GIBS) (satellite snapshot imagery)
- **Design:** a colorblind-validated categorical/status palette (see `RESEARCH.md` methodology)

## Research

[`RESEARCH.md`](RESEARCH.md) is a short literature review on why MODIS and VIIRS diverge, what harmonization methods already exist in the published science, and what that means for this build's design choices — fully cited (Li 2018, Vadrevu 2018, Blackett 2015, White 2023, Li 2020, Zheng 2026, Giglio 2025, and others).

## Roadmap

- [ ] Swap the illustrative MODIS/VIIRS counts for a real NASA FIRMS API pull (needs a free personal API key)
- [ ] Retrain the anomaly model on multi-year real FIRMS history instead of the 30-day demo series
- [ ] Wire the map/calendar picker to an arbitrary region, not a fixed Kazakhstan view
- [ ] Deploy the Express backend so the harmonization + anomaly pipeline runs server-side on live data

## Built for

NASA Space Apps Challenge 2026 — Almaty, Kazakhstan local event.

## Author

Rahim Ahmed Druba ([@rahim-druba](https://github.com/rahim-druba))
