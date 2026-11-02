(() => {
  const P = window.PROJECTS || [];
  const IMG = 'assets/work/';
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const host = url => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const tags = list => `<div class="tags">${list.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>`;

  // A screenshot inside a browser window or a phone
  function frame(shot, p, cls = '') {
    const img = `<img src="${IMG}${shot.src}.jpg" alt="${esc(p.name)} — ${esc(shot.cap)}" loading="lazy" ${shot.kind === 'mobile' ? 'width="780" height="1688"' : 'width="1440" height="900"'}>`;
    const blur = shot.blur ? ' blurred' : '';
    if (shot.kind === 'mobile') return `<div class="scr phone${blur} ${cls}">${img}</div>`;
    const addr = p.url ? host(p.url) : p.name.toLowerCase().replace(/\s+/g, '') + ' · private';
    return `<div class="scr${blur} ${cls}"><div class="scr-bar"><i></i><i></i><i></i><span>${esc(addr)}</span></div>${img}</div>`;
  }

  /* ---------- home: featured systems ---------- */
  const featured = $('[data-featured]');
  if (featured) {
    featured.innerHTML = P.filter(p => p.tier === 1).map(p => {
      const desk = p.shots.filter(s => s.kind === 'desktop');
      const mob = p.shots.filter(s => s.kind === 'mobile');
      const media = mob.length >= 3
        ? `<div class="phones">${mob.slice(0, 3).map(s => frame(s, p)).join('')}</div>`
        : `<div class="stacked">${frame(desk[0], p)}${mob[0] ? frame(mob[0], p, 'phone') : desk[1] ? frame(desk[1], p) : ''}</div>`;
      return `<article class="feature rv">
        <div class="feature-text">
          <span class="status">${esc(p.status)}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.line)}</p>
          <ul>${p.features.slice(0, 3).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="row"><a class="btn sm" href="project.html?p=${p.slug}">View project ${ARROW}</a>${p.url ? `<a class="btn sm light" href="${p.url}" target="_blank" rel="noopener">Live site</a>` : ''}</div>
        </div>
        <a class="feature-media" href="project.html?p=${p.slug}" aria-label="${esc(p.name)}">${media}</a>
      </article>`;
    }).join('');
  }

  /* ---------- work page ---------- */
  const work = $('[data-work]');
  if (work) {
    work.innerHTML = [1, 2, 3].map(t => {
      const list = P.filter(p => p.tier === t);
      const tier = window.TIERS[t];
      return `<section class="tier" data-tier="${t}">
        <div class="tier-head"><h2>${esc(tier.name)}</h2><span class="muted">${list.length} projects · ${esc(tier.blurb)}</span></div>
        <div class="grid t${t}">${list.map(p => {
          const cover = p.shots.find(s => s.src === p.cover) || p.shots[0];
          return `<a class="card rv" href="project.html?p=${p.slug}" style="--c:${p.color}">
            <div class="card-media"><img src="${IMG}${cover.src}.jpg" alt="${esc(p.name)}" loading="lazy" width="1440" height="900"></div>
            <div class="card-body">
              <div class="card-top"><h3>${esc(p.name)}</h3><span class="sector">${esc(p.sector)}</span></div>
              <p>${esc(p.line)}</p>
              <span class="card-more">View project ${ARROW}</span>
            </div>
          </a>`;
        }).join('')}</div>
      </section>`;
    }).join('');

    document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b));
      const f = b.dataset.f;
      document.querySelectorAll('[data-tier]').forEach(s => s.classList.toggle('hidden', f !== 'all' && s.dataset.tier !== f));
    }));
  }

  /* ---------- project page ---------- */
  const proj = $('[data-project]');
  if (proj) {
    const slug = new URLSearchParams(location.search).get('p');
    const i = Math.max(0, P.findIndex(p => p.slug === slug));
    const p = P[i];
    const next = P[(i + 1) % P.length];
    document.title = p.name + ' — Boudy Hajj';

    // desktops: first one full width, the rest in pairs; phones grouped together
    const desk = p.shots.filter(s => s.kind === 'desktop');
    const mob = p.shots.filter(s => s.kind === 'mobile');
    const fig = s => `<figure class="rv">${frame(s, p)}<figcaption>${esc(s.cap)}${s.blur ? ' · client data blurred' : ''}</figcaption></figure>`;
    const rows = [];
    if (desk[0]) rows.push(`<div class="gal-row">${fig(desk[0])}</div>`);
    for (let k = 1; k < desk.length; k += 2) {
      rows.push(desk[k + 1] ? `<div class="gal-row pair">${fig(desk[k])}${fig(desk[k + 1])}</div>` : `<div class="gal-row">${fig(desk[k])}</div>`);
    }
    if (mob.length) rows.push(`<div class="gal-row phones">${mob.map(fig).join('')}</div>`);

    proj.innerHTML = `
      <div class="container">
        <header class="proj-head">
          <a href="work.html" class="back">← All work</a>
          <h1>${esc(p.name)}</h1>
          <p class="lede">${esc(p.line)}</p>
          <div class="meta">
            <div><span class="eyebrow">Client</span><p>${esc(p.client)}</p></div>
            <div><span class="eyebrow">Sector</span><p>${esc(p.sector)}</p></div>
            <div><span class="eyebrow">Status</span><p>${esc(p.status)}</p></div>
            <div><span class="eyebrow">Live</span><p>${p.url ? `<a class="link" href="${p.url}" target="_blank" rel="noopener">${esc(host(p.url))} ↗</a>` : 'Private system'}</p></div>
          </div>
        </header>
        <section class="proj-body">
          <div><h2>Overview</h2><p class="intro">${esc(p.intro)}</p><div style="margin-top:24px">${tags(p.stack)}</div></div>
          <div><h2>What it does</h2><ul class="checks">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        </section>
        <section class="gallery">${rows.join('')}</section>
        <a class="next" href="project.html?p=${next.slug}">
          <div><span class="eyebrow">Next project</span><h3>${esc(next.name)}</h3></div>
          <span class="btn sm light">View ${ARROW}</span>
        </a>
      </div>`;
  }

  /* ---------- fade in on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ---------- active nav link ---------- */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const h = a.getAttribute('href');
    if (h === here || (here === 'project.html' && h === 'work.html')) a.classList.add('on');
  });
})();
