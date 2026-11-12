/* ============================================================
   DRONE — follows the cursor, but lives on the background layer
   (z-index below every card, heading and button), so it can
   never cover anything. It shows through in the gaps and slides
   behind the cards.

   • Mouse: hovers around the pointer with a springy lag and
     banks into the direction it's flying.
   • Touch / idle: flies to wherever you tap, or wanders on its
     own when nothing has moved for a few seconds.
   • Reduced motion: switched off.
   ============================================================ */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SVG = `
    <svg viewBox="0 0 120 80" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <g class="dr-v">
        <ellipse class="dr-prop" cx="16"  cy="14" rx="14" ry="3"/>
        <ellipse class="dr-prop" cx="104" cy="14" rx="14" ry="3"/>
        <ellipse class="dr-prop" cx="36"  cy="8"  rx="9"  ry="2" opacity=".55"/>
        <ellipse class="dr-prop" cx="84"  cy="8"  rx="9"  ry="2" opacity=".55"/>
      </g>
      <g class="dr-c">
        <path d="M16 17L46 34M104 17L74 34M36 11L50 30M84 11L70 30"/>
        <rect x="42" y="30" width="36" height="16" rx="7"/>
        <circle cx="60" cy="53" r="5"/>
        <path d="M44 46l-5 11M76 46l5 11M35 59h17M68 59h17"/>
      </g>
      <circle class="dr-led" cx="72" cy="36" r="2"/>
    </svg>`;

  const el = document.createElement('div');
  el.className = 'drone';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="drone__bob">' + SVG + '</div>';
  document.body.appendChild(el);

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let x = innerWidth * 0.62, y = innerHeight * 0.3;
  let vx = 0, vy = 0, rot = 0;
  let tx = x, ty = y;
  let lastInput = 0, wanderAt = 0, last = performance.now();
  let w = 80, h = 53;

  const measure = () => { w = el.offsetWidth || 80; h = el.offsetHeight || w * 0.66; };
  measure();
  addEventListener('resize', measure);

  const aim = (cx, cy) => { tx = cx; ty = cy; lastInput = performance.now(); };
  addEventListener('pointermove', e => { if (e.pointerType !== 'touch') aim(e.clientX, e.clientY); }, { passive: true });
  addEventListener('pointerdown', e => aim(e.clientX, e.clientY), { passive: true });

  function tick(now) {
    const f = Math.min(48, now - last) / 16.67;
    last = now;

    // nobody is steering → wander
    if (now - lastInput > 3500 && now > wanderAt) {
      tx = rand(0.08, 0.92) * innerWidth;
      ty = rand(0.12, 0.85) * innerHeight;
      wanderAt = now + rand(2200, 4200);
    }

    // gentle hover jitter so it never looks parked
    const t = now / 1000;
    const gx = tx + Math.sin(t * 1.3) * 16;
    const gy = ty + Math.cos(t * 1.7) * 10;

    // spring + damping
    vx += (gx - x) * 0.035 * f;
    vy += (gy - y) * 0.035 * f;
    const damp = Math.pow(0.86, f);
    vx *= damp; vy *= damp;
    x += vx * f; y += vy * f;

    // bank into the direction of travel
    rot += (clamp(vx * 1.6, -26, 26) - rot) * Math.min(1, 0.12 * f);

    el.style.transform = 'translate3d(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
