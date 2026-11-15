# Official announcements

Run `npm start` to serve the complete app, including `/api/announcements`. The entry point is `app.js`, which imports the existing Express app from `server.js` and adds the announcements route. Vercel builds the same entry point. `server.js`, FIRMS requests, the historical data, and chart calculations are unchanged.

The endpoint fetches these fixed public sources:

- NASA FIRMS news cards: https://www.earthdata.nasa.gov/data/tools/firms
- NASA Earthdata news cards: https://www.earthdata.nasa.gov/news
- NASA RSS: https://www.nasa.gov/feed/

Earthdata and NASA entries are filtered for MODIS, VIIRS, FIRMS, NOAA-20/21, active fire, wildfire, Terra, or Aqua. The FIRMS source is already topic-specific. Headlines, source names, dates and links are returned; full articles and remote HTML are not sent to the browser. The list is a selection from the fetched sources, not a comprehensive archive. The older MODIS mission RSS host was unavailable during implementation, so it is linked as a reference rather than used as an unreliable feed dependency.

Each server instance caches results for 30 minutes, coalesces simultaneous refreshes, and retains the last successful source items if a later fetch fails. Requests time out after 6.5 seconds and are limited to 1.5 MB per source. Cache storage is in memory and may reset on a serverless cold start. HTTP edge caching lasts five minutes. The page checks every 30 minutes while visible, avoiding automatic list replacement while a headline has keyboard focus. A source-labelled, dated snapshot in `public/announcements-cache.json` is available if the endpoint cannot be reached. Saved updates are explicitly marked as saved.

NASA's HTML card layout is an external dependency. If it changes, the source is marked unavailable/stale instead of claiming an empty successful refresh. Links to the official channels remain available without JavaScript.

Run `npm run test:announcements` for parser, URL validation, date handling, caching and failure checks. The new UI was also checked in Chrome across 320, 390, 768 and 1440 px widths, with live source fetching and a simulated outage. Imagery credits and source URLs are recorded in `public/sources/credits.json` and displayed beneath each image.
