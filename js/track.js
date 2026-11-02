// Private visit counter: one record per page view, with the time the page was actually
// visible and how far it was scrolled. No IP, no cookies, no personal data.
// Owner devices are skipped: open the site once with ?owner=1 (and ?owner=0 to undo).
(() => {
  const q = new URLSearchParams(location.search).get('owner');
  try {
    if (q === '1') localStorage.setItem('ms-owner', '1');
    if (q === '0') localStorage.removeItem('ms-owner');
    if (localStorage.getItem('ms-owner') === '1') return;
  } catch (e) {}
  if (navigator.webdriver || /bot|crawl|spider|preview|headless/i.test(navigator.userAgent)) return;

  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  let vid;
  try {
    vid = localStorage.getItem('ms-vid');
    if (!vid) { vid = rid(); localStorage.setItem('ms-vid', vid); }
  } catch (e) { vid = rid(); }

  const pid = rid();
  const page = location.pathname + (location.pathname.endsWith('project.html') ? location.search : '');
  let ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  if (ref === location.hostname) ref = '';

  const send = (body, beacon) => {
    const data = JSON.stringify(body);
    if (beacon && navigator.sendBeacon) return navigator.sendBeacon('/api/track', data);
    fetch('/api/track', { method: 'POST', body: data, keepalive: true }).catch(() => {});
  };

  send({ t: 'view', pid, vid, page, ref, w: innerWidth, lang: navigator.language });

  // visible time only: the clock stops when the tab is hidden
  let shown = document.visibilityState === 'visible' ? performance.now() : null;
  let ms = 0, scroll = 0;
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0) scroll = Math.max(scroll, Math.round(scrollY / h * 100));
  }, { passive: true });

  const flush = () => {
    if (shown !== null) { ms += performance.now() - shown; shown = null; }
    send({ t: 'leave', pid, ms: Math.round(ms), scroll }, true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else shown = performance.now();
  });
  addEventListener('pagehide', flush);
})();
