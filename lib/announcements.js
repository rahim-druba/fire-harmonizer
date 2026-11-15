'use strict';
const {parseDocument} = require('htmlparser2');

const SOURCES = [
  {id:'firms', name:'NASA FIRMS', url:'https://www.earthdata.nasa.gov/data/tools/firms', kind:'html'},
  {id:'earthdata', name:'NASA Earthdata', url:'https://www.earthdata.nasa.gov/news', kind:'html'},
  {id:'nasa', name:'NASA', url:'https://www.nasa.gov/feed/', kind:'rss'}
];
const TTL = 30 * 60 * 1000;
const relevant = /\b(MODIS|VIIRS|FIRMS|NOAA[- ]?(20|21)|active[- ]fire|wildfires?|Terra|Aqua)\b/i;
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.children || []).flatMap(child => all(child, predicate))];
const text = node => !node ? '' : node.type === 'text' ? node.data : ['script','style'].includes(node.name) ? '' : (node.children || []).map(text).join(' ');
const clean = value => value.replace(/\s+/g, ' ').trim();
const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
function officialUrl(value, base) {
  try {
    const url = new URL(value, base);
    if (url.protocol !== 'https:' || !(url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov')) || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}
function parseUpdates(body, source) {
  const dom = parseDocument(body, {xmlMode:source.kind === 'rss'});
  if (source.kind === 'rss' && !all(dom, node => node.name === 'rss').length) throw new Error('Invalid RSS feed');
  const nodes = all(dom, node => source.kind === 'rss' ? node.name === 'item' : node.name === 'article' && hasClass(node, 'node--view-mode-content-card'));
  const items = [];
  for (const node of nodes.slice(0,100)) {
    let title, link, date, summary;
    if (source.kind === 'rss') {
      const field = name => clean(text((node.children || []).find(child => child.name === name)));
      title = field('title'); link = field('link'); date = field('pubDate');
      summary = clean(text(parseDocument(field('description'))));
    } else {
      const field = name => all(node, n => hasClass(n, 'field--name-' + name))[0];
      const heading = field('title');
      title = clean(text(heading));
      link = heading && all(heading, n => n.name === 'a')[0]?.attribs?.href;
      date = clean(text(field('published-at')));
      summary = clean(text(field('field-summary')));
    }
    if (!title || !link || !date || (source.id !== 'firms' && !relevant.test(title + ' ' + summary))) continue;
    const url = officialUrl(link, source.url);
    const timestamp = Date.parse(source.kind === 'html' ? date + ' UTC' : date);
    if (!url || !Number.isFinite(timestamp) || timestamp > Date.now() + 86400000) continue;
    const topics = ['MODIS','VIIRS','FIRMS'].filter(topic => new RegExp('\\b'+topic+'\\b','i').test(title+' '+summary));
    if (source.id === 'firms' && !topics.includes('FIRMS')) topics.push('FIRMS');
    items.push({title:title.slice(0,240), url, publishedAt:new Date(timestamp).toISOString(), source:source.name, topics});
  }
  return [...new Map(items.map(item => [item.url,item])).values()];
}
function mergeUpdates(items) {
  const merged = new Map();
  for (const item of items) {
    const previous = merged.get(item.url);
    merged.set(item.url, previous ? {...previous, topics:[...new Set([...previous.topics,...item.topics])]} : item);
  }
  return [...merged.values()].sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0,18);
}
async function download(url, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetchImpl(url, {signal:controller.signal, headers:{Accept:'text/html, application/rss+xml, application/xml', 'User-Agent':'FireHarmonizer/1.0 (public NASA updates)'}});
    if (!response.ok || !officialUrl(response.url || url, url)) throw new Error('Source unavailable');
    let bytes = 0; const chunks = [];
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > 1500000) { controller.abort(); throw new Error('Source too large'); }
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally { clearTimeout(timer); }
}
function createService({fetchImpl = globalThis.fetch, now = Date.now} = {}) {
  const cache = new Map();
  let checkedAt = 0;
  let pending;
  const snapshot = () => ({
    checkedAt:new Date(checkedAt).toISOString(), refreshAfterSeconds:1800,
    sources:SOURCES.map(source => ({id:source.id, name:source.name, url:source.url, status:cache.get(source.id)?.status || 'unavailable', fetchedAt:cache.get(source.id)?.fetchedAt || null})),
    items:mergeUpdates(SOURCES.flatMap(source => cache.get(source.id)?.items || []))
  });
  return async function updates() {
    if (checkedAt && now() - checkedAt < TTL) return snapshot();
    if (!pending) pending = (async () => {
      await Promise.all(SOURCES.map(async source => {
        try {
          const body = await download(source.url, fetchImpl);
          const items = parseUpdates(body, source);
          // A changed HTML template must not silently erase a previously working feed.
          if (source.kind === 'html' && !items.length) throw new Error('No dated source entries');
          cache.set(source.id, {items, fetchedAt:new Date(now()).toISOString(), status:'current'});
        } catch {
          const old = cache.get(source.id);
          cache.set(source.id, {...old, status:old?.items?.length ? 'stale' : 'unavailable'});
        }
      }));
      checkedAt = now();
    })().finally(() => { pending = null; });
    await pending;
    return snapshot();
  };
}
const updates = createService();
async function handler(req,res) {
  const data = await updates();
  const available = data.sources.some(source => source.status === 'current');
  res.set('Cache-Control', available ? 'public, max-age=60, s-maxage=300' : 'no-store');
  res.status(available || data.items.length ? 200 : 503).json(data);
}
module.exports = {handler, parseUpdates, createService, SOURCES};
