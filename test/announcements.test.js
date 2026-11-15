'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseUpdates,createService,SOURCES} = require('../lib/announcements');
const card = (title='VIIRS update',href='/news/viirs-update',date='Nov. 3, 2026') => `<article class="node--view-mode-content-card"><p class="field--name-title"><a href="${href}">${title}</a></p><div class="field--name-published-at">${date}</div></article>`;
const feed = (title='MODIS update',link='https://www.nasa.gov/earth/test/') => `<rss><channel><item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>Tue, 03 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
test('HTML dates do not shift with server timezone; entities decode and duplicate links collapse',()=>{
 const rows=parseUpdates(card('VIIRS &amp; FIRMS')+card('VIIRS &amp; FIRMS'),SOURCES[0]);
 assert.equal(rows.length,1);assert.equal(rows[0].publishedAt,'2026-11-03T00:00:00.000Z');assert.equal(rows[0].title,'VIIRS & FIRMS');
});
test('unrelated NASA feed stories are excluded',()=>assert.deepEqual(parseUpdates(feed('New lunar rover'),SOURCES[2]),[]));
test('only official HTTPS article URLs are accepted',()=>{
 for(const url of ['javascript:alert(1)','https://nasa.gov.evil.test/a','https://evil.test/a','http://www.nasa.gov/a','https://user:pass@www.nasa.gov/a']) assert.equal(parseUpdates(feed('MODIS update',url),SOURCES[2]).length,0);
});
test('unusable and future publication dates are excluded',()=>{
 for(const date of ['not a date','Nov. 3, 2099','']) assert.equal(parseUpdates(card('VIIRS',undefined,date),SOURCES[0]).length,0);
});
test('valid RSS with CDATA preserves plain headline and topic',()=>{
 const [item]=parseUpdates(feed(),SOURCES[2]);assert.equal(item.title,'MODIS update');assert.deepEqual(item.topics,['MODIS']);
});
test('HTML error pages are not mistaken for empty RSS feeds',()=>{
 assert.throws(()=>parseUpdates('<html><h1>Unavailable</h1></html>',SOURCES[2]),/Invalid RSS/);
});
test('requests coalesce, cache for 30 minutes, and preserve dated stale data on failure',async()=>{
 let calls=0,clock=Date.now(),fail=false;
 const service=createService({now:()=>clock,fetchImpl:async url=>{calls++;if(fail)throw Error('offline');return new Response(url.includes('/feed/')?feed():card());}});
 const [a,b]=await Promise.all([service(),service()]);assert.equal(calls,3);assert.equal(a.items.length,b.items.length);assert(a.sources.every(s=>s.status==='current'));
 const shared=a.items.find(item=>item.url.endsWith('/news/viirs-update'));assert.equal(shared.source,'NASA FIRMS');assert.deepEqual(shared.topics,['VIIRS','FIRMS']);
 await service();assert.equal(calls,3);
 clock+=1800001;fail=true;const stale=await service();assert.equal(calls,6);assert(stale.sources.every(s=>s.status==='stale'));assert.equal(stale.items.length,a.items.length);assert.equal(stale.sources[0].fetchedAt,a.sources[0].fetchedAt);
});
test('cold outage is unavailable, not an empty successful feed',async()=>{
 const service=createService({fetchImpl:async()=>{throw Error('offline')}});const result=await service();assert.equal(result.items.length,0);assert(result.sources.every(s=>s.status==='unavailable'));
});
test('oversized responses fail without being cached as current',async()=>{
 const service=createService({fetchImpl:async()=>new Response('x'.repeat(1500001))});const result=await service();assert(result.sources.every(s=>s.status==='unavailable'));
});
