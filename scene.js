/* ============================================================
   SCENE — shared robotics / IoT artwork.
   SRScene.make(cls)  builds the artwork (used by the boot screen)
   The same artwork becomes the animated site background once the
   boot screen starts leaving (or immediately if there is no boot).
   ============================================================ */
(() => {
  const html = document.documentElement;

  function make(cls) {
    const pins = [...Array(5)].map((_, i) => { const p = 34 + i * 13; return `M${p} 24v-12M${p} 96v12M24 ${p}h-12M96 ${p}h12`; }).join('');
    const paths = ['M0 120H190L240 170H440', 'M1000 140H800L750 190H640', 'M0 480H150L200 430H340V390',
                   'M1000 470H850L800 520H620', 'M310 0V60L350 100H480', 'M700 600V545L660 505H540'];
    const vias = [[440, 170], [640, 190], [340, 390], [620, 520], [480, 100], [540, 505]];
    const packet = (id, c, dur, begin) => `<circle r="3" class="${c}" opacity="0"><set attributeName="opacity" to="1" begin="${begin}s" fill="freeze"/><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion></circle>`;
    const sc = document.createElement('div');
    sc.className = cls;
    sc.setAttribute('aria-hidden', 'true');
    sc.innerHTML = `
      <svg class="traces" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        ${paths.map((d, i) => `<path id="tp${i}" class="tr" pathLength="1" style="--d:${0.1 + i * 0.15}s" d="${d}"/>`).join('')}
        ${vias.map(([x, y]) => `<circle class="via" cx="${x}" cy="${y}" r="4"/>`).join('')}
        ${packet('tp0', 'fc', 3, 1.4)}${packet('tp1', 'fa', 3.4, 1.7)}${packet('tp2', 'fc', 3.2, 2)}${packet('tp3', 'fa', 3, 2.3)}
      </svg>
      <div class="bs-drone"><svg viewBox="0 0 120 130">
        <defs><linearGradient id="bsBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ee7d8" stop-opacity=".3"/><stop offset="1" stop-color="#6ee7d8" stop-opacity="0"/></linearGradient></defs>
        <polygon points="60,46 24,128 96,128" fill="url(#bsBeam)" stroke="none"/>
        <g class="c"><rect x="44" y="24" width="32" height="12" rx="5"/><circle cx="60" cy="41" r="4"/><path d="M44 28L20 22M76 28L100 22M50 36l-4 8M70 36l4 8M42 44h12M66 44h12"/></g>
        <g class="v"><ellipse class="prop" cx="16" cy="20" rx="14" ry="3"/><ellipse class="prop" cx="104" cy="20" rx="14" ry="3"/><ellipse class="prop" cx="34" cy="12" rx="9" ry="2" opacity=".5"/><ellipse class="prop" cx="86" cy="12" rx="9" ry="2" opacity=".5"/></g>
        <circle class="fa blink" cx="72" cy="30" r="1.8"/></svg><span class="bs-cap" data-k="alt"></span></div>
      <div class="bs-robot"><svg viewBox="0 0 120 140"><g class="c">
        <path d="M60 22V10"/><rect x="28" y="22" width="64" height="48" rx="12"/><rect x="19" y="38" width="7" height="16" rx="2"/><rect x="94" y="38" width="7" height="16" rx="2"/>
        <path d="M48 58q12 8 24 0M52 70v8M68 70v8"/><rect x="34" y="78" width="52" height="62" rx="10"/><path d="M34 90q-14 10-10 28"/><path d="M46 124h28"/></g>
        <circle class="fa blink" cx="60" cy="7" r="4"/><circle class="fcore pulse" cx="60" cy="102" r="7"/>
        <rect class="fc eye" x="42" y="38" width="11" height="13" rx="4"/><rect class="fc eye" x="67" y="38" width="11" height="13" rx="4"/>
        <g class="wave c"><path d="M86 88l22-14"/><circle cx="111" cy="72" r="4"/></g></svg></div>
      <div class="bs bs-say">hello, world</div>
      <div class="bs bs-arm"><svg viewBox="0 0 140 140"><g class="c"><rect x="46" y="126" width="48" height="10" rx="3"/><circle cx="70" cy="118" r="8"/></g>
        <g class="a1 v"><path d="M70 118V66" stroke-width="5"/><circle cx="70" cy="66" r="5"/>
        <g class="a2 c"><path d="M70 66V24" stroke-width="4"/><path d="M62 24h16M62 24v-12M78 24v-12"/></g></g></svg></div>
      <div class="bs bs-chip"><svg viewBox="0 0 120 120"><g class="c"><rect x="24" y="24" width="72" height="72" rx="6"/><path d="${pins}"/></g>
        <rect class="fcore pulse" x="42" y="42" width="36" height="36" rx="3"/><circle class="fa blink" cx="31" cy="31" r="2"/></svg></div>
      <div class="bs bs-wifi"><svg viewBox="0 0 120 90"><g class="c"><path class="w w1" d="M20 40Q60 2 100 40"/><path class="w w2" d="M34 54Q60 30 86 54"/><path class="w w3" d="M47 68Q60 57 73 68"/></g><circle class="fc" cx="60" cy="80" r="3.5"/></svg></div>
      <div class="bs bs-gears"><svg viewBox="0 0 60 60"><g class="spin v"><circle cx="30" cy="30" r="20" stroke-width="7" stroke-dasharray="4.488"/><circle cx="30" cy="30" r="12"/><circle cx="30" cy="30" r="3"/></g></svg>
        <svg viewBox="0 0 60 60"><g class="spin rev c"><circle cx="30" cy="30" r="20" stroke-width="7" stroke-dasharray="7.85"/><circle cx="30" cy="30" r="11"/><circle cx="30" cy="30" r="3"/></g></svg></div>
      <span class="bs bs-tag bs-t1" data-k="temp"></span><span class="bs bs-tag bs-t2" data-k="rssi"></span><span class="bs bs-tag bs-t3" data-k="servo"></span>`;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const fmt = { temp: () => rnd(26, 29).toFixed(1) + ' °C', rssi: () => '-' + Math.round(rnd(48, 60)) + ' dBm',
                  servo: () => Math.round(rnd(60, 120)) + '°', alt: () => 'alt ' + rnd(40, 46).toFixed(1) + ' m' };
    const update = (root = sc) => root.querySelectorAll('[data-k]').forEach(e => {
      const k = e.dataset.k, v = fmt[k]();
      e.textContent = k === 'alt' ? v : k + ' ' + v;
    });
    update();
    sc._update = update;
    return sc;
  }

  function background() {
    if (document.querySelector('.site-bg')) return;
    const src = make('');
    const pick = s => src.querySelector(s);
    const d1 = pick('.bs-drone'), d2 = d1.cloneNode(true);
    d1.classList.add('sb-d1'); d2.classList.add('sb-d2');
    const layer = document.createElement('div');
    layer.className = 'site-bg';
    layer.setAttribute('aria-hidden', 'true');
    layer.append(pick('.traces'), d1, d2, ...['.bs-robot', '.bs-arm', '.bs-chip', '.bs-wifi', '.bs-gears'].map(pick));
    document.body.appendChild(layer);
    requestAnimationFrame(() => layer.classList.add('is-on'));

    const upd = () => { if (!document.hidden) src._update(layer); };
    upd(); setInterval(upd, 700);

    let raf = 0;   // gentle scroll parallax, read by CSS as --sy
    addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(() => { layer.style.setProperty('--sy', scrollY); raf = 0; });
    }, { passive: true });
  }

  function arm() {
    const boot = document.getElementById('boot');
    const ready = () => !html.classList.contains('booting') || !boot || boot.classList.contains('is-leaving');
    if (ready()) return background();
    const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); background(); } });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    mo.observe(boot, { attributes: true, attributeFilter: ['class'] });
  }

  window.SRScene = { make };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', arm) : arm();
})();
