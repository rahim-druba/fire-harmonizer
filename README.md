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
| **[Fire Harmonizer Prototype](https://claude.ai/artifact/4mLbtg7VCFqEqd3JJ58EED)** | The interactive product — a navigable calendar across 75 real days (Sept 1 - Nov 14, 2026), severity-colored, MODIS-vs-VIIRS gap chart, a full-range trend chart, real NASA satellite snapshots, a live Claude-generated narrative, a real ML anomaly score, and CSV export |
| **[Architecture diagrams](https://claude.ai/artifact/GTXE5hpJBJT8VVf31PXvD4)** | How data actually moves: satellite → harmonization → anomaly engine → narrative, and who calls whom over the network |

Both links are shared as "anyone with the link."

## What it actually does

- **Calendar view, 75 real days** — navigate month to month (Sept, Oct, Nov 2026 — the full real NRT history this key has access to), every day colored by anomaly severity (normal → elevated → high → critical), click any day to drill in.
- **The gap, made explicit** — a direct MODIS-vs-VIIRS bar chart and a "sensor gap" stat for the selected day, so the harmonization problem is something you point at, not just explain.
- **A trend chart across the whole window** — all 75 days in one chart with month boundaries marked, so seasonal decline into November is visible, not just one month in isolation.
- **Baseline + anomaly flagging** — a transparent ratio against the median day across the full 75-day window (a robust proxy baseline), not a black-box correction factor (the literature says no universal one exists — see [`RESEARCH.md`](RESEARCH.md)).
- **A real ML cross-check** — an Isolation Forest model (scikit-learn), run against the real 75-day data, independently flags the same Sept 6–8 spike.
- **Real satellite imagery** — live NASA GIBS snapshots (MODIS true-color + fire-detection overlay) for key dates, not illustrations.
- **A live AI narrative** — a plain-language read of each day's anomaly, generated on demand by a real call to Claude, not pre-written copy.
- **CSV export** — download all 75 days of detections, counts, and anomaly tiers.
- **Date-range lookups in the region picker** — pick a start date and a 1-5 day range (NASA FIRMS' own limit), not just a single day.

## What's real vs. illustrative (read this before you cite a number)

Being upfront about this is part of the project, not an afterthought:

| Component | Status |
|---|---|
| MODIS/VIIRS daily detection counts | **Real** — pulled live from NASA FIRMS (MODIS NRT + VIIRS NOAA-20 NRT) with a personal API key, Sept 1 - Nov 14, 2026 (75 days — the full NRT retention window this key has access to, not an arbitrary cutoff), over a bounding box covering all of Kazakhstan |
| Satellite imagery (6 dates) | **Real** — fetched live from NASA GIBS |
| Live Claude narrative | **Real** — actual API call, generated on demand |
| ML anomaly score | **Real model** (Isolation Forest, scikit-learn), run on the real 75-day FIRMS data above |
| CSV export mechanism | **Real** |
| Date-range lookups (region picker) | **Real** — uses NASA FIRMS' own day_range parameter (max 5 days per request) |
| Baseline | **Real but approximate** — the median daily total across all 75 real days (662), used as an honest proxy; a true multi-year seasonal climatology needs a multi-year FIRMS pull beyond this key's NRT window |
| Scope of the counts | The bounding box is country-wide, so the numbers are Kazakhstan's *total* fire signal day by day (wildfires + agricultural burning), not isolated to one event |
| The underlying event (Sept 2026 Kazakhstan steppe & forest fires, ~2,870 ha) | **Real**, reported in local news — part of, not identical to, the real Sept 6–8 spike in the data |

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
├── data/
│   └── firms_kazakhstan_sept_nov2026.csv  # Real daily MODIS/VIIRS counts, 75 days, pulled from NASA FIRMS
├── server.js                   # Express server: /api/brief (Claude), /api/hotspots (live FIRMS proxy)
├── public/index.html           # Local tools landing page
├── public/region-picker.html   # Real-time Leaflet region picker, live FIRMS lookups
├── public/mars-legacy.html     # Earlier challenge direction (Mars landing-site map) -- unrelated, kept for reference
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

The Express backend (`server.js`) also serves a **real-time Leaflet region picker** at `/region-picker.html` — draw a rectangle on a real OpenStreetMap map, pick a date, and it calls NASA FIRMS live through a server-side key (never exposed to the browser) for real MODIS + VIIRS counts in that exact region. This has to run as a real served page, not the claude.ai artifact above, because the artifact's sandbox blocks the external map tile images Leaflet needs.

```bash
npm install
cp .env.example .env   # add your own ANTHROPIC_API_KEY and FIRMS_MAP_KEY
npm start
# open http://localhost:3000/region-picker.html
```

### Region picker, tested live

Six real draws on the actual map, run the morning of the event — different regions, different dates, each one a fresh call to NASA's live API:

![Region picker showing the Kazakhstan demo region on Sept 7, 2026 — 656 MODIS, 2,647 VIIRS, 3,303 combined](screenshots/region-picker-kazakhstan-sep07.png)

![Region picker showing a small hand-drawn box around Karaganda on Sept 7, 2026 — 15 MODIS, 32 VIIRS](screenshots/region-picker-karaganda-sep07.png)

| Region drawn | Date | MODIS | VIIRS (NOAA-20) | Combined |
|---|---|---|---|---|
| Karaganda area (small, hand-drawn) | Sep 7, 2026 | 15 | 32 | 47 |
| Kazakhstan (the demo region) | Sep 7, 2026 | 656 | 2,647 | 3,303 |
| Kazakhstan (the demo region) | Sep 5, 2026 | 119 | 682 | 801 |
| Kazakhstan (the demo region) | Sep 1, 2026 | 26 | 374 | 400 |
| Aktobe area (hand-drawn) | Sep 1, 2026 | 5 | 26 | 31 |
| Almaty / Zhambyl area (hand-drawn) | Sep 1, 2026 | 2 | 4 | 6 |

The Kazakhstan rows match the prototype's own numbers exactly — same region, same dates, two separate tools independently landing on the same answer from NASA's live API. The three hand-drawn boxes are the real proof it's not locked to one hardcoded region: draw anywhere, get a real count for exactly that box, down to zero when nothing's burning there.

<details>
<summary>More screenshots</summary>

![Region picker, Kazakhstan demo region, Sept 5 2026](screenshots/region-picker-kazakhstan-sep05.png)
![Region picker, Kazakhstan demo region, Sept 1 2026](screenshots/region-picker-kazakhstan-sep01.png)
![Region picker, a hand-drawn box around Aktobe, Sept 1 2026](screenshots/region-picker-aktobe-sep01.png)
![Region picker, a hand-drawn box around Almaty/Zhambyl, Sept 1 2026](screenshots/region-picker-almaty-sep01.png)

</details>

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS, hand-authored inline SVG for charts (no charting library)
- **ML:** Python, scikit-learn (Isolation Forest)
- **AI narrative:** Claude
- **Data sources:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (MODIS + VIIRS active-fire detections), [NASA GIBS](https://wiki.earthdata.nasa.gov/display/GIBS) (satellite snapshot imagery)
- **Design:** a colorblind-validated categorical/status palette (see `RESEARCH.md` methodology)

## Model validation — and why there's no accuracy score

Isolation Forest is **unsupervised** — there's no labeled ground truth for "this day was truly anomalous," so a textbook accuracy/precision/recall against ground truth doesn't honestly exist for this task. Claiming one would be the kind of overclaim this project has tried hard to avoid.

What we report instead is **agreement between two independently-designed methods** looking at the same real 75-day FIRMS data — a ratio-to-baseline rule, and the ML model:

|  | ML: anomaly | ML: normal |
|---|---|---|
| **Rule: high/critical** | 7 | 5 |
| **Rule: normal/mild** | 5 | 58 |

**86.7% agreement**, **58.3% recall**, **58.3% precision**. These numbers dropped from an earlier, smaller 30-day test (93.3%/100%/66.7%) once the dataset grew to the full real 75 days — that's expected and the more honest result: a bigger, harder test should score lower than a smaller, easier one, and reporting the number that changed rather than quietly keeping the flattering one is the point of doing this honestly. Several disagreements are *low*-activity days — Isolation Forest flags statistical outliers in either direction, so an unusually quiet day scores as "unusual" too, which is expected model behavior, not a bug. Run `ml/anomaly_model.py` to reproduce this exactly.

## Research

[`RESEARCH.md`](RESEARCH.md) is a short literature review on why MODIS and VIIRS diverge, what harmonization methods already exist in the published science, and what that means for this build's design choices — fully cited (Li 2018, Vadrevu 2018, Blackett 2015, White 2023, Li 2020, Zheng 2026, Giglio 2025, and others).

## Honest framing on the harmonization itself

Against the challenge brief's own words ("by the end of this phase, it doesn't matter which sensor a hotspot came from"): this build combines MODIS + VIIRS into one anomaly signal, but deliberately keeps both sensors visible in the gap chart rather than collapsing them into one calibrated, bias-corrected number — full sensor calibration (view-angle correction, deduplication of the same fire seen by both sensors) is the honest next step, documented in [`RESEARCH.md`](RESEARCH.md), not something this build claims to have solved. We chose a transparent, defensible statistical + ML cross-check over an unvalidated black-box correction factor on purpose — the published literature shows no universal MODIS/VIIRS correction factor exists, so claiming one would be the overclaim, not the honest choice.

This tool is also built for more than after-the-fact analysis: the same live FIRMS pipeline that powers the region picker works mid-event, not just in hindsight — a fire manager could check it while a fire is still active, the same way CONAE's own scientists described using hotspots during the July 2026 Chile Rio fire in the challenge's own briefing video.

## Roadmap

- [x] Swap the illustrative MODIS/VIIRS counts for a real NASA FIRMS API pull
- [x] Real-time region picker (Leaflet + live FIRMS lookup via the Express backend)
- [x] Extend from 1 month to the full 75-day NRT history available (Sept 1 - Nov 14, 2026), with month navigation
- [x] Date-range lookups in the region picker (1-5 days, NASA FIRMS' own limit)
- [x] Deploy the Express backend publicly on Vercel, including the live `/api/hotspots` region picker
- [ ] Pull multi-year FIRMS history (beyond this key's NRT window) to replace the within-window median with a real seasonal climatology
- [ ] Wire the region picker's live counts into the calendar/prototype view, instead of the two living separately
- [ ] Full sensor-bias calibration (view-angle correction, deduplication) so sensor origin truly stops mattering, per the challenge's literal first-phase goal

## Built for

NASA Space Apps Challenge 2026 — Almaty, Kazakhstan local event.

## Author

Rahim Ahmed Druba ([@rahim-druba](https://github.com/rahim-druba))
