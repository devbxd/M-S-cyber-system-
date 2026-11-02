(() => {
  const P = window.PROJECTS || [];
  const IMG = 'assets/work/';
  const ARROW = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 13 13 1M4 1h9v9"/></svg>';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const host = url => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // A screenshot inside a browser window or a phone
  function frame(shot, p, cls = '') {
    const img = `<img src="${IMG}${shot.src}.jpg" alt="${esc(p.name)} — ${esc(shot.cap)}" loading="lazy" ${shot.kind === 'mobile' ? 'width="780" height="1688"' : 'width="1440" height="900"'}>`;
    const blur = shot.blur ? ' blurred' : '';
    if (shot.kind === 'mobile') return `<div class="scr phone${blur} ${cls}">${img}</div>`;
    const addr = p.url ? host(p.url) : p.slug + ' · private';
    return `<div class="scr${blur} ${cls}"><div class="scr-bar"><i></i><i></i><i></i><span>${esc(addr)}</span></div>${img}</div>`;
  }

  /* ---------- loader (once per visit) ---------- */
  const loader = $('.loader');
  const start = () => document.documentElement.classList.add('ready');
  let seen = false;
  try { seen = sessionStorage.getItem('bh-seen') === '1'; } catch (e) {}
  if (loader && !seen) {
    const n = $('.loader-count', loader);
    const t0 = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - t0) / 1300);
      n.textContent = String(Math.round(k * k * (3 - 2 * k) * 100)).padStart(3, '0');
      if (k < 1) return requestAnimationFrame(tick);
      loader.classList.add('done');
      setTimeout(start, 350);
      try { sessionStorage.setItem('bh-seen', '1'); } catch (e) {}
    };
    requestAnimationFrame(tick);
  } else {
    loader?.remove();
    requestAnimationFrame(start);
  }

  /* ---------- Beirut clock ---------- */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Beirut', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const set = () => { clock.textContent = 'Beirut ' + fmt.format(new Date()); };
    set(); setInterval(set, 1000);
  }

  /* ---------- split hero name into letters ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const txt = el.textContent;
    el.innerHTML = [...txt].map((c, i) => `<span class="ch" style="transition-delay:${(i * 0.045).toFixed(3)}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  /* ---------- home: featured systems ---------- */
  const stack = $('[data-featured]');
  if (stack) {
    const top = P.filter(p => p.tier === 1);
    stack.innerHTML = top.map((p, i) => {
      const desk = p.shots.filter(s => s.kind === 'desktop');
      const mob = p.shots.filter(s => s.kind === 'mobile');
      let collage;
      if (mob.length >= 3) {
        collage = `<div class="collage phones">${mob.slice(0, 3).map((s, j) => frame(s, p, 'm' + j)).join('')}</div>`;
      } else {
        collage = `<div class="collage">${desk[0] ? frame(desk[0], p, 'd1') : ''}${desk[1] ? frame(desk[1], p, 'd2') : ''}${mob[0] ? frame(mob[0], p, 'm1') : ''}</div>`;
      }
      return `<a class="card" href="project.html?p=${p.slug}" data-cursor="Open">
        <div class="card-info">
          <div>
            <div class="card-idx mono"><span>${String(i + 1).padStart(2, '0')} / ${String(top.length).padStart(2, '0')}</span><span>${esc(p.sector)}</span></div>
            <h3 class="card-name">${esc(p.name)}</h3>
            <p class="card-line">${esc(p.line)}</p>
          </div>
          <div>
            <div class="badge mono">${esc(p.status)}</div>
            <div class="tags mono" style="margin-top:16px">${p.stack.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
          </div>
        </div>
        ${collage}
      </a>`;
    }).join('');

    // cards shrink a little as the next one slides over them
    const cards = [...stack.children];
    const onScroll = () => {
      if (innerWidth <= 900) return;
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const r = next.getBoundingClientRect();
        const k = Math.min(1, Math.max(0, 1 - (r.top - 72) / innerHeight));
        c.style.transform = `scale(${1 - k * 0.06})`;
        c.style.filter = `brightness(${1 - k * 0.45})`;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- work page ---------- */
  const work = $('[data-work]');
  if (work) {
    const count = $('[data-count]');
    if (count) count.textContent = '(' + P.length + ')';
    work.innerHTML = [1, 2, 3].map(t => {
      const list = P.filter(p => p.tier === t);
      const tier = window.TIERS[t];
      return `<section class="tier" data-tier="${t}">
        <div class="tier-head"><h2>${esc(tier.name)}</h2><span class="mono" style="color:var(--mute)">${String(list.length).padStart(2, '0')} — ${esc(tier.blurb)}</span></div>
        <div class="grid t${t}">${list.map(p => {
          const cover = p.shots.find(s => s.src === p.cover) || p.shots[0];
          const phone = t < 3 && p.shots.find(s => s.kind === 'mobile' && s.src !== cover.src);
          return `<a class="item rv" href="project.html?p=${p.slug}" data-cursor="View">
            <div class="item-media">
              <img src="${IMG}${cover.src}.jpg" alt="${esc(p.name)}" loading="lazy" width="1440" height="900">
              ${phone ? frame(phone, p, 'peek') : ''}
            </div>
            <div class="item-meta"><h3>${esc(p.name)}</h3><span></span><span class="mono">${esc(p.sector)}</span></div>
            ${t < 3 ? `<p class="item-line">${esc(p.line)}</p>` : ''}
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

    // group screenshots into rows: desktops alone or in pairs, phones together
    const desk = p.shots.filter(s => s.kind === 'desktop');
    const mob = p.shots.filter(s => s.kind === 'mobile');
    const fig = s => `<figure class="rv">${frame(s, p)}<figcaption class="mono">${esc(s.cap)}${s.blur ? ' — client data blurred' : ''}</figcaption></figure>`;
    const rows = [];
    if (desk[0]) rows.push(`<div class="gal-row one">${fig(desk[0])}</div>`);
    for (let k = 1; k < desk.length; k += 2) {
      rows.push(desk[k + 1] ? `<div class="gal-row pair">${fig(desk[k])}${fig(desk[k + 1])}</div>` : `<div class="gal-row one">${fig(desk[k])}</div>`);
    }
    if (mob.length) rows.push(`<div class="gal-row phones">${mob.map(fig).join('')}</div>`);

    proj.innerHTML = `
      <header class="proj-top">
        <a href="work.html" class="mono" style="color:var(--mute)">← All work</a>
        <div class="badge mono" style="margin-top:28px">${esc(p.status)}</div>
        <h1 class="proj-name">${esc(p.name)}</h1>
        <div class="proj-meta">
          <div><span class="mono">Client</span><p>${esc(p.client)}</p></div>
          <div><span class="mono">Sector</span><p>${esc(p.sector)}</p></div>
          <div><span class="mono">Built with</span><p>${esc(p.stack.join(', '))}</p></div>
          <div><span class="mono">Live</span><p>${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="border-bottom:1px solid">${esc(host(p.url))} ↗</a>` : 'Private system'}</p></div>
        </div>
      </header>
      <section class="proj-body">
        <p class="proj-intro rv">${esc(p.intro)}</p>
        <ul class="feat rv">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </section>
      <section class="gallery">${rows.join('')}</section>
      <a class="next" href="project.html?p=${next.slug}" data-cursor="Next">
        <span class="mono">Next project</span>
        <span class="next-name">${esc(next.name)}</span>
      </a>`;
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ---------- count-up numbers ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now(), suffix = el.dataset.suffix || '';
    const step = now => {
      const k = Math.min(1, (now - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US') + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  document.querySelectorAll('.num-v[data-count]').forEach(el => cio.observe(el));

  /* ---------- cursor bubble over clickable work ---------- */
  const cur = $('.cursor');
  if (cur && matchMedia('(pointer: fine)').matches) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
    const loop = () => {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      cur.classList.toggle('on', !!t);
      if (t) cur.querySelector('span').textContent = t.dataset.cursor;
    });
  }

  /* ---------- active nav link ---------- */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === here || (here === 'project.html' && a.getAttribute('href') === 'work.html')) a.classList.add('on');
  });
})();
