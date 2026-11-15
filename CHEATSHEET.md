# NASA Space Apps 2026 — Almaty — Cheat Sheet

One file with everything: links, pitch, architecture, mentor prep. Everything below is also in `NOTES.md`; this file is the single consolidated copy.

## Challenge
**Harmonization of MODIS and VIIRS Hot Spots** (NASA Space Apps 2026)

## Live artifacts (links)
- **Space Apps Challenge Matrix** — comparison of all 8 shortlisted challenges, why this one won: https://claude.ai/artifact/35aeH28EmHthYfUc41Hq8r
- **Hackathon Offer Tracker** — tracks the 5 sponsor free offers (GoDaddy, Google Cloud, Meteomatics, Microsoft, Miro) so none of them silently starts charging a card: https://claude.ai/artifact/YPLxfk9jdF28rgAJF7m1gF
- **Fire Harmonizer Architecture** — two block diagrams: data pipeline (satellite → narrative) and request flow (who talks to whom): https://claude.ai/artifact/GTXE5hpJBJT8VVf31PXvD4
- **Fire Harmonizer Prototype** — the visual demo: calendar colored by anomaly severity, MODIS-vs-VIIRS gap chart, 30-day trend, Claude narrative per day: https://claude.ai/artifact/4mLbtg7VCFqEqd3JJ58EED
- **Fire Harmonizer Design System** (private, internal reference) — tokens, type scale, and two formalized components extracted from both artifacts above, so future edits stay consistent: https://claude.ai/artifact/75sVX9HqnrqCg5B534ASYH

The two Fire Harmonizer links are now **shared publicly** ("anyone with the link"). The Challenge Matrix and Offer Tracker stay private — internal planning docs, not for a general audience.

## Local project files
- `/home/rahim/NASA Space App/server.js` — Express backend, `/api/brief` calls Claude server-side (key never exposed to the browser)
- `/home/rahim/NASA Space App/public/index.html` — Mars map scaffold (earlier challenge direction, kept for reference; not the final pick)
- `/home/rahim/NASA Space App/package.json`, `.env.example` — Node project setup
- `/home/rahim/NASA Space App/NOTES.md` — mentor-call questions + pitch summary (duplicated below)

## 30-second pitch (say this almost word for word)
"NASA has two satellite systems that detect fires — MODIS and VIIRS — and they don't agree with each other. We're building a tool that merges both into one reliable fire history, lets you pick a region and date range, and flags when current fire activity is a real anomaly versus a past baseline, with an AI layer that explains it in plain language. We're testing it on the September 2026 Kazakhstan steppe fires as our real case study."

### The actual plan
1. **Problem:** MODIS (coarser, ~1km, since 2000) and VIIRS (finer, ~375m, since ~2012) report different detection counts for the same fire — different sensors, different overpass times. Reconciling them is the literal challenge NASA posed.
2. **What the app does:** map/region picker + calendar date-range picker → pulls hotspot data from NASA FIRMS (already serves both sensors) → harmonization layer (common grid/time basis, transparent not black-box) → seasonal baseline + z-score anomaly flagging → Claude turns the stats into a plain-language explanation.
3. **Local angle:** validated against the real Sept 2026 Kazakhstan steppe/forest fires (~2,870 ha) — ties into the "Local Impact" judging category.
4. **Tooling split:** Codex → harmonization/data pipeline + backend. Claude → narrative layer + app scaffolding (Claude Code). Google Cloud/Azure → hosting if needed.
5. **Honesty line if pushed on rigor:** "We're not recalibrating sensors like a remote-sensing lab — we're building a transparent, explainable tool a non-expert could actually trust, which is what the challenge brief asks for."

## Mentor call — Askar Nurakhmet (Robotics/ISSAI, Nazarbayev University)
Booking: calendly.com/msastana02/askar

Questions on judge psychology (pick 4–5, keep it conversational):
1. What separated the local winner from a close second in past events — idea, demo, or pitch delivery?
2. Are local judges technical or generalist/business — does that change emphasis?
3. If the demo partially breaks, does that visibly hurt scores, or do judges forgive it if the idea is strong?
4. Is there a bias toward a *working* interactive demo over slides/mockups?
5. How much does a local-context angle (e.g. the Sept 2026 steppe fires) actually move a score?
6. Most common mistake in the 5-minute slot that costs points?
7. Do judges ask harder questions to teams they like, or is tough Q&A a bad sign?
8. Any pattern to which challenges/categories tend to win locally — novelty or feasibility?
9. How to present AI-assisted work (Claude/Codex) without it reading as "you didn't build this"?
10. First 60 seconds of a pitch — what makes a judge lean in vs. check out?

## Event schedule
- Sat Nov 14: 09:00 opening (Zoom 889 9324 4147, passcode `nasa`) · 09:30 teams start · 14:00–18:00 mentor sessions · 18:00–20:00 independent work · 20:00 end of day
- Sun Nov 15: 10:00–12:00 mentor sessions · 15:00–19:00 presentations/judging (5 min/team) · 20:00 winners announced (Zoom)
- Challenges list: https://www.spaceappschallenge.org/2026/challenges/

## Pitch talking point — don't forget this for the final slides
Suomi NPP (the original VIIRS satellite) was officially retired Nov 2, 2026 — NASA FIRMS emailed a notice about it. Our data pipeline is built against **NOAA-20 / NOAA-21 VIIRS**, not the retired Suomi NPP feed. If a judge who knows this space asks about data sourcing: *"We're aware Suomi NPP was retired this month and built against NOAA-20/21 instead"* — shows real homework, not a copy-pasted API call. Small point, real credibility.

## The data is now real — say this in the pitch
All MODIS/VIIRS detection counts in the prototype are **real NASA FIRMS data** (MODIS NRT + VIIRS NOAA-20 NRT), pulled live with a personal API key for September 2026 over a bounding box covering all of Kazakhstan. The real peak is **Sept 6–8** (not the 14th we'd guessed before getting the key) — 656 MODIS vs. 2,647 VIIRS detections on the worst day alone, which is itself a great live example of the sensor gap. One honest caveat to keep ready: the bounding box is country-wide, so this is Kazakhstan's *total* fire signal that week (wildfires + agricultural burning), not isolated to the one reported steppe-fire event — that event is part of the real spike, not identical to it. Baseline is this month's own median day (753), not a multi-year climatology (no time to pull years of history).

## Real ML model
`ml/anomaly_model.py` — a real Isolation Forest (scikit-learn) fit against the real FIRMS data above. Output is baked into the prototype as the "ML anomaly score" stat tile, and it independently flags the same Sept 6–8 window as anomalous. Honest framing if asked: real model, real data, but a 30-day window — more history would make it stronger, not more "real."

## Real literature on the harmonization gap
Saved in `RESEARCH.md` — a literature review with real citations. Headline facts: VIIRS detects 3–6x more fire pixels than MODIS depending on region (our real Sept 7 data shows ~4x, right in that published range), and no universal correction factor exists in the literature, so our simple baseline+ratio approach is the honest choice, not a weak one. The brief's CSV-export requirement is built into the prototype ("Download month as CSV").

## Sponsor offers — don't get charged
Tracked live in the **Hackathon Offer Tracker** artifact above. Reminder: read the actual terms at the moment of each real signup (card requirement + trial length vary and weren't verified for this specific event), enter the real signup date, and cancel before the trial ends.
