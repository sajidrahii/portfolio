/* ============================================================
   DESIGN & MOTION SHOWCASE
   • Before / after slider  → <figure class="ba" data-ba>
   • Looping motion reel    → <video data-reel>
   • Lightbox gallery       → <button class="shot" data-full="…">
   All content lives in index.html. This file only adds behaviour.
   Anything whose file is missing shows a labelled placeholder
   instead of a broken image, so the section never looks broken.
   ============================================================ */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snd = n => window.SRSound && window.SRSound.play(n);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ------------------------------------------------------------
     Placeholders for missing files
     ------------------------------------------------------------ */
  function watchMissing(img) {
    const host = img.parentElement;
    const mark = () => {
      host.classList.add('is-missing');
      host.dataset.ph = 'Add ' + (img.getAttribute('src') || 'an image');
    };
    img.addEventListener('error', mark);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) mark();
  }
  document.querySelectorAll('.ba__layer img, .shot img').forEach(watchMissing);

  /* ------------------------------------------------------------
     Before / after slider
     Drag with mouse or finger; arrow keys work too (a real
     <input type="range"> sits underneath for keyboard + screen readers).
     ------------------------------------------------------------ */
  document.querySelectorAll('[data-ba]').forEach(box => {
    const range = box.querySelector('.ba__range');
    let pos = 50, dragging = false, sweep = 0, touched = false;

    const set = v => {
      pos = clamp(v, 0, 100);
      box.style.setProperty('--pos', pos.toFixed(2));
      if (range) range.value = pos;
    };
    const fromEvent = e => {
      const r = box.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100);
    };
    const interrupt = () => { touched = true; cancelAnimationFrame(sweep); };

    box.addEventListener('pointerdown', e => {
      interrupt(); dragging = true;
      box.setPointerCapture(e.pointerId);
      box.classList.add('is-dragging');
      fromEvent(e);
    });
    box.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
    const end = () => { dragging = false; box.classList.remove('is-dragging'); };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    if (range) {
      range.addEventListener('input', () => { interrupt(); set(Number(range.value)); });
    }

    // one small sweep the first time it scrolls into view, as a hint that it's draggable
    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting && e.intersectionRatio > 0.6)) return;
        io.disconnect();
        if (touched) return;
        const t0 = performance.now(), dur = 1500;
        const frame = now => {
          const p = Math.min(1, (now - t0) / dur);
          set(50 + Math.sin(p * Math.PI * 2) * 28 * (1 - p * 0.3));
          if (p < 1 && !touched) sweep = requestAnimationFrame(frame); else if (!touched) set(50);
        };
        sweep = requestAnimationFrame(frame);
      }, { threshold: [0.6] });
      io.observe(box);
    }
    set(50);
  });

  /* ------------------------------------------------------------
     Motion reel — plays while visible, pauses when off-screen
     ------------------------------------------------------------ */
  document.querySelectorAll('[data-reel]').forEach(video => {
    const box = video.closest('.reel');
    const btn = box && box.querySelector('.reel__btn');
    let userPaused = false;

    video.muted = true; video.loop = true; video.playsInline = true;
    video.addEventListener('error', () => box && box.classList.add('is-missing'), true);

    const sync = () => {
      if (!btn) return;
      btn.setAttribute('aria-pressed', String(!video.paused));
      btn.setAttribute('aria-label', video.paused ? 'Play reel' : 'Pause reel');
    };
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    if (btn) btn.addEventListener('click', () => {
      userPaused = !video.paused;
      video.paused ? video.play().catch(() => {}) : video.pause();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting && !userPaused && !reduced) video.play().catch(() => {});
        else if (!e.isIntersecting) video.pause();
      }), { threshold: 0.4 }).observe(video);
    }
    sync();
  });

  /* ------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------ */
  const shots = [...document.querySelectorAll('.shot')];
  if (!shots.length) return;

  let lb = null, img, cap, count, idx = 0, startX = null;

  function build() {
    lb = document.createElement('dialog');
    lb.className = 'lightbox';
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button type="button" class="lb__btn lb__close" aria-label="Close viewer">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button type="button" class="lb__btn lb__prev" aria-label="Previous image">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="lb__btn lb__next" aria-label="Next image">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<figure class="lb__fig"><div class="lb__stage"><img class="lb__img" alt=""><p class="lb__missing"></p></div>' +
      '<figcaption class="lb__cap"></figcaption></figure><p class="lb__count" aria-live="polite"></p>';
    document.body.appendChild(lb);

    img = lb.querySelector('.lb__img');
    cap = lb.querySelector('.lb__cap');
    count = lb.querySelector('.lb__count');

    lb.querySelector('.lb__close').addEventListener('click', () => lb.close());
    lb.querySelector('.lb__prev').addEventListener('click', () => go(-1));
    lb.querySelector('.lb__next').addEventListener('click', () => go(1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb__fig') || e.target.classList.contains('lb__stage')) lb.close(); });
    lb.addEventListener('close', () => { document.documentElement.classList.remove('lb-open'); snd('close'); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    img.addEventListener('load', () => lb.classList.remove('is-missing'));
    img.addEventListener('error', () => {
      lb.classList.add('is-missing');
      lb.querySelector('.lb__missing').textContent = 'Add ' + (img.getAttribute('src') || 'an image');
    });

    // swipe
    lb.addEventListener('pointerdown', e => { startX = e.clientX; });
    lb.addEventListener('pointerup', e => {
      if (startX == null) return;
      const dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    });
  }

  function show(i) {
    idx = (i + shots.length) % shots.length;
    const s = shots[idx], thumb = s.querySelector('img');
    img.src = s.dataset.full || thumb.getAttribute('src');
    img.alt = thumb.alt || '';
    cap.textContent = s.dataset.caption || '';
    count.textContent = (idx + 1) + ' / ' + shots.length;
    // warm the neighbours
    [1, -1].forEach(d => {
      const n = shots[(idx + d + shots.length) % shots.length];
      const pre = new Image(); pre.src = n.dataset.full || n.querySelector('img').getAttribute('src');
    });
  }
  function go(d) { show(idx + d); snd('tick'); }

  shots.forEach((s, i) => s.addEventListener('click', () => {
    if (!lb) build();
    show(i);
    document.documentElement.classList.add('lb-open');
    lb.showModal();
    snd('open');
  }));
})();
