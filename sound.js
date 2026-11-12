/* ============================================================
   SOUND — everything is synthesised with the Web Audio API,
   so there are no audio files to download.

   • Muted by default. The choice is remembered in localStorage.
   • Browsers only allow audio after a click/tap/key press, so
     nothing can play before the first interaction.
   • Other scripts call:  SRSound.play('boot', i) · SRSound.key()
   ============================================================ */
(() => {
  const KEY = 'sr-sound';
  const root = document.documentElement;

  let on = false;
  try { on = localStorage.getItem(KEY) === 'on'; } catch {}

  let ctx = null, master = null, noiseBuf = null, unlocked = false, lastKey = 0;

  /* ---------- audio plumbing ---------- */
  function ensure() {
    if (!unlocked) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ f = 600, to = null, t = 0.08, type = 'sine', v = 0.05, delay = 0 }) {
    const c = ensure(); if (!c) return;
    const now = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (to) o.frequency.exponentialRampToValueAtTime(to, now + t);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    o.connect(g); g.connect(master);
    o.start(now); o.stop(now + t + 0.03);
  }

  function noise({ t = 0.02, v = 0.03, f = 3000, q = 1, type = 'bandpass', delay = 0 }) {
    const c = ensure(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.4), c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const now = c.currentTime + delay;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf;
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(now, Math.random() * 0.2); s.stop(now + t + 0.03);
  }

  /* ---------- the sound palette ---------- */
  const SOUNDS = {
    boot:  (i = 0) => tone({ f: 480 + i * 55, t: 0.07, v: 0.035 }),
    ready: () => { tone({ f: 660, to: 880, t: 0.16, v: 0.05 }); tone({ f: 990, t: 0.22, v: 0.045, delay: 0.12 }); },
    glitch: () => {
      noise({ t: 0.32, v: 0.05, f: 1800, q: 0.7, type: 'highpass' });
      tone({ f: 240, to: 50, t: 0.34, type: 'square', v: 0.025 });
      for (let i = 1; i < 5; i++) noise({ t: 0.04, v: 0.04, f: 900 + i * 700, q: 2, delay: i * 0.075 });
    },
    key:   () => noise({ t: 0.012, v: 0.03, f: 2200 + Math.random() * 1800, q: 0.9 }),
    tick:  () => tone({ f: 900, to: 700, t: 0.03, v: 0.025 }),
    open:  () => tone({ f: 420, to: 840, t: 0.16, type: 'triangle', v: 0.04 }),
    close: () => tone({ f: 700, to: 350, t: 0.14, type: 'triangle', v: 0.035 }),
    on:    () => { tone({ f: 523, t: 0.09, v: 0.05 }); tone({ f: 784, t: 0.14, v: 0.05, delay: 0.08 }); },
    off:   () => { tone({ f: 784, t: 0.08, v: 0.04 }); tone({ f: 523, t: 0.12, v: 0.04, delay: 0.07 }); },
  };

  function play(name, arg) {
    if (!on || document.hidden) return;
    const fn = SOUNDS[name];
    if (fn) fn(arg);
  }

  function key() {
    const now = performance.now();
    if (now - lastKey < 38) return;
    lastKey = now;
    play('key');
  }

  /* ---------- state + UI ---------- */
  const buttons = () => [document.getElementById('soundToggle'), document.getElementById('bootSound')].filter(Boolean);

  function refresh() {
    root.classList.toggle('sound-on', on);
    buttons().forEach(b => {
      b.setAttribute('aria-pressed', String(on));
      if (b.id === 'soundToggle') {
        b.setAttribute('aria-label', on ? 'Sound on. Click to mute' : 'Sound off. Click to turn on');
        b.title = on ? 'Sound on' : 'Sound off';
      } else {
        b.textContent = on ? 'sound: on' : 'sound: off';
      }
    });
  }

  function set(next) {
    unlocked = true;                     // a click/tap/key press has happened
    if (next === on) return;
    if (!next) play('off');              // say goodbye while still audible
    on = next;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    refresh();
    if (on) play('on');
  }

  const toggle = () => set(!on);

  function unlock() { unlocked = true; if (on) ensure(); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    addEventListener(ev, unlock, { capture: true, passive: true, once: true }));

  function bind() {
    buttons().forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggle(); }));
    refresh();

    // a quiet tick on interactive things
    document.addEventListener('click', e => {
      if (!on) return;
      if (e.target.closest('.btn, .pill-link, .view-cert, .nav__links a, .flow__node, .dock__seg button, .nav-toggle')) play('tick');
    });
  }

  window.SRSound = { play, key, toggle, set, isOn: () => on };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', bind) : bind();
})();
