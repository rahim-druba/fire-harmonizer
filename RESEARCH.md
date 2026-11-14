# Harmonization research — Consensus AI summary (saved 2026-11-15)

Source: Consensus AI literature search on MODIS/VIIRS active-fire harmonization, run against the actual NASA Space Apps challenge brief. Full citations below each claim.

## What the brief actually asks for (quoted from the brief itself)
- Build a web app that harmonizes MODIS + VIIRS hotspot records into a **burning activity calendar**, so sensor of origin no longer matters to the user.
- Two concrete features the brief suggests that we had **not yet built**:
  1. **Accessible (colorblind-safe) color ramps** — we're close: the prototype's calendar/chart palette is already a CVD-validated palette (dataviz skill), but worth saying explicitly if asked.
  2. **A downloadable CSV of hotspots in the search area** — **not built yet.** This is an explicit brief requirement, cheap to add, and something a judge can literally check for. Should be the next concrete feature if time allows before presenting.

## Why MODIS and VIIRS disagree (the actual "gap" we're visualizing)
- Same detection algorithm, different hardware: different bands, saturation temperature (MODIS ~500K vs VIIRS dual-gain ~634K), pixel size (MODIS 1km vs VIIRS 375m I-band). (Li 2018; Blackett 2015; Coskuner 2022)
- VIIRS detects **far more** fire pixels than MODIS, and the gap is large and location-dependent:
  - South America: Suomi NPP detected **5.13x** more fire pixels than Aqua over 10 years; country ratios ranged 3.87 (Chile) to 6.81 (Venezuela). (White 2023)
  - Punjab, India: VIIRS detected fires **4.8x** higher than MODIS Aqua+Terra combined. (Vadrevu 2018)
  - Africa: MODIS underestimates daily fire radiative power by **at least 42.8%** relative to VIIRS. (Li 2020)
  - MODIS misses 65–83% of VIIRS-detected pixels in forests/low-biomass land; VIIRS misses 35–53% of MODIS pixels. (Fu 2020)
- Our prototype's sample "VIIRS detects more than MODIS" pattern (used a ~1.2–1.3x ratio) is **directionally correct but conservative** — real-world gaps run 3–6x in some regions. Worth mentioning that range out loud if asked "is this realistic," since our demo numbers are illustrative, not copied from one paper.

## Harmonization methods that actually exist in the literature
- Most directly transferable: a **correction-before-fusion pipeline** (Zheng 2026) — duplicate-detection correction, footprint-scale near-synchronous matching, VIIRS cloud correction, anomalous-sample screening, a view-angle-dependent empirical correction model for MODIS FRP, then quality-prioritized fusion. Achieved R² ≥ 98.18%; fused product detected ~3.82x as many fire pixels as raw MODIS.
- Simpler alternative: **grid-level FRP adjustment** at multiple resolutions (0.05°–0.5°) to correct MODIS underestimation regionally. (Li 2020)
- Burned-area products (vs. active-fire hotspots) already match closely in time/space — statistical inter-calibration is viable there. (Giglio 2025)

## Caveats to say honestly if a judge pushes on rigor
- **No single global correction factor works.** Fitted coefficients are specific to the Aqua–Suomi NPP pair and don't transfer to Terra MODIS or other platforms without recalibration. (Zheng 2026; White 2023)
- The VIIRS/MODIS FRP relationship varies by spatial scale — close at fire-cluster scale, but VIIRS FRP runs ~47% smaller for large boreal fires, and ~20% different at global 1° grids. (Li 2018)
- **This is exactly why our build uses a transparent seasonal-baseline + z-score approach instead of claiming a universal correction formula** — the literature itself says a universal formula doesn't exist, so a statistically honest anomaly-detection layer is the defensible choice, not a weaker one.

## Data-sourcing note (act on this)
- **Suomi NPP VIIRS is being phased out** (per the live FIRMS page, flagged Oct–Nov 2026). Pull VIIRS data from **NOAA-20 and NOAA-21**, not Suomi NPP alone, when wiring up the real FIRMS API calls.
- Combining Suomi NPP + NOAA-20 VIIRS improved composite fidelity with a 10–20% reduction in swath pixel footprint, if we do end up blending multiple VIIRS platforms. (Giglio 2025)

## Action items this raises, in priority order
1. Add CSV download of hotspots in the selected area/date range — explicit brief requirement, currently missing.
2. If live FIRMS integration happens, request NOAA-20/21 VIIRS layers, not Suomi NPP.
3. Keep the "no universal correction factor" caveat as a talking point — it's a strength of our simpler approach, not a weakness to hide.
4. Optional, only if time allows: widen the prototype's sample MODIS/VIIRS ratio to be more realistic (currently ~1.2–1.3x; real gaps run 3–6x regionally) so the demo numbers don't undersell the actual problem.

## Full citation list
Li et al. 2018, *Journal of Geophysical Research Atmospheres* · Vadrevu et al. 2018, *Remote Sensing* · Blackett 2015, *Remote Sensing of Environment* · White 2023, *Journal of Hyperspectral Remote Sensing* · Li et al. 2020, *Remote Sensing* · Coskuner 2022, *iForest* · Fu et al. 2020, *Remote Sensing* · Zheng et al. 2026, *Remote Sensing* · Giglio et al. 2025, *Remote Sensing of Environment* · Campus et al. 2022, *Sensors* · Csiszar et al. 2013, *JGR Atmospheres*.
