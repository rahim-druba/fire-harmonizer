(() => {
  'use strict';
  const list = document.getElementById('news-list');
  const status = document.getElementById('news-status');
  const refresh = document.getElementById('refresh-news');
  const filters = document.querySelector('.news-filters');
  const interval = 30 * 60 * 1000;
  const dateFormat = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  let items = [], topic = 'All', loading = false, lastAttempt = 0;
  const safeLink = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov')) && !url.username && !url.password ? url.href : null; }
    catch { return null; }
  };
  function render() {
    const fragment = document.createDocumentFragment();
    const visible = items.filter(item => topic === 'All' || item.topics.includes(topic));
    for (const item of visible) {
      const article = document.createElement('article'); article.className = 'news-item';
      const meta = document.createElement('div'); meta.className = 'news-meta';
      const date = document.createElement('time'); date.dateTime = item.publishedAt; date.textContent = dateFormat.format(new Date(item.publishedAt));
      const source = document.createElement('span'); source.textContent = 'Source: ' + item.source;
      meta.append(date,source);
      const content = document.createElement('div');
      const title = document.createElement('h3'); const link = document.createElement('a'); link.href = item.url; link.textContent = item.title; title.append(link);
      content.append(title);
      if (item.topics.length) { const tags = document.createElement('p'); tags.className = 'news-topic'; tags.textContent = item.topics.join(' · '); content.append(tags); }
      article.append(meta,content); fragment.append(article);
    }
    if (!visible.length) { const empty = document.createElement('p'); empty.textContent = 'No matching updates in the current feeds. The official channels below may have more.'; fragment.append(empty); }
    list.replaceChildren(fragment);
  }
  function accept(data, saved = false) {
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.sources)) throw new Error('Invalid updates');
    items = data.items.filter(item => item && typeof item.title === 'string' && typeof item.source === 'string' && safeLink(item.url) && Number.isFinite(Date.parse(item.publishedAt))).map(item => ({...item,url:safeLink(item.url),topics:Array.isArray(item.topics) ? item.topics.filter(t=>['MODIS','VIIRS','FIRMS'].includes(t)) : []}));
    render();
    const stamp = Number.isFinite(Date.parse(data.checkedAt)) ? dateFormat.format(new Date(data.checkedAt)) : 'an earlier visit';
    const unavailable = data.sources.filter(source => source.status !== 'current').map(source => source.name);
    status.textContent = saved ? 'Saved source updates from '+stamp+'. Live updates are temporarily unavailable; we will check again automatically.' : unavailable.length ? 'Checked '+stamp+'. Some sources are unavailable ('+unavailable.join(', ')+'); previously fetched items may be shown.' : 'Checked '+stamp+'. Automatically checks every 30 minutes.';
  }
  async function get(url) {
    const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),12000);
    try { const response = await fetch(url,{signal:controller.signal}); const data = await response.json(); if (!response.ok && !data.items?.length) throw new Error('Unavailable'); return data; }
    finally { clearTimeout(timeout); }
  }
  async function load() {
    if (loading) return;
    loading = true; lastAttempt = Date.now(); refresh.disabled = true;
    status.textContent = 'Checking official sources…';
    try { accept(await get('/api/announcements')); }
    catch {
      if (items.length) status.textContent = 'Could not refresh. Previously fetched updates remain visible; checking again automatically.';
      else try { accept(await get('/announcements-cache.json'),true); }
      catch { status.textContent = 'Official updates are temporarily unavailable. Please use the source links below.'; }
    } finally { loading = false; refresh.disabled = false; }
  }
  refresh.hidden = false; filters.hidden = false;
  refresh.addEventListener('click', load);
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-topic]'); if (!button) return;
    topic = button.dataset.topic;
    filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    render();
  });
  const autoRefresh = () => { if (!document.hidden && !list.contains(document.activeElement) && Date.now()-lastAttempt>=interval) load(); };
  setInterval(autoRefresh,60000);
  document.addEventListener('visibilitychange',autoRefresh);
  load();
})();
