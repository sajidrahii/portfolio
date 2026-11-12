/* ============================================================
   THEME — dark · light · system
   The first paint is handled by the tiny inline script in
   <head> (so there is no flash). This file wires up the switch,
   remembers the choice and follows the OS when set to "system".
   ============================================================ */
(() => {
  const KEY = 'sr-theme';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const COLORS = { dark: '#05060A', light: '#F3F5FA' };

  const stored = () => {
    try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; }
    catch { return 'system'; }
  };
  const resolve = pref => pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;

  function apply(pref, animate) {
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
    const theme = resolve(pref);
    root.setAttribute('data-theme-pref', pref);
    root.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
    document.querySelectorAll('[data-theme-set]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.themeSet === pref)));
  }

  function choose(pref) {
    try { pref === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, pref); } catch {}
    apply(pref, true);
  }

  function init() {
    apply(stored(), false);
    document.querySelectorAll('[data-theme-set]').forEach(b =>
      b.addEventListener('click', () => choose(b.dataset.themeSet)));

    // follow the OS while in "system"
    const onOs = () => { if (stored() === 'system') apply('system', true); };
    mq.addEventListener ? mq.addEventListener('change', onOs) : mq.addListener(onOs);

    // keep several open tabs in sync
    addEventListener('storage', e => { if (e.key === KEY) apply(stored(), true); });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
