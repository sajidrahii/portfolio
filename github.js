/* ============================================================
   GITHUB LIVE STATS
   Fills #ghBody with: repo / follower / star / contribution counts,
   a contribution heatmap, recent commits and a language mix.

   Data sources (all public, no token):
   • api.github.com             → profile, repos, commit search, events
   • github-contributions-api.jogruber.de
                                → the contribution calendar (GitHub's
                                  REST API does not expose it)

   Every part fails on its own: if the calendar service is down the
   heatmap is rebuilt from recent public activity; if GitHub is
   rate-limiting (60 requests/hour per visitor IP) the last good
   result is shown from a local cache, marked "cached".
   Change the username in index.html: <div id="ghBody" data-user="…">
   ============================================================ */
(() => {
  const body = document.getElementById('ghBody');
  if (!body) return;

  const USER = body.dataset.user || 'sajidrahii';
  const API = 'https://api.github.com';
  const CALENDAR = 'https://github-contributions-api.jogruber.de/v4/' + encodeURIComponent(USER) + '?y=last';
  const CACHE_KEY = 'sr-gh-v1:' + USER;
  const FRESH_MS = 30 * 60 * 1000;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LANG_COLORS = ['var(--cyan)', 'var(--violet)', 'var(--amber)', '#4f9dff', '#ff7aa8'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;       // always textContent: commit messages are untrusted
    return n;
  }
  const getJSON = async url => {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  const ago = iso => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    const steps = [[60, 'm'], [3600, 'h'], [86400, 'd'], [2592000, 'mo'], [31536000, 'y']];
    let out = 'just now';
    for (let i = 0; i < steps.length; i++) {
      if (s >= steps[i][0]) out = Math.floor(s / steps[i][0]) + steps[i][1] + ' ago';
    }
    return out;
  };
  const dayKey = d => d.toISOString().slice(0, 10);
  const levelFor = n => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);

  /* ---------- data ---------- */
  function fromEvents(events) {
    const days = {}, commits = [];
    (events || []).forEach(e => {
      if (e.type !== 'PushEvent') return;
      const day = e.created_at.slice(0, 10);
      const list = (e.payload && e.payload.commits) || null;
      days[day] = (days[day] || 0) + Math.max(1, list ? list.length : 1);
      (list || []).forEach(c => commits.push({
        msg: c.message, repo: e.repo.name.split('/').pop(), at: e.created_at,
        url: 'https://github.com/' + e.repo.name + '/commit/' + c.sha,
      }));
    });
    return { days, commits };
  }

  function calendarFromDays(days) {
    const out = [], end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    for (let i = 364; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86400000);
      const count = days[dayKey(d)] || 0;
      out.push({ date: dayKey(d), count, level: levelFor(count) });
    }
    return out;
  }

  async function load() {
    const [u, repos, search, cal] = await Promise.allSettled([
      getJSON(API + '/users/' + USER),
      getJSON(API + '/users/' + USER + '/repos?per_page=100&sort=pushed'),
      getJSON(API + '/search/commits?q=author:' + USER + '&sort=author-date&order=desc&per_page=6'),
      getJSON(CALENDAR),
    ]);

    const data = { at: Date.now(), profile: null, langs: null, stars: null, commits: null, recentRepos: null, calendar: null, calendarSource: null };

    if (u.status === 'fulfilled') data.profile = { repos: u.value.public_repos, followers: u.value.followers };

    if (repos.status === 'fulfilled' && Array.isArray(repos.value)) {
      const own = repos.value.filter(r => !r.fork);
      data.stars = own.reduce((a, r) => a + (r.stargazers_count || 0), 0);
      const tally = {};
      own.forEach(r => { if (r.language) tally[r.language] = (tally[r.language] || 0) + 1; });
      const total = Object.values(tally).reduce((a, b) => a + b, 0);
      data.langs = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, n]) => ({ name, pct: Math.round(n / total * 100) }));
      data.recentRepos = own.slice(0, 5).map(r => ({ name: r.name, url: r.html_url, at: r.pushed_at }));
    }

    if (search.status === 'fulfilled' && search.value.items && search.value.items.length) {
      data.commits = search.value.items.slice(0, 6).map(i => ({
        msg: i.commit.message, repo: i.repository.name, at: i.commit.author.date, url: i.html_url,
      }));
    }

    if (cal.status === 'fulfilled' && Array.isArray(cal.value.contributions) && cal.value.contributions.length) {
      data.calendar = cal.value.contributions.map(c => ({ date: c.date, count: c.count, level: c.level != null ? c.level : levelFor(c.count) }));
      data.calendarSource = 'calendar';
    }

    // fallbacks that need the events feed
    if (!data.calendar || !data.commits) {
      try {
        const ev = fromEvents(await getJSON(API + '/users/' + USER + '/events/public?per_page=100'));
        if (!data.calendar) { data.calendar = calendarFromDays(ev.days); data.calendarSource = 'events'; }
        if (!data.commits && ev.commits.length) data.commits = ev.commits.slice(0, 6);
      } catch (_) { /* leave as is */ }
    }

    const gotSomething = data.profile || data.calendar || data.commits || data.langs;
    if (!gotSomething) throw new Error('nothing loaded');
    return data;
  }

  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } };
  const writeCache = d => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} };

  /* ---------- rendering ---------- */
  function countUp(node, target) {
    if (reduced || target < 2) { node.textContent = target.toLocaleString(); return; }
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function statTile(label, value) {
    const t = el('div', 'gh__stat');
    const num = el('span', 'gh__num', '–');
    t.append(num, el('span', 'gh__lab', label));
    if (typeof value === 'number') countUp(num, value);
    return t;
  }

  let tip = null;
  function tooltip() {
    if (!tip) { tip = el('div', 'hm-tip'); tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip); }
    return tip;
  }

  function heatmap(cells, source) {
    const first = new Date(cells[0].date + 'T00:00:00Z');
    const pad = first.getUTCDay();                       // 0 = Sunday → columns start on Sunday
    const weeks = Math.ceil((pad + cells.length) / 7);
    const total = cells.reduce((a, c) => a + c.count, 0);

    const wrap = el('div', 'hm-wrap');
    wrap.style.setProperty('--w', weeks);

    // month labels
    const months = el('div', 'hm-months');
    months.setAttribute('aria-hidden', 'true');
    let lastMonth = -1, lastCol = -9;
    for (let col = 0; col < weeks; col++) {
      const idx = col * 7 - pad;
      const c = cells[Math.max(0, idx)];
      if (!c) continue;
      const m = new Date(c.date + 'T00:00:00Z').getUTCMonth();
      if (m !== lastMonth && col - lastCol >= 3) {
        const s = el('span', null, MONTHS[m]);
        s.style.gridColumn = String(col + 1);
        months.appendChild(s);
        lastCol = col;
      }
      lastMonth = m;
    }

    // the grid
    const grid = el('div', 'hm-grid');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', total + ' contributions in the last year');
    for (let i = 0; i < pad; i++) grid.appendChild(el('i', 'hm hm--blank'));
    cells.forEach((c, i) => {
      const n = el('i', 'hm');
      n.dataset.l = c.level;
      n.dataset.date = c.date;
      n.dataset.count = c.count;
      n.style.setProperty('--c', Math.floor((i + pad) / 7));
      grid.appendChild(n);
    });

    const legend = el('div', 'hm-legend');
    legend.setAttribute('aria-hidden', 'true');
    legend.appendChild(el('span', null, 'Less'));
    for (let l = 0; l <= 4; l++) { const s = el('i'); s.dataset.l = l; legend.appendChild(s); }
    legend.appendChild(el('span', null, 'More'));
    if (source === 'events') legend.prepend(el('span', 'hm-note', 'Based on recent public activity only'));

    // tooltip
    const show = e => {
      const n = e.target.closest && e.target.closest('.hm[data-date]');
      const t = tooltip();
      if (!n) { t.style.opacity = 0; return; }
      const d = new Date(n.dataset.date + 'T00:00:00Z');
      const c = Number(n.dataset.count);
      t.textContent = (c === 0 ? 'No contributions' : c + (c === 1 ? ' contribution' : ' contributions')) +
        ' · ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
      const r = n.getBoundingClientRect();
      t.style.left = (r.left + r.width / 2) + 'px';
      t.style.top = r.top + 'px';
      t.style.opacity = 1;
    };
    grid.addEventListener('pointerover', show);
    grid.addEventListener('pointerdown', show);
    grid.addEventListener('pointerleave', () => { tooltip().style.opacity = 0; });

    wrap.append(months, grid);
    const scroll = el('div', 'hm-scroll');
    scroll.appendChild(wrap);
    // start scrolled to "today" on narrow screens
    requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth; });
    return { scroll, legend, total };
  }

  function panel(title, meta) {
    const p = el('div', 'gh__panel');
    const head = el('div', 'gh__ph');
    head.append(el('h3', 'gh__pt', title));
    if (meta) head.append(el('span', 'gh__pm', meta));
    p.appendChild(head);
    return p;
  }

  function commitsPanel(data) {
    const list = el('div', 'gh__commits');
    if (data.commits && data.commits.length) {
      data.commits.forEach(c => {
        const a = el('a', 'gh__commit');
        a.href = c.url; a.target = '_blank'; a.rel = 'noopener';
        a.append(el('span', 'gh__msg', (c.msg || '').split('\n')[0]), el('span', 'gh__meta', c.repo + ' · ' + ago(c.at)));
        list.appendChild(a);
      });
      const p = panel('Recent commits', 'public repos');
      p.appendChild(list);
      return p;
    }
    if (data.recentRepos && data.recentRepos.length) {
      data.recentRepos.forEach(r => {
        const a = el('a', 'gh__commit');
        a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
        a.append(el('span', 'gh__msg', r.name), el('span', 'gh__meta', 'pushed ' + ago(r.at)));
        list.appendChild(a);
      });
      const p = panel('Recently pushed', 'repositories');
      p.appendChild(list);
      return p;
    }
    const p = panel('Recent commits');
    p.appendChild(el('p', 'gh__empty', 'No public commits to show yet.'));
    return p;
  }

  function langsBlock(langs) {
    const wrap = el('div', 'gh__langs');
    const bar = el('div', 'gh__langbar');
    const legend = el('div', 'gh__legend');
    langs.forEach((l, i) => {
      const seg = el('i'); seg.style.width = l.pct + '%'; seg.style.background = LANG_COLORS[i % LANG_COLORS.length];
      seg.title = l.name + ' · ' + l.pct + '%';
      bar.appendChild(seg);
      const item = el('span', null, l.name + ' ' + l.pct + '%');
      item.style.setProperty('--c', LANG_COLORS[i % LANG_COLORS.length]);
      legend.appendChild(item);
    });
    wrap.append(bar, legend);
    return wrap;
  }

  function render(data, stale) {
    body.textContent = '';
    body.setAttribute('aria-busy', 'false');

    // 1. headline numbers
    const stats = el('div', 'gh__stats');
    if (data.profile) {
      stats.appendChild(statTile('public repositories', data.profile.repos));
      stats.appendChild(statTile('followers', data.profile.followers));
    }
    if (data.stars != null) stats.appendChild(statTile('stars earned', data.stars));

    // 2. left column: heatmap + languages · right column: commits
    const main = el('div', 'gh__main');
    const left = el('div', 'gh__col');
    if (data.calendar) {
      const hm = heatmap(data.calendar, data.calendarSource);
      if (data.calendarSource === 'calendar') stats.appendChild(statTile('contributions, last year', hm.total));
      const p = panel('Contribution heatmap', 'last 12 months');
      p.append(hm.scroll, hm.legend);
      left.appendChild(p);
    }
    if (data.langs && data.langs.length) {
      const p = panel('Languages', 'share of public repositories');
      p.appendChild(langsBlock(data.langs));
      left.appendChild(p);
    }
    if (left.children.length) main.appendChild(left); else main.style.gridTemplateColumns = '1fr';
    main.appendChild(commitsPanel(data));
    if (stats.children.length) body.appendChild(stats);
    body.appendChild(main);

    // 4. footer
    const foot = el('div', 'gh__foot');
    const live = el('span', 'gh__live');
    live.append(el('i', 'gh__dot'), document.createTextNode(stale ? 'Cached from ' + ago(new Date(data.at).toISOString()) : 'Live from the GitHub API'));
    const link = el('a', 'gh__link', 'github.com/' + USER);
    link.href = 'https://github.com/' + USER; link.target = '_blank'; link.rel = 'noopener';
    foot.append(live, link);
    body.appendChild(foot);
  }

  function renderError() {
    body.textContent = '';
    body.setAttribute('aria-busy', 'false');
    const box = el('div', 'gh__error');
    box.appendChild(el('p', null, 'GitHub didn’t answer just now. The API allows only a few anonymous requests per hour, so this usually clears up on its own.'));
    const a = el('a', 'btn btn--outline', 'Open the profile on GitHub');
    a.href = 'https://github.com/' + USER; a.target = '_blank'; a.rel = 'noopener';
    box.appendChild(a);
    body.appendChild(box);
  }

  async function run() {
    const cached = readCache();
    if (cached && Date.now() - cached.at < FRESH_MS) return render(cached, false);
    try {
      const data = await load();
      writeCache(data);
      render(data, false);
    } catch (_) {
      cached ? render(cached, true) : renderError();
    }
  }

  // only call the API when the section is about to be seen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); run(); }
    }, { rootMargin: '400px 0px' });
    io.observe(body);
  } else run();
})();
