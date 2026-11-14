/* ============================================================
   PROJECT BOARDS
   Works for every <div class="project-board"> on the page.

   • Count label + "more below" fade stay in sync (as before).
   • If a board has the attribute `data-filter`, filter chips are built
     automatically from the data-cat="…" on its cards. A card can belong
     to several categories: data-cat="hardware ml".
     → To add a NEW category, just use a new word in data-cat. It shows up
       as a chip by itself. Optionally give it a nicer label in CATS below.
   ============================================================ */
(() => {
  /* key (as used in data-cat) → label shown on the chip. Order here = chip order. */
  const CATS = {
    hardware: 'Hardware',
    software: 'Software',
    ml: 'ML & Vision',
    iot: 'IoT',
    robotics: 'Robotics',
    design: 'Design',
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snd = n => window.SRSound && window.SRSound.play(n);
  const label = k => CATS[k] || k.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const rank = k => { const i = Object.keys(CATS).indexOf(k); return i < 0 ? 999 : i; };
  const catsOf = c => (c.dataset.cat || '').split(/\s+/).filter(Boolean);

  document.querySelectorAll('.project-board').forEach(board => {
    const scroller = board.querySelector('.project-scroller');
    if (!scroller) return;
    const cards = [...scroller.querySelectorAll('.project')];
    const count = board.dataset.count ? document.getElementById(board.dataset.count) : null;
    const bar = board.querySelector('.filter-bar');
    let active = 'all';

    const update = () => {
      const shown = cards.filter(c => !c.hidden).length;
      const overflow = scroller.scrollHeight > scroller.clientHeight + 4;
      const more = overflow && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 4;
      board.classList.toggle('has-more', more);
      if (count) {
        count.textContent = shown + (shown === 1 ? ' project' : ' projects') +
          (active !== 'all' ? ' in ' + label(active) : '') + (more ? ' · scroll for more' : '');
      }
    };

    function apply(key) {
      if (key === active) return;
      active = key;
      bar.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
      let i = 0;
      cards.forEach(c => {
        const show = key === 'all' || catsOf(c).includes(key);
        c.hidden = !show;
        c.classList.remove('is-entering');
        if (show) {
          c.style.setProperty('--i', i++);
          void c.offsetWidth;                       // restart the animation
          if (!reduced) c.classList.add('is-entering');
        }
      });
      scroller.scrollTop = 0;
      update();
      snd('tick');
    }

    if (bar && board.hasAttribute('data-filter')) {
      const keys = [];
      cards.forEach(c => catsOf(c).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
      keys.sort((a, b) => rank(a) - rank(b));
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Filter projects by category');
      [['all', 'All', cards.length]]
        .concat(keys.map(k => [k, label(k), cards.filter(c => catsOf(c).includes(k)).length]))
        .forEach(([k, text, n]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip';
          b.dataset.filter = k;
          b.setAttribute('aria-pressed', String(k === 'all'));
          const t = document.createElement('span'); t.textContent = text;
          const num = document.createElement('span'); num.className = 'chip__n'; num.textContent = n;
          b.append(t, num);
          bar.appendChild(b);
        });
      bar.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) apply(b.dataset.filter); });
    }

    scroller.addEventListener('scroll', update, { passive: true });
    scroller.addEventListener('load', update, true);   // images finishing loading change the height
    addEventListener('resize', update);
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(scroller);
    update();
  });
})();
