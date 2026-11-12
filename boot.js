/* ============================================================
   BOOT + LIVE BUILD
   1. black screen -> popup window -> system boot log
   2. the boot screen glitches out (RGB-split slices, jitter,
      flicker) and the page "compiles" itself underneath:
      text is typed, cards appear as wireframes then render,
      images decode with a scan.
   3. sections below the fold are built when you scroll to them
   ============================================================ */
(() => {
  const CONFIG = {
    alwaysPlay: true,   // false = full boot once per browser session, instant afterwards
    speed: 2,           // 1 = normal, 2 = twice as fast, 0.5 = slower
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

  let skipped = false, busy = 0;
  const waiters = new Set();
  const $ = (s, r = document) => r.querySelector(s);

  const wait = ms => new Promise(res => {
    if (skipped) return res();
    const fin = () => { clearTimeout(t); waiters.delete(fin); res(); };
    const t = setTimeout(fin, ms / CONFIG.speed);
    waiters.add(fin);
  });

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
      let lastN = -1;
      const tick = now => {
        if (skipped) return finish();
        const n = Math.floor(Math.min(1, (now - t) / dur) * L);
        if (n >= L) return finish();
        draw(n);
        if (n !== lastN) { lastN = n; if (window.SRSound && n % 2 === 0) SRSound.key(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Builders ---------- */
  async function build(el) {
    if (el._built) return;
    el._built = true;
    el.classList.remove('dev-pre');
    if (skipped) return;
    busy++;
    if (el.matches(MEDIA)) {
      el.classList.add('dev-scan'); await wait(560); el.classList.remove('dev-scan');
    } else {
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
      await wait(330);
      box.classList.remove('dev-wire');
      box.classList.add('dev-flash');
      busy--;
    }
    for (const u of units) await build(u);
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
    const tracks = boxes.map((b, i) => runBox(b, groups.get(b), Math.min(200 + i * 170, 1400)));
    for (const u of loose) await build(u);
    await Promise.all(tracks);
  }

  function skipAll() {
    skipped = true;
    waiters.forEach(f => f());
    document.querySelectorAll('main > section, footer, #site-header').forEach(buildSection);
    finishBoot();
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

  /* Glitch-out: the black backdrop is swapped for random horizontal
     slices. Each slice jitters sideways, flashes a signal colour and
     blinks out at its own moment, so the page shows through in torn
     patches instead of a clean wipe. All motion lives in boot.css. */
  function glitchOut(quick) {
    const bg = $('.boot__bg', bootEl);
    if (!bg) return;
    const COUNT = 16, HOT = ['var(--cyan)', 'var(--violet)', '#ffffff'];
    const weights = Array.from({ length: COUNT }, () => 0.4 + Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    const maxDelay = quick ? 0.2 : 0.45;
    const frag = document.createDocumentFragment();
    let y = 0;
    weights.forEach(w => {
      const h = w / sum * 100;
      const s = document.createElement('i');
      s.className = 'boot__strip';
      s.style.cssText =
        'top:' + y.toFixed(2) + '%;height:' + (h + 0.3).toFixed(2) + '%;' +
        '--dx:' + ((Math.random() * 2 - 1) * (8 + Math.random() * 14)).toFixed(1) + 'vw;' +
        '--t:' + (Math.random() * maxDelay).toFixed(2) + 's;' +
        '--dur:' + (quick ? 0.3 : 0.45) + 's;' +
        '--hot:' + HOT[Math.floor(Math.random() * HOT.length)] + ';';
      frag.appendChild(s);
      y += h;
    });
    bootEl.insertBefore(frag, bg);
    bg.remove();   // same frame: strips are black too, so nothing visibly changes yet
  }

  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    setTimeout(() => clearInterval(sceneTimer), 600);
    glitchOut(skipped);
    window.SRSound && SRSound.play('glitch');
    bootEl.classList.add('is-leaving');
    setTimeout(() => { bootEl.remove(); root.classList.remove('booting'); }, skipped ? 700 : 1000);
  }

  async function runBoot() {
    const win = $('.boot__win', bootEl), body = $('.boot__body', bootEl), bar = $('#bootBar');
    const add = html => { const d = document.createElement('div'); d.className = 'boot__line'; d.innerHTML = html; body.appendChild(d); };
    await wait(650);                                   // blank screen
    win.classList.add('is-open');                      // popup
    window.SRSound && SRSound.play('open');
    await wait(550);
    for (let i = 0; i < LINES.length; i++) {
      add('<span class="ok">[ OK ]</span> ' + LINES[i][0] + '<span class="dim">' + LINES[i][1] + '</span>');
      bar.style.width = Math.round((i + 1) / (LINES.length + 1) * 100) + '%';
      window.SRSound && SRSound.play('boot', i);
      await wait(170 + Math.random() * 150);
    }
    add('<span class="cmd">$ npm run dev</span>');
    await wait(380);
    add('<span class="ok">ready</span><span class="dim">compiled in 312 ms</span>');
    bar.style.width = '100%';
    window.SRSound && SRSound.play('ready');
    await wait(520);
  }

  /* ---------- Live feel after the build ---------- */
  let live = false;
  function startLive() {
    if (live) return; live = true;
    if (!CONFIG.hmr) return;
    setInterval(() => {
      if (document.hidden || busy) return;
      const pool = [...document.querySelectorAll('.card, .storycard, main h2')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.top > 80 && r.bottom < innerHeight;
      });
      if (!pool.length) return;
      const el = pool[Math.floor(Math.random() * pool.length)];
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

    document.querySelectorAll(UNITS).forEach(u => u.classList.add('dev-pre'));

    const skip = () => { if (!skipped) skipAll(); };
    bootEl.addEventListener('click', skip);
    addEventListener('keydown', e => { if (e.key === 'Escape' || bootEl.isConnected) skip(); });

    runBoot().then(() => {
      if (skipped) return;
      finishBoot();
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
