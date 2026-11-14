/* ============================================================
   CASE-STUDY PANELS
   Click a project card (or press Enter on its title) and a panel
   slides in with: demo video · interactive block diagram ·
   what I learned · links.

   HOW TO ADD ONE
   1. In index.html give the project title a button:
        <h3><button type="button" class="case-open" data-case="my-project">My project</button></h3>
   2. Add an entry to CASES below with the same key.
   Every part of an entry is optional — leave out `video`, `flow`,
   `embed` or `learned` and that section simply isn't shown.
   Links and tags are read from the card itself.
   ============================================================ */
(() => {
  const root = document.documentElement;
  const snd = n => window.SRSound && window.SRSound.play(n);

  /* ------------------------------------------------------------
     CONTENT — everything below is a first draft. Edit freely.
     ------------------------------------------------------------ */
  const CASES = {
    luscus: {
      title: 'Luscus',
      summary:
        'A computer-vision-based autonomous navigation system. An ESP32-CAM streams what it sees over Wi-Fi, ' +
        'a YOLO model finds objects in each frame, and the result decides how the motors drive.',

      // drop your recording at this path (mp4). Until then a placeholder is shown.
      // video: { src: 'assets/projects/luscus-demo.mp4', poster: 'assets/projects/Luscus.JPG' },

      flow: [
        { icon: 'cam', name: 'ESP32-CAM', sub: 'Capture', kind: 'Edge device',
          text: 'Grabs frames from the onboard camera and serves them as a JPEG stream. Resolution and quality are kept modest so the stream stays smooth.',
          io: ['In: the scene ahead', 'Out: JPEG frames'] },
        { icon: 'wifi', name: 'Wi-Fi', sub: 'Transport', kind: 'Network',
          text: 'Carries frames from the board to the machine running the model, and carries steering commands back. Latency here decides how fresh each decision is.',
          io: ['In: JPEG frames', 'Out: frames to the model, commands to the robot'] },
        { icon: 'yolo', name: 'YOLO', sub: 'Detect', kind: 'Inference',
          text: 'Runs object detection on each frame and returns bounding boxes with a class and a confidence score. Where a box sits in the frame tells the robot which way to turn.',
          io: ['In: one frame', 'Out: boxes, classes, confidence'] },
        { icon: 'motor', name: 'Motor control', sub: 'Act', kind: 'Actuation',
          text: 'Turns detections into drive commands such as forward, steer, slow or stop, and sends them to the motor driver. When frames stop arriving, the safe default is to stop.',
          io: ['In: drive commands', 'Out: wheel speed and direction'] },
      ],

      // DRAFT — replace these with your own lessons.
      learned: [
        'The Wi-Fi video link sets the speed limit for the whole loop, so frame size and JPEG quality are a trade between latency and detection quality.',
        'The ESP32-CAM is only the eyes. Detection runs off-board, and the robot just receives simple commands.',
        'A stop-by-default rule matters: no fresh frame or no confident detection should never mean "keep driving".',
        'Testing each stage alone first (camera, network, model, motors) made the full system far easier to debug.',
      ],
    },

    esp32s3camerastream: {
      title: 'Luscus',
      summary:
        'The ESP32-S3-N16R8 CAM Dev Board is a powerful microcontroller module with built-in Wi-Fi, Bluetooth, and camera support. It features a dual-core processor, 16MB Flash, and 8MB PSRAM for advanced AI and IoT applications. With its onboard USB, OV3660 camera interface, and rich GPIO support, it’s ideal for machine vision and smart automation. This guide will help you set up and start using the board quickly.',

      // drop your recording at this path (mp4). Until then a placeholder is shown.
      // video: { src: 'assets/projects/luscus-demo.mp4', poster: 'assets/projects/Luscus.JPG' },

      flow: [
        { icon: 'cam', name: 'ESP32-CAM', sub: 'Capture', kind: 'Edge device',
          text: 'Grabs frames from the onboard camera and serves them as a JPEG stream. Resolution and quality are kept modest so the stream stays smooth.',
          io: ['In: the scene ahead', 'Out: JPEG frames'] },
        { icon: 'wifi', name: 'Wi-Fi', sub: 'Transport', kind: 'Network',
          text: 'Carries frames from the board to the machine running the model, and carries steering commands back. Latency here decides how fresh each decision is.',
          io: ['In: JPEG frames', 'Out: frames to the model, commands to the robot'] },
      ],

      // DRAFT — replace these with your own lessons.
      learned: [
        'How to Engage in a Public Repository for Open-Source Contributions'
      ],
    },

    gontobbohin: {
      title: 'Gontobbohin',
      summary:
        'A creative concept that turns Bangladesh’s 64 districts into an interactive journey you can explore in the browser.',
      embed: { src: 'https://sajidrahii.github.io/gontobbohin/', label: 'Load live preview' },
      // learned: ['Add what you learned here…'],
    },
  };

  /* ------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------ */
  const ICONS = {
    cam:   '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="9" width="22" height="16" rx="3"/><circle cx="16" cy="17" r="4.5"/><path d="M11 9l1.5-3h7L21 9"/></svg>',
    wifi:  '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a17 17 0 0 1 24 0M8 17a11 11 0 0 1 16 0M12 22a5.5 5.5 0 0 1 8 0"/><circle cx="16" cy="26.5" r="1.2" fill="currentColor"/></svg>',
    yolo:  '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11V6h5M22 6h5v5M27 21v5h-5M10 26H5v-5"/><rect x="11" y="11" width="10" height="10" rx="2"/></svg>',
    motor: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="4"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8"/></svg>',
  };
  const CLOSE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function h(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function block(title, hint, ...children) {
    const s = h('section', 'case__block');
    const head = h('div', 'case__bhead');
    head.appendChild(h('h3', 'case__h', title));
    if (hint) head.appendChild(h('span', 'case__hint', hint));
    s.appendChild(head);
    s.append(...children);
    return s;
  }

  /* ------------------------------------------------------------
     Sections
     ------------------------------------------------------------ */
  function buildVideo(c) {
    const box = h('div', 'case__video');
    const ph = h('div', 'case__ph');
    ph.append(h('strong', null, 'Demo video not added yet'), h('span', null, 'Save it as ' + c.video.src + ' and it shows up here.'));

    const v = document.createElement('video');
    v.controls = true; v.playsInline = true; v.preload = 'metadata';
    if (c.video.poster) v.poster = c.video.poster;
    v.setAttribute('aria-label', c.title + ' demo video');
    const src = document.createElement('source');
    src.src = c.video.src; src.type = 'video/mp4';
    v.appendChild(src);
    // <source> errors don't bubble, but a capturing listener on the video still hears them
    v.addEventListener('error', () => box.classList.add('is-missing'), true);

    box.append(v, ph);
    return block('Demo', null, box);
  }

  function buildEmbed(c) {
    const box = h('div', 'case__video case__video--embed');
    const go = h('button', 'btn btn--ghost', c.embed.label || 'Load live preview');
    go.type = 'button';
    go.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = c.embed.src; f.loading = 'lazy';
      f.title = c.title + ' live preview';
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      box.textContent = '';
      box.appendChild(f);
    });
    const wrap = h('div', 'case__embed-start');
    wrap.append(h('span', null, 'Loads the live site inside this panel.'), go);
    box.appendChild(wrap);
    return block('Live preview', null, box);
  }

  function buildFlow(stages) {
    const flow = h('div', 'flow');
    flow.setAttribute('role', 'group');
    flow.setAttribute('aria-label', 'Interactive block diagram');
    const nodes = [], links = [];

    stages.forEach((s, i) => {
      const b = h('button', 'flow__node');
      b.type = 'button';
      const ico = h('span', 'flow__ico'); ico.innerHTML = ICONS[s.icon] || '';
      const txt = h('span', 'flow__txt');
      txt.append(h('span', 'flow__name', s.name), h('span', 'flow__sub', s.sub));
      b.append(ico, txt);
      b.addEventListener('click', () => { stop(); select(i); });
      flow.appendChild(b); nodes.push(b);

      if (i < stages.length - 1) {
        const l = h('span', 'flow__link');
        l.setAttribute('aria-hidden', 'true');
        l.appendChild(h('i', 'flow__packet'));
        flow.appendChild(l); links.push(l);
      }
    });

    const detail = h('div', 'flow__detail');
    detail.setAttribute('aria-live', 'polite');

    const play = h('button', 'btn btn--outline flow__play', '▶ Run pipeline');
    play.type = 'button';

    let cur = 0, timer = 0;

    function select(i) {
      cur = i;
      nodes.forEach((n, k) => n.setAttribute('aria-pressed', String(k === i)));
      links.forEach((l, k) => {
        l.classList.toggle('is-done', k < i);
        l.classList.toggle('is-live', k === i);
      });
      const s = stages[i];
      detail.textContent = '';
      const top = h('div', 'flow__dtop');
      top.append(h('span', 'tag tag--cyan', s.kind), h('h4', 'flow__dname', s.name));
      const io = h('ul', 'flow__io');
      (s.io || []).forEach(t => io.appendChild(h('li', null, t)));
      detail.append(top, h('p', 'flow__dtext', s.text), io);
    }

    function stop() {
      clearInterval(timer); timer = 0;
      play.textContent = '▶ Run pipeline';
    }
    function start() {
      play.textContent = '■ Stop';
      select((cur + 1) % stages.length);
      timer = setInterval(() => select((cur + 1) % stages.length), 1800);
    }
    play.addEventListener('click', () => (timer ? stop() : start()));

    select(0);
    const host = h('div', 'case__flow');
    host.append(flow, detail, play);
    host._stop = stop;
    return host;
  }

  function buildLearned(items) {
    const ul = h('ul', 'case__learned');
    items.forEach(t => ul.appendChild(h('li', null, t)));
    return ul;
  }

  /* ------------------------------------------------------------
     The dialog
     ------------------------------------------------------------ */
  let dlg = null, flowHost = null;

  function ensure() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'case';
    dlg.setAttribute('aria-labelledby', 'caseTitle');
    document.body.appendChild(dlg);
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });       // Esc
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });      // backdrop
    dlg.addEventListener('close', () => root.classList.remove('case-panel-open'));
    return dlg;
  }

  function render(id, c, card) {
    dlg.textContent = '';
    flowHost = null;

    const head = h('header', 'case__head');
    const titles = h('div', 'case__titles');
    const eyebrow = h('p', 'eyebrow');
    eyebrow.append(h('span', 'eyebrow__dot'), document.createTextNode('$ open ' + id + '.case'));
    const title = h('h2', 'case__title', c.title);
    title.id = 'caseTitle';
    titles.append(eyebrow, title);
    const x = h('button', 'case__close');
    x.type = 'button'; x.setAttribute('aria-label', 'Close case study'); x.innerHTML = CLOSE_SVG;
    x.addEventListener('click', close);
    head.append(titles, x);

    const body = h('div', 'case__scroll');
    body.appendChild(h('p', 'case__summary', c.summary));

    // tags straight from the card
    const tags = card ? [...card.querySelectorAll('.tag-list li')].map(li => li.textContent.trim()) : [];
    if (tags.length) {
      const row = h('div', 'case__tags');
      tags.forEach((t, i) => row.appendChild(h('span', 'tag ' + (i % 2 ? 'tag--violet' : 'tag--cyan'), t)));
      body.appendChild(row);
    }

    if (c.video) body.appendChild(buildVideo(c));
    if (c.embed) body.appendChild(buildEmbed(c));
    if (c.flow) {
      flowHost = buildFlow(c.flow);
      body.appendChild(block('How it works', 'select a stage or run the pipeline', flowHost));
    }
    if (c.learned && c.learned.length) body.appendChild(block('What I learned', null, buildLearned(c.learned)));

    // links come from the card, so there is only one place to maintain them
    const links = card ? [...card.querySelectorAll('.project__links a')].filter(a => {
      const href = a.getAttribute('href') || '';
      return href && href !== '#' && !href.startsWith('javascript');
    }) : [];
    if (links.length) {
      const row = h('div', 'case__links');
      links.forEach(a => {
        const l = h('a', 'btn btn--ghost', a.textContent.trim());
        l.href = a.href; l.target = '_blank'; l.rel = 'noopener';
        row.appendChild(l);
      });
      body.appendChild(row);
    }

    dlg.append(head, body);
  }

  function open(id, opener) {
    const c = CASES[id];
    if (!c) return;
    ensure();
    render(id, c, opener && opener.closest('.project'));
    root.classList.add('case-panel-open');
    dlg.showModal();
    dlg.querySelector('.case__scroll').scrollTop = 0;
    snd('open');
  }

  function close() {
    if (!dlg || !dlg.open || dlg.classList.contains('is-closing')) return;
    if (flowHost) flowHost._stop();
    snd('close');
    dlg.classList.add('is-closing');
    setTimeout(() => { dlg.classList.remove('is-closing'); dlg.close(); }, 220);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('.case-open');
    if (b) open(b.dataset.case, b);
  });
})();
