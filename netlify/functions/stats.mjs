// Visit statistics, readable only with the private key: /api/stats?key=...&days=30
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

// sha256 of the access key (the key itself is never committed)
const KEY_HASH = '47985de75807d7785f01aba1e25b6f24e685ea121891073e778639d8183dca34';

const count = (list, f) => {
  const m = {};
  for (const x of list) { const k = f(x) || '(direct)'; m[k] = (m[k] || 0) + 1; }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};
const sec = ms => Math.round(ms / 1000);

export default async req => {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || '';
  if (createHash('sha256').update(key).digest('hex') !== KEY_HASH) return new Response('Forbidden', { status: 403 });

  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

  const store = getStore('analytics');
  const { blobs } = await store.list({ prefix: 'views/' });
  const keys = blobs.map(b => b.key).filter(k => k.slice(6, 16) >= since);
  const views = (await Promise.all(keys.map(k => store.get(k, { type: 'json' })))).filter(Boolean);
  views.sort((a, b) => a.at.localeCompare(b.at));

  // a visit = all page views of one visitor less than 30 minutes apart
  const visits = [];
  const last = {};
  for (const v of views) {
    const prev = last[v.vid];
    if (prev && new Date(v.at) - new Date(prev.end) < 30 * 60000) {
      prev.pages.push(v.page); prev.ms += v.ms; prev.end = v.at;
    } else {
      const visit = { vid: v.vid, start: v.at, end: v.at, pages: [v.page], ms: v.ms, country: v.country, city: v.city, device: v.device, ref: v.ref };
      visits.push(visit); last[v.vid] = visit;
    }
  }

  const read = views.filter(v => v.ms > 0);
  const durations = visits.map(v => v.ms).sort((a, b) => a - b);
  const byDay = count(views, v => v.at.slice(0, 10)).sort((a, b) => a[0].localeCompare(b[0]));

  const out = {
    period: { days, since },
    totals: {
      page_views: views.length,
      visits: visits.length,
      unique_visitors: new Set(views.map(v => v.vid)).size,
      avg_visit_seconds: visits.length ? sec(durations.reduce((s, x) => s + x, 0) / visits.length) : 0,
      median_visit_seconds: durations.length ? sec(durations[Math.floor(durations.length / 2)]) : 0,
      avg_page_seconds: read.length ? sec(read.reduce((s, v) => s + v.ms, 0) / read.length) : 0,
      avg_scroll_percent: read.length ? Math.round(read.reduce((s, v) => s + v.scroll, 0) / read.length) : 0,
    },
    by_day: byDay,
    pages: count(views, v => v.page).map(([page, n]) => {
      const r = views.filter(v => v.page === page && v.ms > 0);
      return { page, views: n, avg_seconds: r.length ? sec(r.reduce((s, v) => s + v.ms, 0) / r.length) : 0 };
    }),
    countries: count(visits, v => v.country),
    sources: count(visits, v => v.ref),
    devices: count(visits, v => v.device),
    recent_visits: visits.slice(-25).reverse().map(v => ({
      start: v.start, seconds: sec(v.ms), pages: v.pages, where: [v.city, v.country].filter(Boolean).join(', '), device: v.device, from: v.ref || '(direct)',
    })),
  };
  return new Response(JSON.stringify(out, null, 2), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};

export const config = { path: '/api/stats' };
