# NASA Space Apps — Almaty 2026 — Notes

## Event logistics
- Sat Nov 14: 09:00 opening, 09:30 teams start, 14:00–18:00 mentor sessions, 18:00–20:00 independent work, 20:00 end of day.
- Sun Nov 15: 10:00–12:00 mentor sessions, 15:00–19:00 presentations/judging (5 min/team), 20:00 winners announced (Zoom).
- Challenges: https://www.spaceappschallenge.org/2026/challenges/
- Opening Zoom: 889 9324 4147 / passcode nasa
- Mentoring booked via Google Meet (link in the shared doc), need Gmail ready.

## Mentor: Askar Nurakhmet
Robotics Engineering student at Nazarbayev University, research assistant at ISSAI. Mentors VEX teams, works on drone automation.
Booking: calendly.com/msastana02/askar

## Questions for the 10-min mentor call — judge psychology / mentality

Goal: he's mentored teams before and likely has informal insight into what tips the scales in the room, beyond the official rubric (Impact, Creativity, Validity, Relevance, Presentation). Use the 10 minutes to extract pattern-level, non-obvious judging behavior, not generic advice.

1. "In past local events here, what separated the team that won from the team that came in a close second — was it the idea, the demo, or the pitch delivery?"
2. "Do local judges here tend to be technical (engineers/researchers) or generalist/business-background? Does that change what we should emphasize?"
3. "When a team's demo partially breaks or is clearly a prototype, does that visibly hurt scores here, or do judges mentally forgive it if the idea is strong?"
4. "Is there a known bias here toward teams that show a *working* interactive demo vs. teams that show slides/mockups only?"
5. "How much does a local-context/Kazakhstan-specific angle (e.g. referencing the Sept 2026 steppe fires) actually move a judge's score, from what you've seen?"
6. "In the 5-minute presentation slot, what's the most common mistake teams make that costs them points — too much tech detail, too little, unclear problem framing?"
7. "Do judges ask harder questions to teams they're more interested in, or is tough Q&A a bad sign?"
8. "Is there a pattern to which categories/challenges tend to get picked as local winners — do judges favor novelty or feasibility?"
9. "Any advice on how to present AI-assisted work (we're using Claude/Codex heavily) without it reading as 'we didn't build this ourselves' to a judge?"
10. "If you were judging, what's the one thing in the first 60 seconds of a pitch that makes you lean in vs. check out?"

Keep it conversational — pick 4–5 of these based on how the call flows, don't run through all 10 like a checklist.

## If he asks "what are you building?" — say this

**Challenge:** Harmonization of MODIS and VIIRS Hot Spots (NASA Space Apps 2026)

**30-second version (say this out loud, almost word for word):**

"NASA has two satellite systems that detect fires and heat sources — MODIS and VIIRS. They don't agree with each other: different resolution, different pass times, so the same fire event can show up as a different number of hotspots depending on which satellite you ask. We're building a tool that merges both into one consistent, reliable fire history, lets you pick a region and a date range on a map, and shows whether what you're seeing is normal or an anomaly compared to past years — with an AI layer that explains the anomaly in plain language instead of just showing a number. We're testing it on the September 2026 Kazakhstan steppe and forest fires as our real case study, since it's local and recent."

**If he wants more detail, here's the actual plan:**

1. **Problem:** MODIS (older, coarser, ~1km resolution, since 2000) and VIIRS (newer, finer, ~375m, since ~2012) both report "fire detections," but raw counts aren't directly comparable — different sensors, different overpass times, different false-positive rates. Anyone trying to use this data for real decisions (fire response, insurance, research) has to manually reconcile them. That reconciliation is the actual challenge NASA posed.
2. **What the app does, concretely:**
   - Map picker (Leaflet) — click a region (default: Kazakhstan/Central Asia).
   - Calendar/date-range picker to pick a historical window.
   - Pulls real hotspot data from NASA FIRMS (the API that already serves both MODIS and VIIRS detections).
   - Harmonization layer: normalizes both sources onto a common grid/time basis so they're comparable (not a NASA-grade calibration — a transparent, explainable normalization, since that's honest about our time and resources).
   - Baseline + anomaly flagging: builds a seasonal baseline per region from historical data, flags current activity that's a statistical outlier (z-score / percentile based) — simple, explainable, defensible method, not a black-box model.
   - Claude narrative layer: turns "value X is 3.2 std devs above the 10-year seasonal baseline" into a one-paragraph plain-language explanation of what that means for that specific region and date.
3. **Local angle:** demoed against the real Sept 2026 Kazakhstan steppe/forest fires (~2,870 hectares burned) as a concrete validation case, not just a generic world map — ties into the "Local Impact" judging angle.
4. **Tooling split:** Codex does the harmonization/data-pipeline + backend code; Claude does the AI narrative layer and (via Claude Code) overall app scaffolding; sponsor resources (Google Cloud / Azure) used for hosting/compute if needed.
5. **Honesty point if asked "is this NASA-grade science?":** No — we're not recalibrating sensors like a remote-sensing lab would. We're building an honest, transparent statistical harmonization + anomaly tool a non-expert (emergency planner, researcher) could actually use and trust, which is what the challenge brief is actually asking for.
