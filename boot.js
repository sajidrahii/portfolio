/* ============================================================
   BOOT + LIVE BUILD
   1. black screen -> popup window -> system boot log
   2. shutters open -> the page "compiles" itself:
      text is typed, cards appear as wireframes then render,
      images decode with a scan.
   3. sections below the fold are built when you scroll to them
   4. a HUD streams the build log and keeps the site feeling live
   ============================================================ */
(() => {
  const CONFIG = {
    alwaysPlay: true,   // false = full boot once per browser session, instant afterwards
    speed: 2,           // 1 = normal, 2 = twice as fast, 0.5 = slower
    hud: true,          // build log in the bottom-left corner
    hmr: true,          // occasional "hot reload" flicker on a random element
  };

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = (() => { try { return sessionStorage.getItem('sr-booted'); } catch { return null; } })();

  if (reduced || (!CONFIG.alwaysPlay && seen)) {
    root.classList.remove('booting');
    document.getElementById('boot')?.remove();
    return;
  }

  const MEDIA = '.project__media img, .brand img, .hero-image img, .card__media img, .storycard__icon img, .vrline';
  const TEXT  = '.nav__links a, .eyebrow, .tag, .hero__lead, .hero__name, h2, h3, .hero__desc, .body-copy, .muted, .storycard__body p, .tag-list li, .btn, .pill-link, .view-cert, .nav__socials a, .site-footer p';
  const POP   = '.btn, .tag, .pill-link, .tag-list li, .nav__socials a, .view-cert';
  const BOXES = '.card, .storycard, .hero-image';
  const UNITS = MEDIA + ',' + TEXT;

  let skipped = false, busy = 0, built = 0, total = 0, loc = 0, committed = false;
  const waiters = new Set();
  const t0 = performance.now();
  const $ = (s, r = document) => r.querySelector(s);

  const wait = ms => new Promise(res => {
    if (skipped) return res();
    const fin = () => { clearTimeout(t); waiters.delete(fin); res(); };
    const t = setTimeout(fin, ms / CONFIG.speed);
    waiters.add(fin);
  });

  /* ---------- HUD ---------- */
  let hud, hudLog, hudState, hudBtn, hudLoc, hudPct, hudBar, idleTimer;

  function makeHud() {
    if (!CONFIG.hud) return;
    hud = document.createElement('aside');
    hud.className = 'dev-hud';
    hud.innerHTML =
      '<div class="dev-hud__bar"><span class="dev-hud__dot"></span><span class="dev-hud__state">compiling…</span>' +
      '<button class="dev-hud__btn" type="button" aria-label="Skip the build animation">skip</button></div>' +
      '<div class="dev-hud__body"><div class="dev-hud__inner"><div class="dev-hud__log" aria-hidden="true"></div>' +
      '<div class="dev-hud__stats" aria-hidden="true"><span class="loc">0 loc</span><span class="pct">0%</span></div>' +
      '<div class="dev-hud__prog"><i></i></div></div></div>';
    document.body.appendChild(hud);
    hudLog = $('.dev-hud__log', hud); hudState = $('.dev-hud__state', hud); hudBtn = $('.dev-hud__btn', hud);
    hudLoc = $('.loc', hud); hudPct = $('.pct', hud); hudBar = $('.dev-hud__prog i', hud);
    hudBtn.addEventListener('click', () => {
      if (busy > 0 || !committed) skipAll();
      else { try { sessionStorage.removeItem('sr-booted'); } catch {} scrollTo(0, 0); location.reload(); }
    });
  }

  function log(msg, cls = 'g') {
    if (!hud) return;
    const row = document.createElement('div');
    row.innerHTML = '<span class="t">' + ((performance.now() - t0) / 1000).toFixed(1) + 's</span><span class="' + cls + '"></span>';
    row.lastChild.textContent = msg;
    hudLog.appendChild(row);
    while (hudLog.children.length > 5) hudLog.firstChild.remove();
    hud.classList.remove('is-idle');
    hudState.textContent = 'compiling…';
    hudBtn.textContent = 'skip';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goIdle, 3200);
  }

  function goIdle() {
    if (!hud || busy > 0) { idleTimer = setTimeout(goIdle, 1000); return; }
    hud.classList.add('is-idle');
    hudBtn.textContent = 'replay';
    pingState();
  }

  function pingState() {
    if (hudState && hud.classList.contains('is-idle'))
      hudState.textContent = '● live · ' + (18 + Math.floor(Math.random() * 24)) + ' ms';
  }

  function stats(add = 0) {
    loc += add;
    if (!hud) return;
    hudLoc.textContent = loc.toLocaleString() + ' loc';
    const p = Math.min(100, Math.round(built / Math.max(1, total) * 100));
    hudPct.textContent = p + '%';
    hudBar.style.width = p + '%';
    if (!committed && built >= total && total > 0) {
      committed = true;
      log('git commit -m "portfolio: build complete"', 'v');
    }
  }

  const label = el => '<' + el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '') + '>';

  /* ---------- Typing engine ---------- */
  const GLYPHS = '{}[]<>/\\;=#$%&*+-';
  const scramble = s => s.replace(/\S/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);

  function textNodes(el) {
    const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (!n.nodeValue.trim()) continue;
      if (n.parentElement.closest('[aria-hidden="true"]') && !el.closest('[aria-hidden="true"]')) continue;
      out.push(n);
    }
    return out;
  }

  function typeText(el) {
    const nodes = textNodes(el);
    if (!nodes.length) return Promise.resolve();
    const mono = /JetBrains/i.test(getComputedStyle(el).fontFamily);
    const caret = Object.assign(document.createElement('span'), { className: 'tw-caret', ariaHidden: 'true' });
    const parts = nodes.map(node => {
      const s = node.nodeValue.replace(/\s+/g, ' ');
      const wrap = document.createElement('span'), done = document.createElement('span'),
            fx = Object.assign(document.createElement('span'), { className: 'tw-fx' }),
            ghost = Object.assign(document.createElement('span'), { className: 'tw-ghost', textContent: s });
      wrap.append(done, fx, ghost);
      node.replaceWith(wrap);
      return { node, s, wrap, done, fx, ghost };
    });
    const L = parts.reduce((a, p) => a + p.s.length, 0);
    const dur = Math.min(700, Math.max(140, L * 11)) / CONFIG.speed;

    return new Promise(res => {
      const t = performance.now();
      const draw = n => {
        let rem = n, active = null;
        for (const p of parts) {
          const k = Math.min(p.s.length, Math.max(0, rem)); rem -= p.s.length;
          const tail = p.s.slice(k);
          const isActive = !active && k < p.s.length;
          if (isActive) { active = p; p.wrap.insertBefore(caret, p.fx); }
          const fxLen = isActive && mono ? Math.min(2, tail.length) : 0;
          p.done.textContent = p.s.slice(0, k);
          p.fx.textContent = scramble(tail.slice(0, fxLen));
          p.ghost.textContent = tail.slice(fxLen);
        }
      };
      const finish = () => { parts.forEach(p => p.wrap.replaceWith(p.node)); caret.remove(); res(); };
      const tick = now => {
        if (skipped) return finish();
        const n = Math.floor(Math.min(1, (now - t) / dur) * L);
        if (n >= L) return finish();
        draw(n); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Builders ---------- */
  async function build(el) {
    if (el._built) return;
    el._built = true; built++;
    el.classList.remove('dev-pre');
    if (skipped) return stats();
    busy++;
    stats(Math.ceil((el.textContent.length || 40) / 8) + 2);
    if (el.matches(MEDIA)) {
      log('decode ' + label(el));
      el.classList.add('dev-scan'); await wait(560); el.classList.remove('dev-scan');
    } else {
      log('+ ' + label(el) + ' ' + el.textContent.trim().slice(0, 18));
      if (el.matches(POP)) el.classList.add('dev-pop');
      await typeText(el);
      el.classList.remove('dev-pop');
    }
    busy--;
  }

  async function runBox(box, units, delay) {
    await wait(delay);
    if (!skipped) {
      busy++;
      const r = box.getBoundingClientRect();
      box.dataset.dev = label(box) + ' ' + Math.round(r.width) + '×' + Math.round(r.height);
      box.classList.add('dev-wire');
      log('layout ' + label(box), 'v');
      await wait(330);
      box.classList.remove('dev-wire');
      box.classList.add('dev-flash');
      busy--;
    }
    for (const u of units) await build(u);
    built++; stats();
    box.classList.remove('dev-flash');
  }

  async function buildSection(sec) {
    if (sec._built) return;
    sec._built = true;
    const boxes = [...sec.querySelectorAll(BOXES)];
    const groups = new Map(boxes.map(b => [b, []]));
    const loose = [];
    sec.querySelectorAll(UNITS).forEach(u => {
      const b = u.closest(BOXES);
      (b && groups.has(b) ? groups.get(b) : loose).push(u);
    });
    if (sec.id) log('mount #' + sec.id, 'v');
    const tracks = boxes.map((b, i) => runBox(b, groups.get(b), Math.min(200 + i * 170, 1400)));
    for (const u of loose) await build(u);
    await Promise.all(tracks);
  }

  function skipAll() {
    skipped = true;
    waiters.forEach(f => f());
    document.querySelectorAll('main > section, footer, #site-header').forEach(buildSection);
    finishBoot();
    if (hud) hud.style.display = '';
    startLive();
  }

  /* ---------- Boot scene (robots, drone, IoT parts) ---------- */
  let sceneTimer;
  function buildScene() {
    if (!window.SRScene) return;
    const sc = SRScene.make('boot__scene');
    bootEl.insertBefore(sc, $('.boot__win', bootEl));
    sceneTimer = setInterval(() => sc._update(), 450);
  }

  /* ---------- Boot screen ---------- */
  const LINES = [
    ['Checking memory', '16384 KB'], ['Mounting /assets', '4 volumes'],
    ['Loading typefaces', 'JetBrains Mono · IBM Plex Sans'], ['Calibrating IoT sensors', '8/8 online'],
    ['Spinning up servo drivers', 'PWM 50 Hz'], ['Linking GitHub uplink', '24 ms'],
    ['Starting portfolio.service', 'pid 2026'],
  ];
  let bootEl;
  let bootDone = false;

  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    setTimeout(() => clearInterval(sceneTimer), 600);
    bootEl.classList.add('is-leaving');
    setTimeout(() => { bootEl.remove(); root.classList.remove('booting'); }, skipped ? 500 : 1100);
  }

  async function runBoot() {
    const win = $('.boot__win', bootEl), body = $('.boot__body', bootEl), bar = $('#bootBar');
    const add = html => { const d = document.createElement('div'); d.className = 'boot__line'; d.innerHTML = html; body.appendChild(d); };
    await wait(650);                                   // blank screen
    win.classList.add('is-open');                      // popup
    await wait(550);
    for (let i = 0; i < LINES.length; i++) {
      add('<span class="ok">[ OK ]</span> ' + LINES[i][0] + '<span class="dim">' + LINES[i][1] + '</span>');
      bar.style.width = Math.round((i + 1) / (LINES.length + 1) * 100) + '%';
      await wait(170 + Math.random() * 150);
    }
    add('<span class="cmd">$ npm run dev</span>');
    await wait(380);
    add('<span class="ok">ready</span><span class="dim">compiled in 312 ms</span>');
    bar.style.width = '100%';
    await wait(520);
  }

  /* ---------- Live feel after the build ---------- */
  let live = false;
  function startLive() {
    if (live) return; live = true;
    setInterval(pingState, 3000);
    if (!CONFIG.hmr) return;
    setInterval(() => {
      if (document.hidden || busy) return;
      const pool = [...document.querySelectorAll('.card, .storycard, main h2')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.top > 80 && r.bottom < innerHeight;
      });
      if (!pool.length) return;
      const el = pool[Math.floor(Math.random() * pool.length)];
      log('[HMR] hot update ' + label(el), 'v');
      el.classList.add('dev-hmr');
      setTimeout(() => el.classList.remove('dev-hmr'), 950);
    }, 16000);
  }

  /* ---------- Go ---------- */
  function init() {
    bootEl = document.getElementById('boot');
    if (!bootEl) return root.classList.remove('booting');
    buildScene();
    try { sessionStorage.setItem('sr-booted', '1'); } catch {}
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    root.classList.add('dev');

    const units = document.querySelectorAll(UNITS);
    units.forEach(u => u.classList.add('dev-pre'));
    total = units.length + document.querySelectorAll(BOXES).length;

    const skip = () => { if (!skipped) skipAll(); };
    bootEl.addEventListener('click', skip);
    addEventListener('keydown', e => { if (e.key === 'Escape' || bootEl.isConnected) skip(); }, { once: false });

    makeHud();
    if (hud) hud.style.display = 'none';

    runBoot().then(() => {
      if (skipped) return;
      finishBoot();
      if (hud) hud.style.display = '';
      buildSection($('#site-header'));
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { io.unobserve(e.target); buildSection(e.target); }
      }), { rootMargin: '0px 0px -12% 0px' });
      document.querySelectorAll('main > section, footer').forEach(s => io.observe(s));
      startLive();
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
