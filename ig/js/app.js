/* STEP x Instagram mock: rendering and interactions. No libraries. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I = window.ICON;
  const P = window.PROFILE;
  const POSTS = window.POSTS;
  const HL = window.HIGHLIGHTS;
  const FAQ = window.FAQ;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phoneMQ = window.matchMedia('(max-width: 520px)');

  const screen = $('#screen');
  const device = $('#device');
  const fitBox = $('#deviceFit');
  const sideCtl = $('#sideCtl');
  const profile = $('#profile');
  const grid = $('#grid');
  const themeMeta = $('meta[name="theme-color"]');

  const state = { scale: 1, following: false, liked: {}, tab: 'posts', list: POSTS, myComments: {} };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('ru-RU');
  const plain = (html) => html.replace(/<br\s*\/?>/g, ' ');
  // Russian typography: keep short prepositions and conjunctions with the next word
  const NB_RE = /(^|[\s>(«])([вксоуаиВКСОУАИ]|на|по|за|до|из|от|для|не|но|На|По|За|До|Из|От|Для|Не) /g;
  const nb = (s) => String(s).replace(NB_RE, '$1$2 ').replace(NB_RE, '$1$2 ');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function paintIcons(root) {
    $$('[data-icon]', root || document).forEach((el) => {
      const svg = I[el.dataset.icon];
      if (svg && !el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', svg);
    });
  }

  /* ---------- fit the phone into the laptop screen ---------- */
  const DEV_W = 414;
  const DEV_H = 868;
  function fit() {
    if (phoneMQ.matches) {
      state.scale = 1;
      device.style.transform = '';
      fitBox.style.width = '';
      fitBox.style.height = '';
      return;
    }
    const s = Math.min(1, (window.innerHeight - 36) / DEV_H, (window.innerWidth - 24) / DEV_W);
    state.scale = s;
    device.style.transform = `scale(${s})`;
    fitBox.style.width = `${DEV_W * s}px`;
    fitBox.style.height = `${DEV_H * s}px`;
  }

  /* ---------- profile ---------- */
  function renderBio() {
    const raw = P.bio.join('\n');
    if (raw.length > 150) console.warn(`Bio is ${raw.length} characters, Instagram allows 150`);
    $('#pBio').innerHTML = P.bio
      .map((line) => esc(line).replace(/@([\w.]+)/g, '<a class="mention" href="#" data-act="coach">@$1</a>'))
      .join('\n');
  }

  function renderHighlights() {
    $('#hlRow').innerHTML = HL.map((h, i) => `
      <button type="button" class="hl" data-hl="${i}" aria-label="Актуальное: ${esc(h.label)}">
        <span class="hl-ring"><span class="hl-cover">${I[h.icon]}</span></span>
        <span class="hl-label">${esc(h.label)}</span>
      </button>`).join('');
  }

  // Cover formats. ctx: 'tile' (3:4 grid), 'tall' (9:16 Reels tab), 'full' (reel viewer)
  function coverHTML(p, ctx) {
    const full = ctx === 'full' ? ' cover--full' : '';
    if (p.kind === 'reel') {
      return `<div class="cover cover--pinned${full}"><img class="cover-img" src="${p.img}" alt="" style="object-position:40% 30%">
        <div class="cover-shade"></div>
        <div class="cover-copy"><div class="pin-num">Ему 6.</div><div class="pin-sub">И он только что бросил тренера</div></div></div>`;
    }
    if (p.kind === 'toon') {
      return `<div class="cover cover--toon${full}"><img class="cover-img" src="${p.img}" alt="" style="object-position:50% 42%">
        <div class="toon-bubble"><span>${nb(esc(p.bubble))}</span></div>
        <div class="cover-shade cover-shade--soft"></div>
        <div class="cover-copy"><div class="kicker"><i></i><span>${esc(p.tag)}</span></div><div class="cover-title cover-title--sm">${esc(p.title)}</div></div></div>`;
    }
    if (p.kind === 'type') {
      return `<div class="cover cover--type${full}"><div class="type-wrap"><div class="kicker kicker--ink"><i></i><span>${esc(p.tag)}</span></div>
        <div class="type-big">И ни<br>одного<br>удара<b>.</b></div>
        <div class="type-sub">${esc(p.sub)}</div></div></div>`;
    }
    if (p.kind === 'app') {
      return `<div class="cover cover--app${full}"><div class="app-copy"><div class="kicker kicker--dark"><i></i><span>${esc(p.tag)}</span></div>
        <div class="app-title">Прогресс ребенка в&nbsp;телефоне</div></div>
        <div class="app-phone"><img src="${p.img}" alt="" decoding="async"></div></div>`;
    }
    const band = p.tag === 'Турнир' ? ' cover--band' : '';
    const src = `img/posts/${p.id}${ctx === 'tall' ? '-tall' : ''}.webp`;
    return `<div class="cover${band}"><img class="cover-img" src="${src}" alt="" loading="lazy" decoding="async">
      <div class="cover-shade"></div>
      <div class="cover-copy"><div class="kicker"><i></i><span>${esc(p.tag)}</span></div>
      <div class="cover-title">${p.title}</div></div></div>`;
  }

  function renderGrid() {
    const tab = state.tab;
    const tall = tab === 'reels';
    const list = tab === 'tagged' ? POSTS.filter((p) => p.collab) : POSTS;
    state.list = list;
    grid.classList.toggle('grid--tall', tall);
    grid.setAttribute('aria-label', { posts: 'Публикации', reels: 'Reels', tagged: 'Отметки' }[tab]);
    grid.innerHTML = list.map((p, i) => {
      let badge = '';
      if (!tall) badge = p.pinned && tab === 'posts'
        ? `<span class="tile-badge tile-badge--pin" aria-hidden="true">${I.pinFill}</span>`
        : `<span class="tile-badge" aria-hidden="true">${I.reels}</span>`;
      const views = tall ? `<span class="tile-views" aria-hidden="true">${I.play}${esc(p.views)}</span>` : '';
      const label = `Рилс: ${plain(p.title)}${p.pinned && tab === 'posts' ? ', закреплен' : ''}`;
      let cls = 'tile';
      if (p.kind === 'app') cls += ' tile--light';
      else if (p.tag === 'Турнир' && !p.kind) cls += ' tile--band';
      return `<button type="button" class="${cls}" data-post="${i}" aria-label="${esc(label)}">${coverHTML(p, tall ? 'tall' : 'tile')}${badge}${views}</button>`;
    }).join('');
  }

  function setTab(tab) {
    if (tab === state.tab) return;
    state.tab = tab;
    const order = ['posts', 'reels', 'tagged'];
    $$('.p-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('.p-tabs').style.setProperty('--tab', order.indexOf(tab));
    renderGrid();
    grid.classList.remove('is-swap');
    void grid.offsetWidth;
    grid.classList.add('is-swap');
    const tabsTop = $('.p-tabs').offsetTop - $('.topbar').offsetHeight;
    if (profile.scrollTop > tabsTop) profile.scrollTop = tabsTop;
  }

  function setFollow(on) {
    state.following = on;
    const btn = $('#followBtn');
    btn.textContent = on ? 'Вы подписаны' : 'Подписаться';
    btn.classList.toggle('is-on', on);
    $('#statFollowers').textContent = fmt(P.followers + (on ? 1 : 0));
    $$('.reel-follow').forEach((b) => {
      b.textContent = on ? 'Вы подписаны' : 'Подписаться';
      b.classList.toggle('is-on', on);
    });
  }

  /* ---------- toast ---------- */
  let toastTimer = 0;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- overlays ---------- */
  function overlayOpen() { return !$('#story').hidden || !$('#reels').hidden; }

  function setDark(on) {
    screen.classList.toggle('is-dark', on);
    if (themeMeta) themeMeta.setAttribute('content', on ? '#000000' : '#ffffff');
  }

  let coverTimer = 0;

  function originFrom(el) {
    if (!el || !el.getBoundingClientRect) return '50% 50%';
    const sr = screen.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = (r.left + r.width / 2 - sr.left) / state.scale;
    const y = (r.top + r.height / 2 - sr.top) / state.scale;
    return `${Math.round(x)}px ${Math.round(y)}px`;
  }

  function showOverlay(el, originEl) {
    el.style.transformOrigin = originFrom(originEl);
    el.classList.remove('is-closing', 'is-open');
    el.hidden = false;
    setDark(true);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    // once the overlay covers the screen, stop painting the profile underneath
    clearTimeout(coverTimer);
    coverTimer = setTimeout(() => { if (overlayOpen()) screen.classList.add('is-covered'); }, reduce.matches ? 0 : 340);
  }

  function hideOverlay(el, done) {
    clearTimeout(coverTimer);
    screen.classList.remove('is-covered');
    let finished = false;
    const end = () => {
      if (finished) return;
      finished = true;
      el.hidden = true;
      el.classList.remove('is-closing');
      if (!overlayOpen()) setDark(false);
      updateSide();
      if (done) done();
    };
    el.classList.add('is-closing');
    el.classList.remove('is-open');
    if (reduce.matches) { end(); return; }
    el.addEventListener('transitionend', function h(ev) {
      if (ev.target !== el) return;
      el.removeEventListener('transitionend', h);
      end();
    });
    setTimeout(end, 320);
  }

  function updateSide() {
    sideCtl.classList.toggle('for-story', !$('#story').hidden);
    sideCtl.classList.toggle('for-reels', !$('#reels').hidden && $('#story').hidden);
  }

  /* ---------- story viewer ---------- */
  const story = { el: $('#story'), card: $('#storyCard'), g: 0, s: 0, dur: 6000, elapsed: 0, last: 0, raf: 0, held: false, opener: null, liked: false };

  function storyPaused() { return story.held || sheetIsOpen() || document.hidden; }

  function renderStory() {
    const h = HL[story.g];
    const slide = h.slides[story.s];
    $('#storyBars').innerHTML = h.slides
      .map((_, i) => `<span><i style="transform:scaleX(${i < story.s ? 1 : 0})"></i></span>`).join('');
    $('#storyAva').innerHTML = I[h.icon];
    $('#storyLabel').textContent = h.label;
    story.el.setAttribute('aria-label', `Актуальное: ${h.label}`);
    const box = $('#storySlide');
    box.innerHTML = nb(slide.html);
    box.classList.remove('is-in');
    void box.offsetWidth;
    box.classList.add('is-in');
    story.dur = slide.dur * 1000;
    story.elapsed = 0;
    // warm up the next slide image
    const next = h.slides[story.s + 1] || (HL[story.g + 1] && HL[story.g + 1].slides[0]);
    if (next) {
      const m = next.html.match(/src="([^"]+\.webp)"/);
      if (m) { const im = new Image(); im.src = m[1]; }
    }
  }

  function tick(now) {
    if (!storyPaused()) story.elapsed += now - story.last;
    story.last = now;
    const p = Math.min(1, story.elapsed / story.dur);
    const bar = $$('#storyBars i')[story.s];
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (p >= 1) { nextSlide(); return; }
    story.raf = requestAnimationFrame(tick);
  }

  function runStory() {
    cancelAnimationFrame(story.raf);
    story.last = performance.now();
    story.raf = requestAnimationFrame(tick);
  }

  function openStory(g, originEl) {
    if (!$('#reels').hidden) closeReels(true);
    story.g = clamp(g, 0, HL.length - 1);
    story.s = 0;
    story.opener = originEl || document.activeElement;
    renderStory();
    showOverlay(story.el, originEl);
    updateSide();
    runStory();
    setTimeout(() => story.el.focus({ preventScroll: true }), 60);
  }

  function closeStory() {
    cancelAnimationFrame(story.raf);
    if (sheetIsOpen()) closeSheet(true);
    hideOverlay(story.el, () => { $('#storySlide').innerHTML = ''; });
    if (story.opener && story.opener.focus) story.opener.focus({ preventScroll: true });
  }

  function nextSlide() {
    const h = HL[story.g];
    if (story.s < h.slides.length - 1) story.s += 1;
    else if (story.g < HL.length - 1) { story.g += 1; story.s = 0; }
    else { closeStory(); return; }
    renderStory();
    runStory();
  }

  function prevSlide() {
    if (story.s > 0) story.s -= 1;
    else if (story.g > 0) { story.g -= 1; story.s = HL[story.g].slides.length - 1; }
    renderStory();
    runStory();
  }

  function jumpGroup(d) {
    const g = story.g + d;
    if (g < 0) { story.s = 0; renderStory(); runStory(); return; }
    if (g >= HL.length) { closeStory(); return; }
    story.g = g;
    story.s = 0;
    renderStory();
    runStory();
  }

  // tap left/right, hold to pause, swipe down to close, swipe sideways for the next highlight
  (function storyGestures() {
    const card = story.card;
    let ptr = null;
    let holdTimer = 0;
    const reset = () => {
      clearTimeout(holdTimer);
      story.held = false;
      story.el.classList.remove('is-held');
      card.style.transition = 'transform 260ms var(--ease-out)';
      card.style.transform = '';
    };
    card.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button > 0 || e.target.closest('button, a')) return;
      ptr = { x: e.clientX, y: e.clientY, id: e.pointerId };
      card.style.transition = 'none';
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      holdTimer = setTimeout(() => {
        story.held = true;
        story.el.classList.add('is-held');
      }, 230);
    });
    card.addEventListener('pointermove', (e) => {
      if (!ptr || e.pointerId !== ptr.id) return;
      const dy = (e.clientY - ptr.y) / state.scale;
      const dx = (e.clientX - ptr.x) / state.scale;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(holdTimer);
      if (dy > 0 && dy > Math.abs(dx) && !reduce.matches) {
        card.style.transform = `translateY(${dy * 0.55}px) scale(${1 - Math.min(dy, 400) / 2400})`;
      }
    });
    const up = (e) => {
      if (!ptr || e.pointerId !== ptr.id) return;
      const dx = (e.clientX - ptr.x) / state.scale;
      const dy = (e.clientY - ptr.y) / state.scale;
      const wasHeld = story.held;
      ptr = null;
      reset();
      if (e.type === 'pointercancel') return;
      if (dy > 90 && dy > Math.abs(dx)) { closeStory(); return; }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { jumpGroup(dx < 0 ? 1 : -1); return; }
      if (wasHeld || Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
      const r = card.getBoundingClientRect();
      if ((e.clientX - r.left) / r.width < 0.3) prevSlide(); else nextSlide();
    };
    card.addEventListener('pointerup', up);
    card.addEventListener('pointercancel', up);
    card.addEventListener('contextmenu', (e) => e.preventDefault());
  })();

  /* ---------- reels viewer ---------- */
  const reels = { el: $('#reels'), feed: $('#reelsFeed'), list: [], idx: 0, io: null, userPaused: false, video: 'unknown', opener: null };
  let lastTap = null;

  function likeCount(p) { return p.likes + (state.liked[p.id] ? 1 : 0); }
  function commentCount(p) { return p.comments + (state.myComments[p.id] ? 1 : 0); }

  function reelHTML(p, i) {
    const liked = !!state.liked[p.id];
    let media;
    if (p.kind === 'reel') media = `<img src="${p.img}" alt="${esc(plain(p.title))}">`;
    else if (p.kind) media = `<div class="reel-cover" role="img" aria-label="${esc(plain(p.title))}">${coverHTML(p, 'full')}</div>`;
    else media = `<img src="img/posts/${p.id}-full.webp" alt="${esc(plain(p.title))}" decoding="async">`;
    let second = '';
    if (p.collab === 'nurassylsensei') second = '<span class="reel-ava reel-ava2"><img src="img/coach-face.webp" alt=""></span>';
    else if (p.collab) second = '<span class="reel-ava reel-ava2 reel-ava2--blank"></span>';
    const user = p.collab ? `step.jiu.jitsu <span>и</span> ${esc(p.collab)}` : 'step.jiu.jitsu';
    const fl = state.following;
    const light = p.kind === 'app' || p.kind === 'reel' || p.kind === 'toon';
    return `<article class="reel${light ? ' is-light' : ''}" data-i="${i}" aria-label="${esc(plain(p.title))}">
      <div class="reel-media">${media}</div>
      <div class="reel-shade"></div>
      <div class="reel-flash" aria-hidden="true"></div>
      <div class="reel-info">
        <div class="reel-author"><span class="reel-ava"><img src="img/step-logo.svg" alt=""></span>${second}
          <span class="reel-user">${user}</span>
          <button type="button" class="reel-follow${fl ? ' is-on' : ''}" data-act="follow">${fl ? 'Вы подписаны' : 'Подписаться'}</button></div>
        <p class="reel-cap" data-act="cap">${nb(esc(p.caption))}</p>
        <div class="reel-audio">${I.music}<span>step.jiu.jitsu · Оригинальное аудио</span></div>
      </div>
      <div class="reel-rail">
        <button type="button" class="rail-btn${liked ? ' is-on' : ''}" data-act="like" aria-label="Нравится" aria-pressed="${liked}">${liked ? I.heartFill : I.heart}<span>${fmt(likeCount(p))}</span></button>
        <button type="button" class="rail-btn" data-act="comments" aria-label="Комментарии">${I.comment}<span>${fmt(commentCount(p))}</span></button>
        <button type="button" class="rail-btn" data-act="repost" aria-label="Репост">${I.repost}<span>${p.reposts ? fmt(p.reposts) : ''}</span></button>
        <button type="button" class="rail-btn" data-act="share" aria-label="Поделиться">${I.direct}<span>${fmt(p.shares)}</span></button>
        <button type="button" class="rail-btn" data-act="about" aria-label="Еще">${I.more}</button>
        <span class="rail-thumb" aria-hidden="true"><img src="img/step-logo.svg" alt=""></span>
      </div>
      <div class="reel-progress" aria-hidden="true"><i></i></div>
    </article>`;
  }

  function reelEl(i) { return reels.feed.children[i]; }

  function setActiveReel(i) {
    reels.idx = i;
    Array.from(reels.feed.children).forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      const v = el.querySelector('video');
      if (v && k !== i) v.pause();
    });
    const p = reels.list[i];
    if (p && p.video) ensureVideo(reelEl(i), p);
    // preload neighbours
    [i - 1, i + 1].forEach((k) => {
      const el = reelEl(k);
      const im = el && el.querySelector('.reel-media > img');
      if (im) im.loading = 'eager';
    });
  }

  function ensureVideo(el, p) {
    if (!el || reels.video === 'missing') return;
    let v = el.querySelector('video');
    if (v) {
      if (reels.video === 'ok' && !reels.userPaused && !sheetIsOpen()) v.play().catch(() => {});
      return;
    }
    v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', `Рилс: ${p.title}`);
    if (p.img) v.poster = p.img;
    v.preload = 'auto';
    v.addEventListener('loadeddata', () => {
      reels.video = 'ok';
      el.classList.add('has-video');
      if (el.classList.contains('is-active') && !reels.userPaused) v.play().catch(() => {});
    });
    v.addEventListener('error', () => { reels.video = 'missing'; v.remove(); }, { once: true });
    v.addEventListener('timeupdate', () => {
      const bar = el.querySelector('.reel-progress i');
      if (bar && v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`;
    });
    v.src = p.video;
    el.querySelector('.reel-media').appendChild(v);
  }

  function openReels(i, list, originEl) {
    if (!story.el.hidden) closeStory();
    reels.list = list || POSTS;
    reels.opener = originEl || document.activeElement;
    reels.userPaused = false;
    reels.el.classList.remove('is-paused');
    reels.feed.innerHTML = reels.list.map(reelHTML).join('');
    showOverlay(reels.el, originEl);
    updateSide();
    reels.feed.scrollTop = i * reels.feed.clientHeight;
    setActiveReel(i);
    if (reels.io) reels.io.disconnect();
    reels.io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          const k = Number(en.target.dataset.i);
          if (k !== reels.idx) setActiveReel(k);
        }
      });
    }, { root: reels.feed, threshold: [0.6] });
    Array.from(reels.feed.children).forEach((el) => reels.io.observe(el));
    setTimeout(() => reels.el.focus({ preventScroll: true }), 60);
  }

  function closeReels(quick) {
    if (reels.io) { reels.io.disconnect(); reels.io = null; }
    $$('video', reels.feed).forEach((v) => v.pause());
    if (sheetIsOpen()) closeSheet(true);
    const done = () => { reels.feed.innerHTML = ''; };
    if (quick) { reels.el.hidden = true; reels.el.classList.remove('is-open'); done(); updateSide(); if (!overlayOpen()) screen.classList.remove('is-covered'); return; }
    hideOverlay(reels.el, done);
    if (reels.opener && reels.opener.focus) reels.opener.focus({ preventScroll: true });
  }

  function goReel(d) {
    const n = clamp(reels.idx + d, 0, reels.list.length - 1);
    if (n === reels.idx) return;
    reels.feed.scrollTo({ top: n * reels.feed.clientHeight, behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  function syncReelsPause() {
    const paused = reels.userPaused || sheetIsOpen();
    reels.el.classList.toggle('is-paused', paused);
    const el = reelEl(reels.idx);
    const v = el && el.querySelector('video');
    if (v && reels.video === 'ok') { if (paused) v.pause(); else v.play().catch(() => {}); }
  }

  function flash(el, icon) {
    const f = el.querySelector('.reel-flash');
    f.innerHTML = I[icon];
    f.classList.remove('show');
    void f.offsetWidth;
    f.classList.add('show');
  }

  function setLike(reel, on, pop) {
    const p = reels.list[Number(reel.dataset.i)];
    state.liked[p.id] = on;
    const b = reel.querySelector('[data-act="like"]');
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `${on ? I.heartFill : I.heart}<span>${fmt(likeCount(p))}</span>`;
    if (pop && on) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  }

  function singleTap(reel) {
    const v = reel.querySelector('video');
    if (v && reels.video === 'ok') {
      v.muted = !v.muted;
      flash(reel, v.muted ? 'mute' : 'sound');
      return;
    }
    reels.userPaused = !reels.userPaused;
    syncReelsPause();
    flash(reel, reels.userPaused ? 'pause' : 'playFill');
  }

  function doubleTap(reel, e) {
    const r = reel.getBoundingClientRect();
    const b = document.createElement('div');
    b.className = 'burst';
    b.innerHTML = I.heartFill;
    b.style.left = `${(e.clientX - r.left) / state.scale}px`;
    b.style.top = `${(e.clientY - r.top) / state.scale}px`;
    reel.appendChild(b);
    setTimeout(() => b.remove(), 900);
    setLike(reel, true, true);
  }

  reels.feed.addEventListener('click', (e) => {
    if (e.target.closest('button, .reel-cap, .reel-info, .reel-rail')) return;
    const reel = e.target.closest('.reel');
    if (!reel) return;
    const now = performance.now();
    if (lastTap && lastTap.reel === reel && now - lastTap.t < 300) {
      clearTimeout(lastTap.timer);
      lastTap = null;
      doubleTap(reel, e);
      return;
    }
    if (lastTap) clearTimeout(lastTap.timer);
    lastTap = { reel, t: now, timer: setTimeout(() => { lastTap = null; singleTap(reel); }, 300) };
  });

  /* ---------- bottom sheet ---------- */
  const layer = $('#sheetLayer');
  const sheet = $('#sheet');
  let sheetOpener = null;
  let sheetCloseTimer = 0;
  function sheetIsOpen() { return !layer.hidden && !layer.classList.contains('is-closing'); }

  function openSheet(html, label) {
    clearTimeout(sheetCloseTimer);
    sheetOpener = document.activeElement;
    $('#sheetBody').innerHTML = html;
    paintIcons($('#sheetBody'));
    sheet.setAttribute('aria-label', label || 'Окно');
    sheet.style.transform = '';
    layer.classList.remove('is-closing', 'is-open');
    layer.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('is-open')));
    syncReelsPause();
    setTimeout(() => sheet.focus({ preventScroll: true }), 80);
  }

  function closeSheet(quick) {
    if (layer.hidden) return;
    layer.classList.add('is-closing');
    layer.classList.remove('is-open');
    sheet.style.transform = '';
    const end = () => {
      layer.hidden = true;
      layer.classList.remove('is-closing');
      $('#sheetBody').innerHTML = '';
      syncReelsPause();
    };
    if (quick || reduce.matches) end(); else sheetCloseTimer = setTimeout(end, 240);
    syncReelsPause();
    if (sheetOpener && sheetOpener.focus && !quick) sheetOpener.focus({ preventScroll: true });
  }

  // drag the sheet down to close
  (function sheetDrag() {
    let y0 = null;
    let id = null;
    sheet.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.sheet-grip, .sh-title, .dm-head')) return;
      y0 = e.clientY;
      id = e.pointerId;
      sheet.style.transition = 'none';
      try { sheet.setPointerCapture(id); } catch (err) { /* ignore */ }
    });
    sheet.addEventListener('pointermove', (e) => {
      if (y0 === null || e.pointerId !== id) return;
      const dy = Math.max(0, (e.clientY - y0) / state.scale);
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const up = (e) => {
      if (y0 === null || e.pointerId !== id) return;
      const dy = (e.clientY - y0) / state.scale;
      y0 = null;
      sheet.style.transition = '';
      if (dy > 80) closeSheet(); else sheet.style.transform = '';
    };
    sheet.addEventListener('pointerup', up);
    sheet.addEventListener('pointercancel', up);
  })();

  function openDM() {
    openSheet(`
      <div class="dm-head"><span class="dm-ava"><img src="img/step-logo.svg" alt=""></span>
        <b>STEP Jiu-Jitsu Academy</b><span>step.jiu.jitsu · Спортивный клуб</span></div>
      <div class="dm-thread" id="dmThread"></div>
      <p class="faq-label">Частые вопросы</p>
      <div class="faq">${FAQ.map((f, i) => `<button type="button" class="chip" data-faq="${i}">${esc(f.q)}</button>`).join('')}</div>
      <div class="composer"><span>Сообщение...</span><button type="button" class="icon-btn" data-icon="heart" data-act="noop" aria-label="Нравится"></button></div>`,
    'Сообщение');
  }

  function answerFAQ(i, chip) {
    const f = FAQ[i];
    const th = $('#dmThread');
    if (!th) return;
    chip.disabled = true;
    th.insertAdjacentHTML('beforeend', `<div class="bub bub--me">${esc(f.q)}</div><div class="typing" aria-label="Печатает"><i></i><i></i><i></i></div>`);
    th.scrollIntoView({ block: 'end', behavior: 'smooth' });
    setTimeout(() => {
      const t = $('.typing', th);
      if (!t) return;
      const h = HL.find((x) => x.id === f.open);
      t.outerHTML = `<div class="bub bub--club">${nb(esc(f.a))}</div><span class="bub-meta">Автоответ клуба</span>
        <button type="button" class="bub-link" data-open="${f.open}">Смотреть «${esc(h.label)}» в актуальном</button>`;
    }, 1100);
  }

  function openComments(reel) {
    const p = reels.list[Number(reel.dataset.i)];
    const mine = state.myComments[p.id];
    openSheet(`
      <div class="sh-title">Комментарии</div>
      <div class="cm"><span class="cm-ava"><img src="img/step-logo.svg" alt=""></span>
        <div><div class="cm-pin">${I.pinFill}<span>Закреплено автором</span></div>
        <b>step.jiu.jitsu</b> Напишите в комментариях слово ПРОБНАЯ, и мы пришлем в директ расписание детских групп
        <div class="cm-meta">Ответить</div></div></div>
      <div id="cmMine">${mine ? myCommentHTML() : ''}</div>
      <p class="faq-label">Быстрый ответ</p>
      <div class="faq"><button type="button" class="chip" data-cm="${p.id}"${mine ? ' disabled' : ''}>ПРОБНАЯ</button></div>
      <div class="composer"><span>Добавьте комментарий...</span></div>`,
    'Комментарии');
  }

  function myCommentHTML() {
    return '<div class="cm"><span class="cm-ava cm-ava--me"></span><div><b>Вы</b> ПРОБНАЯ<div class="cm-meta">Только что</div></div></div>';
  }

  function openWA(key) {
    const text = window.WA_TEXT[key] || window.WA_TEXT.trial;
    openSheet(`
      <div class="sh-title">WhatsApp</div>
      <div class="sh-pad">
        <div class="wa-meta">${I.whatsapp}<span>Откроется чат с клубом и готовым текстом</span></div>
        <div class="wa"><div class="wa-bub">${nb(esc(text))}</div></div>
        <button type="button" class="sh-btn" data-act="sheet-close">Понятно</button>
        <p class="sh-note">В рабочей версии кнопка ведет в WhatsApp клуба. Номер подставим после согласования.</p>
      </div>`, 'WhatsApp');
  }

  function openAbout() {
    openSheet(`
      <div class="sh-title">О концепте</div>
      <div class="sh-pad"><ul class="about">
        <li>Шапка: короткое био до 150 знаков и красная кнопка «Записаться»</li>
        <li>Актуальные в фирменном стиле: пробная, тренер, STEP UP, турниры, родителям, цены</li>
        <li>Обложки с рубриками в трех форматах: фото с плашкой, типографика и светлые плитки</li>
        <li>Новые форматы: мультфильм про мам, типографика «Почему BJJ», экран STEP UP</li>
        <li>Закрепленный рилс «Ему 6» для рекламы на родителей</li>
        <li>Директ сразу отвечает на частые вопросы</li>
        <li>Слово ПРОБНАЯ в комментариях приводит родителя в директ</li>
      </ul>
      <p class="about-foot">Концепт оформления @step.jiu.jitsu · IP Marketing</p>
      <button type="button" class="sh-btn sh-btn--ghost" data-act="sheet-close">Закрыть</button></div>`, 'О концепте');
  }

  /* ---------- actions (event delegation) ---------- */
  function act(name, el, e) {
    switch (name) {
      case 'top':
        if (overlayOpen()) return;
        profile.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
        break;
      case 'follow':
        setFollow(!state.following);
        break;
      case 'message':
        openDM();
        break;
      case 'book':
        openStory(0, el);
        break;
      case 'coach':
        e.preventDefault();
        openStory(HL.findIndex((h) => h.id === 'coach'), el);
        break;
      case 'bell':
        toast('Уведомления о новых публикациях включены');
        break;
      case 'about':
        openAbout();
        break;
      case 'similar':
        toast('Похожие аккаунты');
        break;
      case 'search':
      case 'camera':
        toast('В макете открыт только профиль STEP');
        break;
      case 'reels':
        openReels(0, POSTS, el);
        break;
      case 'share':
        toast('Ссылка скопирована');
        break;
      case 'repost': {
        el.classList.toggle('is-on');
        toast(el.classList.contains('is-on') ? 'Вы сделали репост' : 'Репост отменен');
        break;
      }
      case 'like': {
        const reel = el.closest('.reel');
        if (reel) setLike(reel, !el.classList.contains('is-on'), true);
        break;
      }
      case 'comments':
        openComments(el.closest('.reel'));
        break;
      case 'cap':
        el.classList.toggle('is-open');
        break;
      case 'sheet-close':
        closeSheet();
        break;
      default:
        break;
    }
  }

  document.addEventListener('click', (e) => {
    const t = e.target;

    const hl = t.closest('[data-hl]');
    if (hl) { openStory(Number(hl.dataset.hl), hl); return; }

    const tile = t.closest('[data-post]');
    if (tile) { openReels(Number(tile.dataset.post), state.list, tile); return; }

    const tab = t.closest('[data-tab]');
    if (tab) { setTab(tab.dataset.tab); return; }

    if (t.closest('#avaBtn')) {
      $('#avaBtn').classList.add('is-seen');
      openStory(0, $('#avaBtn'));
      return;
    }
    if (t.closest('#storyClose')) { closeStory(); return; }
    if (t.closest('#reelsClose')) { closeReels(); return; }
    if (t.closest('#storyLike')) {
      story.liked = !story.liked;
      const b = $('#storyLike');
      b.classList.toggle('is-on', story.liked);
      b.innerHTML = story.liked ? I.heartFill : I.heart;
      return;
    }

    const wa = t.closest('[data-wa]');
    if (wa) { openWA(wa.dataset.wa); return; }

    const faq = t.closest('[data-faq]');
    if (faq) { answerFAQ(Number(faq.dataset.faq), faq); return; }

    const open = t.closest('[data-open]');
    if (open) {
      const g = HL.findIndex((h) => h.id === open.dataset.open);
      closeSheet(true);
      openStory(g, null);
      return;
    }

    const cm = t.closest('[data-cm]');
    if (cm) {
      const id = cm.dataset.cm;
      state.myComments[id] = true;
      cm.disabled = true;
      $('#cmMine').innerHTML = myCommentHTML();
      const reel = reelEl(reels.idx);
      if (reel) {
        const p = reels.list[reels.idx];
        const c = reel.querySelector('[data-act="comments"] span');
        if (c) c.textContent = fmt(commentCount(p));
      }
      setTimeout(() => toast('step.jiu.jitsu отправил вам сообщение в директ'), 900);
      return;
    }

    const side = t.closest('[data-side]');
    if (side) {
      const d = side.dataset.side;
      if (!story.el.hidden) { if (d === 'prev') prevSlide(); if (d === 'next') nextSlide(); }
      else if (!reels.el.hidden) { if (d === 'up') goReel(-1); if (d === 'down') goReel(1); }
      return;
    }

    const a = t.closest('[data-act]');
    if (a) act(a.dataset.act, a, e);
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (sheetIsOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
      return;
    }
    if (!story.el.hidden) {
      if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); jumpGroup(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); jumpGroup(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); closeStory(); }
      else if (e.key === ' ' && !e.target.closest('button')) {
        e.preventDefault();
        story.held = !story.held;
        story.el.classList.toggle('is-held', story.held);
      }
      return;
    }
    if (!reels.el.hidden) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goReel(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goReel(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); closeReels(); }
      else if (e.key === ' ' && !e.target.closest('button')) {
        e.preventDefault();
        const el = reelEl(reels.idx);
        if (el) singleTap(el);
      }
    }
  });

  // laptop: the wheel scrolls the phone even when the cursor is on the dark stage
  let wheelAt = 0;
  $('#stage').addEventListener('wheel', (e) => {
    if (phoneMQ.matches || e.target.closest('#device') || sheetIsOpen() || !story.el.hidden) return;
    if (!reels.el.hidden) {
      const now = performance.now();
      if (Math.abs(e.deltaY) > 20 && now - wheelAt > 650) { wheelAt = now; goReel(e.deltaY > 0 ? 1 : -1); }
      return;
    }
    profile.scrollBy({ top: e.deltaY });
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (overlayOpen() || sheetIsOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
    const step = { ArrowDown: 80, ArrowUp: -80, PageDown: profile.clientHeight * 0.85, PageUp: -profile.clientHeight * 0.85 }[e.key];
    if (step && !e.target.closest('.hl-row')) { e.preventDefault(); profile.scrollBy({ top: step, behavior: reduce.matches ? 'auto' : 'smooth' }); }
    if (e.key === 'Home') profile.scrollTo({ top: 0 });
    if (e.key === 'End') profile.scrollTo({ top: profile.scrollHeight });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const v = $('#reels video');
      if (v) v.pause();
    } else syncReelsPause();
  });

  /* ---------- deep links: #hl=trial&s=1, #reel=0, #tab=reels, #sheet=dm ---------- */
  function openFromHash() {
    const q = new URLSearchParams(window.location.hash.slice(1));
    if (q.has('tab')) setTab(q.get('tab'));
    if (q.has('hl')) {
      const g = HL.findIndex((h) => h.id === q.get('hl'));
      if (g >= 0) {
        openStory(g, null);
        const s = clamp(Number(q.get('s')) || 0, 0, HL[g].slides.length - 1);
        if (s) { story.s = s; renderStory(); runStory(); }
      }
    } else if (q.has('reel')) {
      openReels(clamp(Number(q.get('reel')) || 0, 0, state.list.length - 1), state.list, null);
    }
    const sh = q.get('sheet');
    if (sh === 'dm') openDM();
    else if (sh === 'about') openAbout();
    else if (sh === 'wa') openWA('trial');
  }

  /* ---------- init ---------- */
  paintIcons();
  renderBio();
  renderHighlights();
  renderGrid();
  fit();
  if (window.location.hash.length > 1) openFromHash();
  window.addEventListener('resize', fit);
  if (phoneMQ.addEventListener) phoneMQ.addEventListener('change', fit);
})();
