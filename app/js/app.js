/* STEP UP, прототип. Без сборщиков: экраны собираются шаблонами, анимации на CSS и WAAPI.
   Параметры URL:
     ?role=parent|coach|owner   роль
     ?screen=<id>               экран: home path streak messages ai card | group add technique | dashboard
     ?frame=0                   без рамки телефона, ровно 390x844 (для съемки)
     ?autoplay=<id>             открыть экран и проиграть его анимацию с начала; по окончании window.__autoplayDone = true
                                дополнительно: home-stripe (герой получает 4-ю полоску), card-story (карточка уходит в сторис)
     ?glb=<url>                 другой файл 3D-героя;  ?nogl=1  принудительно 2D */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const I = (n, c) => window.icon(n, c);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRAME = qs.get('frame') !== '0';
  if (!FRAME) document.body.classList.add('frame0');

  /* ---------- данные ---------- */
  const BELT = { white: '#FFFFFF', grey: '#9A9A9F', yellow: '#F4C21B', orange: '#F28C1E', green: '#2FA84F' };
  /* IBJJF, детские пояса: после белого идет серо-белый (серый с белой полосой посередине), полоска примерно раз в месяц, 4 полоски до смены пояса */
  const KID = { name: 'Алихан', age: '7 лет', group: 'группа 6-8 лет', rating: 74, stripes: 3 };
  const STATS = [['Сила', 62, 0], ['Гибкость', 71, 0], ['Техника', 58, 3], ['Выносливость', 66, 0], ['Дух', 84, 2]];
  const KIDS = [
    { n: 'Алихан', img: 'hero-bust.webp', belt: 'white', s: 3, here: true, bust: true },
    { n: 'Аружан', img: 'kid-girl.webp', belt: 'grey', s: 2, here: true, bday: true },
    { n: 'Тимур', img: 'kid-2.webp', belt: 'white', s: 1, here: true },
    { n: 'Арсен', img: 'kid-3.webp', belt: 'white', s: 4, here: false },
    { n: 'Амина', img: 'kid-4.webp', belt: 'grey', s: 0, here: true },
    { n: 'Сафия', img: 'kid-5.webp', belt: 'white', s: 2, here: true },
    { n: 'Мирас', img: 'kid-6.webp', belt: 'white', s: 0, here: false },
    { n: 'Нурали', img: 'kid-7.webp', belt: 'yellow', s: 1, here: true },
    { n: 'Айлин', img: 'kid-8.webp', belt: 'white', s: 3, here: true },
    { n: 'Данияр', img: 'kid-1.webp', belt: 'grey', s: 3, here: false },
    { n: 'Ерасыл', ini: 'ЕР', belt: 'white', s: 0, here: true },
    { n: 'Санжар', ini: 'СА', belt: 'white', s: 1, here: false }
  ];

  /* ---------- общие куски ---------- */
  const belt = (color = 'white', on = 3, max = 4, cls = '') =>
    `<div class="belt ${cls} ${color === 'grey-white' ? 'gw' : ''}" style="--belt:${BELT[color] || (color === 'grey-white' ? BELT.grey : color)}" role="img" aria-label="Пояс, полосок ${on} из ${max}"><span class="belt-bar">${
      Array.from({ length: max }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</span></div>`;
  const meter = (v, d = 0, delay = 0) => `<div class="meter pre" style="--v:${v};--dv:${d};--d:${delay}ms"><span class="fill"></span><span class="delta"></span></div>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- экраны ---------- */
  const SCREENS = {};
  /* отметки ключевых моментов для съемки: window.__marks[name] = время */
  window.__marks = {};
  const mark = n => { window.__marks[n] = performance.now(); };
  let homeAutoDone = false;
  const ROLES = {
    parent: { label: 'Родитель', start: 'home', tabs: [['home', 'house', 'Герой'], ['path', 'route', 'Путь'], ['streak', 'flame', 'Серия'], ['messages', 'message-circle', 'Тренер'], ['ai', 'sparkles', 'ИИ-тренер']],
      chips: [['home', 'Главная'], ['path', 'Путь до пояса'], ['streak', 'Серия и ачивки'], ['messages', 'Сообщения тренера'], ['ai', 'ИИ-тренер'], ['card', 'Карточка бойца']] },
    coach: { label: 'Тренер', start: 'group', tabs: [['group', 'users', 'Группа'], ['add', 'user-plus', 'Ученик'], ['technique', 'list-checks', 'Техника']],
      chips: [['group', 'Группа сегодня'], ['add', 'Новый ученик'], ['technique', 'Техника и похвала']] },
    owner: { label: 'Владелец', start: 'dashboard', tabs: [['dashboard', 'layout-dashboard', 'Сводка'], ['dashboard#retain', 'users-round', 'Удержание'], ['dashboard#sources', 'chart-column', 'Источники']],
      chips: [['dashboard', 'Сводка клуба']] }
  };
  const roleOf = id => ({ 'home-stats': 'parent', 'streak-rules': 'parent', 'technique-armbar': 'coach', home: 'parent', path: 'parent', streak: 'parent', messages: 'parent', ai: 'parent', card: 'parent', 'home-stripe': 'parent', 'card-story': 'parent', group: 'coach', add: 'coach', technique: 'coach', dashboard: 'owner' }[id]);

  /* Главная родителя */
  /* Главная родителя: герой по центру на светящемся татами, характеристики вокруг, как экран персонажа в игре */
  const STAT_IC = { 'Сила': 'biceps-flexed', 'Гибкость': 'spline', 'Техника': 'target', 'Выносливость': 'heart-pulse', 'Дух': 'flame' };
  const statChip = ([n, v, d], i, side) => `
    <div class="stat-chip ${side}" data-stat="${n}" style="--i:${i}">
      <div class="sc-row"><b class="sc-v"><span class="js-cu" data-to="${v}">${v}</span>${d ? `<sup>+${d}</sup>` : ''}</b><span class="sc-ic">${I(STAT_IC[n])}</span></div>
      <span class="sc-l">${n}</span>
      <div class="sc-bar"><i style="--v:${v}"></i>${d ? `<em style="--v:${v};--dv:${d}"></em>` : ''}</div>
    </div>`;
  SCREENS.home = {
    html: () => `
      <header class="h2-top">
        <div class="h2-id">
          <h1 class="h2-name">${KID.name}<span>, ${KID.age}</span></h1>
          <div class="h2-level"><span class="lvl-chip">Ур. 7</span><div class="xp-line"><i class="js-xpl" style="--xp:90"></i></div><span class="xp-n">360/400</span></div>
        </div>
        <button class="icon-btn" data-go="messages" aria-label="Сообщения тренера">${I('bell')}<span class="dot"></span></button>
      </header>
      <section class="hero-stage arena" id="homeStage">
        <div class="arena-light"></div>
        <div class="arena-floor"><span class="floor-disc"></span><span class="floor-ring"></span><span class="floor-ring r2"></span></div>
        <div class="hero-slot" data-hero="home"><img class="hero-2d float" src="img/hero-pose.webp" alt="Герой Алихана в черном ги STEP" draggable="false"></div>
        <div class="stat-col left">${STATS.filter(x => ['Сила', 'Гибкость', 'Выносливость'].includes(x[0])).map((x, i) => statChip(x, i, 'l')).join('')}</div>
        <div class="stat-col right">
          <div class="rank-badge" style="--i:0"><b class="js-rating">${KID.rating}</b><span>рейтинг</span></div>
          ${STATS.filter(x => ['Техника', 'Дух'].includes(x[0])).map((x, i) => statChip(x, i + 1, 'r')).join('')}
        </div>
        <div class="coach-mark" aria-hidden="true"></div>
        <div class="tip js-tip" role="status"><b><em>+3</em> после тренировки 16 октября</b><span>Тренер Нурасыл отметил технику Алихана</span></div>
        <p class="rotate-hint">${I('rotate-3d')}Покрути героя</p>
      </section>
      <section class="h2-bottom">
        <div class="card belt-row js-beltrow">
          <div class="br-top"><b>Белый пояс</b><span><em class="js-stripes">${KID.stripes} из 4</em> полосок, до серо-белого пояса</span></div>
          ${belt('white', KID.stripes, 4, 'js-belt')}
        </div>
        <button class="btn btn-red btn-block" data-go="card">${I('award')}Карточка бойца</button>
      </section>`,
    enter(el, o = {}) {
      if (!o.noGrow && !/^home/.test(qs.get('autoplay') || '') || homeAutoDone) el.querySelector('.arena').classList.add('in');
      bindHeroParallax(el); mountHero(el.querySelector('[data-hero="home"]'), 'home');
    },
    async play(el, t) {
      const ar = el.querySelector('.arena');
      ar.classList.remove('in', 'focus'); el.querySelector('.js-tip').classList.remove('show');
      const r = el.querySelector('.js-rating'); r.textContent = '0';
      await waitHero(t, '#s-home .hero-slot');
      void ar.offsetWidth; ar.classList.add('in');
      countUp(r, 0, KID.rating, 1300);
      $$('.stat-chip .js-cu', el).forEach((x, i) => setTimeout(() => countUp(x, 0, +x.dataset.to, 900), 250 + i * 90));
      homeAutoDone = true;
      await t.sleep(2200);
    }
  };

  /* Путь до серо-белого пояса */
  SCREENS.path = {
    html: () => `
      <div class="topbar"><span class="sub">Белый пояс, 3 полоски</span><button class="icon-btn" aria-label="Информация">${I('info')}</button></div>
      <div class="path-head">
        <h1 class="title-xl">Путь до серо-белого<br>пояса</h1>
        <div class="path-big"><b class="js-left">12</b><span><em>тренировок</em>это около 4 недель,<br>к 13 ноября</span></div>
      </div>
      <section class="card ladder">
        <div class="ladder-row">
          ${[['10 июл', 'done'], ['12 авг', 'done'], ['16 сен', 'done'], ['7 из 12', 'part']].map(([s, c], i) =>
            `<div class="rung ${c} pre" style="--p:.58"><div class="bar"><span class="num">${i + 1}</span><i></i></div><small>${s}</small></div>`).join('')}
          <div class="rung goal"><div class="bar">${belt('grey-white', 0, 4, 'mini')}</div><small>Серо-белый</small></div>
        </div>
      </section>
      <div class="reqs">
        <div class="req"><b>36<small>/48</small></b><span>тренировок</span></div>
        <div class="req"><b>3<small>/5</small></b><span>техник</span></div>
        <div class="req"><b>2 ноя</b><span>турнир</span></div>
      </div>
      <div class="section-h"><h3>Техники для серо-белого пояса</h3><span>отмечает тренер</span></div>
      <section class="card checklist">
        ${[['Кувырок', 'Отметил тренер Нурасыл, 10 июля', 'done'], ['Мост', 'Отметил тренер Нурасыл, 12 августа', 'done'], ['Выход из удержания', 'Отметил тренер Нурасыл, 16 сентября', 'done'],
          ['Армбар', 'В работе, тренер проверит в пятницу', 'wip'], ['Треугольник', 'Откроется после армбара', 'lock']].map(([n, s, c]) =>
          `<div class="tech ${c}"><span class="tick">${I(c === 'lock' ? 'lock' : 'check')}</span><div><div class="t-name">${n}</div><div class="t-sub">${s}</div></div><span class="t-side">${c === 'lock' ? '' : I('play')}</span></div>`).join('')}
      </section>`,
    enter(el) {
      const rungs = $$('.rung.pre', el);
      requestAnimationFrame(() => requestAnimationFrame(() => rungs.forEach((r, i) => setTimeout(() => r.classList.remove('pre'), 120 + i * 160))));
    },
    async play(el, t) {
      $$('.rung', el).forEach(r => r.classList.contains('goal') || r.classList.add('pre'));
      $$('.tech.done', el).forEach(x => x.classList.remove('done'));
      const left = el.querySelector('.js-left');
      countUp(left, 20, 12, 1400);
      await t.sleep(300);
      for (const r of $$('.rung.pre', el)) { r.classList.remove('pre'); await t.sleep(220); }
      for (const x of $$('.tech', el).slice(0, 3)) { x.classList.add('done', 'pop'); await t.sleep(320); }
      await t.sleep(900);
    }
  };

  /* Серия и ачивки */
  SCREENS.streak = {
    html: () => {
      const ticks = Array.from({ length: 30 }, (_, i) => `<i style="--i:${i}" class="${i === 26 ? 'today' : i > 26 ? 'rest' : ''}"></i>`).join('');
      const train = [2, 5, 7, 9, 12, 14], dows = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      let cells = dows.map(d => `<div class="dow">${d}</div>`).join('') + '<div></div><div></div><div></div>';
      for (let d = 1; d <= 31; d++) {
        const col = (d + 2) % 7; // 1 октября 2026 четверг
        const inS = d <= 16, cls = [inS ? 'in' : '', inS && (d === 1 || col === 0) ? 'first' : '', inS && (d === 16 || col === 6) ? 'last' : '',
          train.includes(d) ? 'train' : '', d === 16 ? 'today' : '', d >= 17 && d <= 19 ? 'plan' : '', d === 19 ? 'gift' : ''].join(' ');
        cells += `<div class="d ${cls}"><span>${d === 19 ? I('gift') : d}</span></div>`;
      }
      return `
      <div class="topbar"><span class="sub">Без пропусков</span><button class="icon-btn" aria-label="Календарь">${I('calendar')}</button></div>
      <div class="streak-head"><div>
        <h1 class="title-xl">Серия Алихана</h1>
        <div class="streak-num"><b>27</b><span>/30 дней</span></div>
      </div></div>
      <div class="ticks" aria-label="27 дней из 30">${ticks}</div>
      <section class="card prize js-prize">
        <div class="shirt">${shirtSVG()}</div>
        <div><b>Футболка STEP</b><p>Еще 3 дня без пропусков, и она твоя. Вручим на тренировке 19 октября.</p><div class="prize-bar"><i></i></div></div>
        <button class="prize-more js-rules" aria-expanded="false">Как получить приз${I('chevron-down')}</button>
        <ol class="rules">
          <li><span class="r-ic">${I('calendar-check')}</span><div><b>30 дней без пропусков</b><span>все тренировки группы, сейчас 27 из 30</span></div></li>
          <li><span class="r-ic">${I('gift')}</span><div><b>Приз выбирает клуб</b><span>футболка, нашивка или другой мерч STEP</span></div></li>
          <li><span class="r-ic">${I('award')}</span><div><b>Тренер вручает на тренировке</b><span>при всей группе, на ближайшем занятии</span></div></li>
        </ol>
      </section>
      <section class="card cal">
        <div class="cal-h"><b>Октябрь</b><span><span><i></i>был</span><span><i style="background:none;box-shadow:0 0 0 2px #E2231A"></i>сегодня</span></span></div>
        <div class="cal-grid">${cells}</div>
      </section>
      <div class="section-h"><h3>Ачивки</h3><span>4 из 12</span></div>
      <div class="badges">
        <div class="badge js-armbar locked"><span class="new">НОВАЯ</span><div class="medal">${I('zap')}</div><b>Первый армбар</b><span>тренер отметит</span></div>
        <div class="badge"><div class="medal">${I('dumbbell')}</div><b>10 тренировок</b><span>июль</span></div>
        <div class="badge"><div class="medal" style="--ring:#F4C21B">${I('trophy')}</div><b>Первый турнир</b><span>Кубок STEP</span></div>
        <div class="badge"><div class="medal">${I('refresh-cw')}</div><b>Кувырок</b><span>10 июля</span></div>
        <div class="badge locked"><div class="medal">${I('flame')}</div><b>Месяц без пропусков</b><span>27 из 30</span></div>
        <div class="badge locked"><div class="medal">${I('timer')}</div><b>Мост 30 секунд</b><span>домашка</span></div>
      </div>`;
    },
    enter(el) {},
    async play(el, t) {
      const a = el.querySelector('.js-armbar');
      a.className = 'badge js-armbar locked';
      a.querySelector('span:last-child').textContent = 'тренер отметит';
      await t.sleep(1700);
      a.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      await t.sleep(700);
      a.classList.remove('locked'); a.classList.add('unlocked', 'flash'); mark('ach');
      a.querySelector('.medal').style.setProperty('--ring', '#E2231A');
      a.querySelector('span:last-child').textContent = 'сегодня';
      toast('Новая ачивка', 'Первый армбар, тренер Нурасыл отметил технику', 'zap', true);
      confetti({ y: .7, n: 70 });
      await t.sleep(2200);
    }
  };

  /* Сообщения тренера */
  SCREENS.messages = {
    html: () => `
      <div class="coach-head"><div class="avatar-i">НУ</div><div><b>Тренер Нурасыл</b><span>мастер спорта РК, коричневый пояс</span></div></div>
      <section class="remind js-remind">
        <span class="rem-ic">${I('bell')}</span>
        <div><b>Тренировка через 2 часа</b><p>Сегодня в 18:00, Достык 3, зал 1</p>
          <div class="rem-items"><span>${I('shirt')}Ги</span><span>${I('droplet')}Вода</span><span>${I('footprints')}Тапочки</span></div></div>
        <div class="rem-actions"><button class="btn btn-sm btn-dark" data-toast="going">Буду</button><button class="btn btn-sm btn-line" data-toast="skip">Пропустим</button></div>
      </section>
      <p class="day-sep">Среда, 14 октября</p>
      <div class="msg">
        <div class="bubble">
          <div class="voice"><button class="play js-play" aria-label="Слушать">${I('play')}</button>
            <div class="wave">${[8, 14, 22, 12, 18, 26, 16, 10, 20, 24, 14, 8, 18, 22, 12, 16, 26, 20, 10, 14, 18, 8, 12, 6].map(h => `<i style="--h:${h}"></i>`).join('')}</div>
            <span class="dur js-dur">0:12</span></div>
          <div class="voice-text">Алихан сегодня боролся как лев. Два раза сам вышел из удержания, горжусь.</div>
          <div class="praise">${I('star')}Похвала тренера<b>Дух +2</b></div>
        </div>
        <p class="msg-meta">19:42</p>
      </div>
      <section class="card hw">
        <div class="hw-top">${I('dumbbell')}Домашка до пятницы</div>
        <h4>Мост, 30 секунд, 3 подхода</h4>
        <p>Пришли видео ИИ-тренеру, получишь <span class="xp">+20 опыта</span></p>
        <button class="btn btn-white btn-sm" data-go="ai">${I('video')}Отправить видео</button>
      </section>
      <p class="day-sep">Администратор клуба</p>
      <section class="card subscr">
        <div class="s-top"><b>Абонемент на октябрь</b><span>8 из 12</span></div>
        <div class="s-dots">${Array.from({ length: 12 }, (_, i) => `<i class="${i < 8 ? 'used' : ''}"></i>`).join('')}</div>
        <button class="btn btn-ghost btn-block btn-sm" data-toast="kaspi">${I('wallet')}Продлить в Kaspi, 28 000 тг</button>
      </section>`,
    enter(el) {},
    async play(el, t) {
      const r = el.querySelector('.js-remind');
      r.animate([{ transform: 'translateY(-30px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.23,1,.32,1)' });
      await t.sleep(900);
      await playVoice(el, t);
      await t.sleep(400);
    }
  };

  /* ИИ-тренер */
  SCREENS.ai = {
    html: () => `
      <div class="ai-head"><span class="ai-orb">${I('sparkles')}</span><div><b>ИИ-тренер STEP</b><span>знает программу клуба и технику Алихана</span></div></div>
      <div class="chat js-chat"></div>
      <div style="height:120px"></div>`,
    after: () => `
      <div class="composer js-composer">
        <div class="suggest"><button class="chip">${I('refresh-cw')}Как делать кувырок?</button><button class="chip">${I('timer')}Задание на сегодня</button><button class="chip">${I('sun')}Растяжка перед сном</button></div>
        <div class="input-row"><button class="icon-btn" aria-label="Прикрепить видео">${I('paperclip')}</button><span class="ph">Спросить про технику</span><button class="icon-btn mic" aria-label="Голосом">${I('mic')}</button></div>
      </div>`,
    enter(el) { if (!el.querySelector('.js-chat').children.length) renderAiChat(el, true); },
    async play(el, t) { await renderAiChat(el, false, t); }
  };

  /* Тренер: группа */
  SCREENS.group = {
    html: () => `
      <div class="topbar"><span class="sub">Пятница, 16 октября</span><button class="icon-btn" aria-label="Поиск">${I('ellipsis')}</button></div>
      <div class="group-head">
        <div><h1 class="title-xl">Группа 6-8 лет</h1><p class="sub" style="margin-top:6px">Сегодня 18:00, зал 1. Тап по фото отмечает ученика</p></div>
        <div class="count-ring"><svg viewBox="0 0 64 64"><circle class="bgc" cx="32" cy="32" r="28"/><circle class="fgc js-ring" cx="32" cy="32" r="28" stroke-dasharray="175.9" stroke-dashoffset="175.9"/></svg><b class="js-count">0/12</b></div>
      </div>
      <section class="card bday"><span class="cake">${I('cake')}</span><p>Аружан сегодня 9 лет<span>Поздравим после тренировки</span></p><button class="btn btn-sm btn-ghost" data-toast="bday">Поздравить</button></section>
      <div class="kids js-kids">${KIDS.map((k, i) => `
        <button class="kid ${k.here ? 'here' : ''}" data-i="${i}" aria-pressed="${k.here}">
          <span class="ph">${k.img ? `<img src="img/${k.img}" alt="" style="${k.bust ? 'object-position:50% 18%;background:#151517' : ''}">` : `<span class="ini">${k.ini}</span>`}<span class="chk">${I('check')}</span></span>
          ${k.bday ? `<span class="bd">${I('cake')}</span>` : ''}
          <b>${k.n}</b>${belt(k.belt, k.s, 4, 'mini')}
        </button>`).join('')}</div>
      <div style="height:70px"></div>`,
    after: () => `<div class="bottom-cta js-groupcta"><button class="btn btn-red btn-block" data-toast="attendance">${I('clipboard-check')}<span class="js-savelbl">Сохранить посещение</span></button></div>`,
    enter(el) { updateCount(el); },
    async play(el, t) {
      $$('.kid', el).forEach((k, i) => { const on = KIDS[i].here && i < 2; k.classList.toggle('here', on); });
      updateCount(el);
      await t.sleep(500);
      const order = [2, 4, 5, 7, 8, 10, 3, 6, 11];
      for (const i of order) { const k = el.querySelector(`.kid[data-i="${i}"]`); k.classList.add('here'); k.setAttribute('aria-pressed', 'true'); updateCount(el); await t.sleep(260); }
      await t.sleep(300);
      toast('Посещение сохранено', '11 из 12, родители получили отметку', 'clipboard-check');
      await t.sleep(1800);
    }
  };

  /* Тренер: новый ученик голосом */
  const FIELDS = [['name', 'Имя ребенка', 'Алихан'], ['age', 'Возраст', '7 лет'], ['parent', 'Родитель', 'Айгерим, мама'], ['phone', 'Телефон', '+7 707 418 26 93'], ['grp', 'Группа', '6-8 лет, Пн Ср Пт 18:00']];
  SCREENS.add = {
    html: () => `
      <div class="topbar"><h1 class="title-l">Новый ученик</h1><div class="seg"><button class="on">Голосом</button><button>Формой</button></div></div>
      <section class="card voice-card">
        <button class="mic-big js-mic" aria-label="Говорить">${I('mic')}</button>
        <div class="vc-t"><b>Скажите имя, возраст и телефон родителя</b><span class="js-micstate">Нажмите и говорите</span></div>
        <div class="transcript empty js-tr">«Алихан, семь лет, мама Айгерим...»</div>
      </section>
      <section class="card form">
        ${FIELDS.map(([k, l]) => `<div class="field" data-f="${k}" ${k === 'grp' ? 'style="grid-column:1/-1"' : ''}><label>${l}</label><div class="v ph">не заполнено</div></div>`).join('')}
        <div class="field" data-f="src" style="grid-column:1/-1"><label>Откуда узнали</label><div class="src"><span>Таргет</span><span data-s="ig">Инстаграм</span><span>Рекомендация</span><span>Прохожий</span></div></div>
      </section>
      <section class="card photo-card">
        <div class="viewfinder js-vf"><div class="vf-cam">${I('camera')}</div><span class="corners"></span><span class="flash"></span></div>
        <div class="pc-t js-pct"><span class="stepper"><i class="on"></i><i></i>Фото для героя</span><b style="margin-top:8px">Сфотографируйте ребенка</b><p>Герой в ги STEP соберется сам за 10 секунд</p><button class="btn btn-white btn-sm js-shot">${I('camera')}Сделать фото</button></div>
      </section>`,
    enter(el) {},
    async play(el, t) { resetAdd(el); await t.sleep(500); await runAdd(el, t); }
  };

  /* Тренер: техника и похвала */
  SCREENS.technique = {
    html: () => `
      <div class="topbar"><h1 class="title-l">Техника и похвала</h1><button class="icon-btn" aria-label="Голосом">${I('mic')}</button></div>
      <section class="card student"><img src="img/hero-bust.webp" alt=""><div class="s-n"><b>Алихан, 7 лет</b>${belt('white', 3, 4, 'js-sbelt')}</div><button class="icon-btn" aria-label="Другой ученик">${I('chevron-down')}</button></section>
      <div class="section-h"><h3>Техники на серо-белый пояс</h3><span class="js-tcount">3 из 5</span></div>
      <section class="card tlist">
        ${[['Кувырок', '10 июля', 1], ['Мост', '12 августа', 1], ['Выход из удержания', '16 сентября', 1], ['Армбар', 'сегодня на тренировке', 0], ['Треугольник', 'после армбара', 0]].map(([n, s, on], i) =>
          `<div class="tech ${on ? 'done' : ''}"><span class="tick">${I('check')}</span><div><div class="t-name">${n}</div><div class="t-sub">${s}</div></div><button class="toggle ${on ? 'on' : ''} js-tg" data-i="${i}" aria-label="${n}" aria-pressed="${!!on}"></button></div>`).join('')}
      </section>
      <section class="card stripe-card">
        <div class="row"><b>Полоска на пояс</b><span class="js-stxt">3 из 4, до серо-белого</span></div>
        ${belt('white', 3, 4, 'js-tbelt')}
        <button class="btn btn-red btn-block js-stripe">${I('plus')}Поставить полоску</button>
      </section>
      <section class="card praise-card">
        <b style="font-weight:600">Похвала маме и Алихану</b>
        <div class="chips">${['Боролся как лев', 'Не сдавался', 'Чистая техника', 'Помогал другим'].map((c, i) => `<button class="chip js-pc" data-i="${i}">${c}</button>`).join('')}</div>
        <div class="praise-text js-ptext"><span style="color:#9A9A9F">Напишите или надиктуйте пару слов</span></div>
        <div class="pr-actions"><button class="btn btn-ghost" aria-label="Голосовое">${I('mic')}</button><button class="btn btn-white js-psend">${I('send')}Отправить</button></div>
      </section>`,
    enter(el) {},
    async play(el, t) {
      resetTechnique(el);
      await t.sleep(700);
      const tg = el.querySelector('.js-tg[data-i="3"]');
      tapPulse(tg); await t.sleep(200); toggleTech(el, tg);
      await t.sleep(1600);
      el.querySelector('.stripe-card').scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      await t.sleep(700);
      const b = el.querySelector('.js-stripe'); tapPulse(b); await t.sleep(200); giveStripe(el); mark('stripe');
      await t.sleep(2200);
      el.querySelector('.praise-card').scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
      await t.sleep(600);
      const c = el.querySelector('.js-pc[data-i="0"]'); tapPulse(c); c.classList.add('on');
      await typeInto(el.querySelector('.js-ptext'), 'Алихан сегодня боролся как лев и сам сделал армбар. Так держать!', t, 28);
      await t.sleep(500);
      const s = el.querySelector('.js-psend'); tapPulse(s); await t.sleep(200);
      toast('Похвала отправлена', 'Мама увидит ее в STEP UP, Алихан получит +2 к духу', 'send');
      await t.sleep(1800);
    }
  };

  /* Владелец */
  SCREENS.dashboard = {
    html: () => {
      const weeks = [71, 73, 74, 78, 80, 82, 85, 87];
      const max = 90, min = 60, H = 80;
      const bars = weeks.map((v, i) => { const h = (v - min) / (max - min) * H; return `<rect class="b ${i === weeks.length - 1 ? 'last' : ''}" style="--i:${i}" x="${i * 19}" y="${H - h}" width="13" height="${h}" rx="3"/>`; }).join('');
      return `
      <div class="topbar"><img class="logo" src="img/step-logo-white.svg" alt="STEP Jiu Jitsu Academy" style="height:22px"><button class="icon-btn" aria-label="Уведомления">${I('bell')}<span class="dot"></span></button></div>
      <div class="dash-head"><div><h1 class="title-xl">Клуб сегодня</h1><p class="sub">пятница, 16 октября</p></div></div>
      <section class="card kpi-main">
        <div><div class="k-num js-cu" data-to="87">87</div><p class="k-l">активных<br>абонементов</p><span class="k-up">${I('trending-up')}+16 за 8 недель</span></div>
        <svg class="chart" viewBox="0 0 150 104" aria-label="Абонементы по неделям, рост с 71 до 87">${bars}<text x="0" y="100">авг</text><text x="120" y="100">окт</text></svg>
      </section>
      <div class="kpis">
        <div class="kpi"><div class="k-top">Продления${I('refresh-cw')}</div><b class="js-cu" data-to="12">12</b><span class="k-s">на этой неделе</span></div>
        <div class="kpi warn"><div class="k-top">Истекают${I('clock')}</div><b class="js-cu" data-to="6">6</b><span class="k-s">в ближайшие 7 дней</span></div>
        <div class="kpi debt"><div class="k-top">Должники${I('triangle-alert')}</div><b class="js-cu" data-to="2">2</b><span class="k-s">56 000 тг, напомнить</span></div>
        <div class="kpi"><div class="k-top">Дни рождения${I('cake')}</div><b class="js-cu" data-to="2">2</b><div class="faces"><img src="img/kid-girl.webp" alt="Аружан"><img src="img/kid-2.webp" alt="Тимур"></div></div>
        <div class="kpi wide"><div><div class="k-top" style="justify-content:flex-start;gap:6px">${I('calendar-check')}Посещаемость</div><b><span class="js-cu" data-to="91">91</span>%</b><span class="k-s">за октябрь, цель 85%</span></div>
          <div class="att">${[['4-5', 88], ['6-8', 94], ['9-12', 90]].map(([g, v], i) => `<div><em>${v}</em><i style="--h:${(v - 78) * 3};--i:${i}"></i><small>${g}</small></div>`).join('')}</div></div>
      </div>
      <div class="section-h" id="sources"><h3>Откуда пришли клиенты</h3><span>87 абонементов</span></div>
      <section class="card sources">
        <div class="src-bar"><i style="width:26.4%;background:#F4C21B"></i><i style="width:35.6%;background:#F28C1E;animation-delay:120ms"></i><i style="width:37.9%;background:#2FA84F;animation-delay:240ms"></i></div>
        <div class="src-legend">
          <div><i style="background:#F4C21B"></i>Таргет<b>23</b><span>26%</span></div>
          <div><i style="background:#F28C1E"></i>Инстаграм<b>31</b><span>36%</span></div>
          <div><i style="background:#2FA84F"></i>Рекомендации<b>33</b><span>38%</span></div>
        </div>
        <p class="src-note">Источник ставит тренер при записи. По этим цифрам честно считается бонус за абонементы с рекламы.</p>
      </section>
      <div class="section-h" id="retain"><h3>Кому написать сегодня</h3><span>3 ученика</span></div>
      <section class="card retain">
        <div class="r-row"><img src="img/kid-1.webp" alt=""><div><b>Данияр, 9 лет</b><span>не был <em>12 дней</em>, абонемент до 24 октября</span></div><button class="btn btn-sm btn-white" data-toast="write">Написать</button></div>
        <div class="r-row"><img src="img/kid-6.webp" alt=""><div><b>Мирас, 7 лет</b><span>пропустил <em>3 тренировки</em> подряд</span></div><button class="btn btn-sm btn-ghost" data-toast="write">Написать</button></div>
        <div class="r-row"><span class="ini">СА</span><div><b>Санжар, 6 лет</b><span>абонемент истек <em>2 дня</em> назад</span></div><button class="btn btn-sm btn-ghost" data-toast="remind">Напомнить</button></div>
      </section>`;
    },
    enter(el) { const c = el.querySelector('.chart'); c.classList.remove('go'); requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('go'))); },
    async play(el, t) {
      $$('.js-cu', el).forEach(x => countUp(x, 0, +x.dataset.to, 1200));
      await t.sleep(2000);
    }
  };

  /* ---------- построение ---------- */
  const screensEl = $('#screens'), tabbar = $('#tabbar'), app = $('#app');
  for (const [id, s] of Object.entries(SCREENS)) {
    const sec = document.createElement('section');
    sec.className = 'screen'; sec.id = 's-' + id; sec.dataset.id = id;
    sec.innerHTML = s.html();
    screensEl.appendChild(sec);
    if (s.after) { const w = document.createElement('div'); w.className = 'after'; w.dataset.for = id; w.hidden = true; w.innerHTML = s.after(); app.insertBefore(w, $('#cardOverlay')); }
  }
  $('#cardOverlay').innerHTML = cardHTML(); $('#cardOverlay').inert = true; $('#story').inert = true;

  let role = null, current = null;
  function setRole(r, opts = {}) {
    role = r;
    $$('.roles button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === r)));
    const pill = $('.roles-pill'), btn = $(`.roles button[data-role="${r}"]`);
    pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    tabbar.innerHTML = ROLES[r].tabs.map(([id, ic, l]) => `<button class="tab" data-tab="${id}" aria-label="${l}">${I(ic)}<span>${l}</span></button>`).join('') + '<span class="tab-bar-ind"></span>';
    $('.screen-chips').innerHTML = ROLES[r].chips.map(([id, l]) => `<button data-chip="${id}">${l}</button>`).join('') +
      `<button data-replay title="Повторить анимацию экрана (R)">${I('refresh-cw')} Повтор</button>`;
    if (!opts.keep) go(ROLES[r].start, { silent: opts.silent });
  }

  function go(id, opts = {}) {
    if (id === 'card') { if (current !== 'home') go('home', { silent: true }); openCard(); syncUrl('card'); markChips('card'); return; }
    closeCard(true);
    const r = roleOf(id);
    if (r !== role) { setRole(r, { keep: true }); }
    const next = $('#s-' + id), prev = current && $('#s-' + current);
    if (prev && prev !== next) { prev.classList.remove('is-active'); prev.classList.add('is-leaving'); setTimeout(() => prev.classList.remove('is-leaving'), 180); }
    next.classList.add('is-active');
    if (prev !== next) next.scrollTop = 0;
    $$('.after').forEach(a => a.hidden = a.dataset.for !== id);
    current = id;
    // таб
    const tabs = $$('.tab', tabbar); let idx = 0;
    tabs.forEach((t, i) => { const on = t.dataset.tab === id; t.toggleAttribute('aria-current', on); if (on) { t.setAttribute('aria-current', 'page'); idx = i; } else t.removeAttribute('aria-current'); });
    const ind = $('.tab-bar-ind', tabbar); if (ind && tabs[idx]) ind.style.transform = `translateX(${tabs[idx].offsetLeft + tabs[idx].offsetWidth / 2 - 13}px)`;
    if (!opts.silent && prev && prev !== next && !reduce) { const w = $('.wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); }
    if (prev !== next || opts.force) SCREENS[id].enter && SCREENS[id].enter(next);
    syncUrl(id); markChips(id);
  }
  function markChips(id) { $$('.screen-chips [data-chip]').forEach(c => c.setAttribute('aria-current', String(c.dataset.chip === id))); }
  function syncUrl(id) {
    const p = new URLSearchParams(location.search); p.set('role', roleOf(id)); p.set('screen', id); p.delete('autoplay');
    history.replaceState(null, '', '?' + p.toString());
  }

  /* ---------- события ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('.js-rules,[data-role],[data-chip],[data-tab],[data-go],[data-toast],[data-replay],.kid,.js-tg,.js-stripe,.js-pc,.js-psend,.js-mic,.js-shot,.js-play,.js-share,.js-close,.js-story-close,.js-story-save,.src span');
    if (!t) return;
    if (t.classList.contains('js-rules')) return toggleRules(t.closest('.js-prize'));
    if (t.dataset.role) return setRole(t.dataset.role);
    if (t.dataset.chip) return go(t.dataset.chip);
    if (t.hasAttribute('data-replay')) return replay();
    if (t.dataset.tab) {
      const [id, anchor] = t.dataset.tab.split('#');
      if (anchor) { go(id, { silent: true }); const a = $('#' + anchor); if (a) a.closest('.screen').scrollTo({ top: a.offsetTop - 60, behavior: reduce ? 'auto' : 'smooth' });
        $$('.tab', tabbar).forEach(x => x === t ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'));
        const ind = $('.tab-bar-ind', tabbar); ind.style.transform = `translateX(${t.offsetLeft + t.offsetWidth / 2 - 13}px)`; return; }
      return go(id);
    }
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.toast) return toastPreset(t.dataset.toast);
    if (t.classList.contains('kid')) { t.classList.toggle('here'); t.setAttribute('aria-pressed', String(t.classList.contains('here'))); return updateCount(t.closest('.screen')); }
    if (t.classList.contains('js-tg')) return toggleTech(t.closest('.screen'), t);
    if (t.classList.contains('js-stripe')) return giveStripe(t.closest('.screen'));
    if (t.classList.contains('js-pc')) { const el = t.closest('.screen'); $$('.js-pc', el).forEach(c => c.classList.toggle('on', c === t)); const txt = { 0: 'Алихан сегодня боролся как лев. Так держать!', 1: 'Алихан не сдавался до конца раунда, горжусь.', 2: 'Очень чистая техника сегодня, молодец.', 3: 'Помогал младшим на разминке, настоящий лидер.' }[t.dataset.i]; el.querySelector('.js-ptext').textContent = txt; return; }
    if (t.classList.contains('js-psend')) return toast('Похвала отправлена', 'Мама увидит ее в STEP UP, Алихан получит +2 к духу', 'send');
    if (t.classList.contains('js-mic')) { const el = t.closest('.screen'); resetAdd(el); return runAdd(el, token()).catch(() => {}); }
    if (t.classList.contains('js-shot')) { const el = t.closest('.screen'); return runPhoto(el, token()).catch(() => {}); }
    if (t.classList.contains('js-play')) return playVoice(t.closest('.screen'), token()).catch(() => {});
    if (t.classList.contains('js-share')) return openStory();
    if (t.classList.contains('js-close')) { closeCard(); syncUrl('home'); markChips('home'); return; }
    if (t.classList.contains('js-story-close')) return closeStory();
    if (t.classList.contains('js-story-save')) { closeStory(); return toast('Сторис готова', 'Картинка сохранена, отметка @step.jiu.jitsu уже на ней', 'instagram'); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    const list = ROLES[role].chips.map(c => c[0]);
    const i = list.indexOf(current === 'home' && $('#cardOverlay').classList.contains('open') ? 'card' : current);
    if (e.key === 'ArrowRight') go(list[(i + 1) % list.length]);
    else if (e.key === 'ArrowLeft') go(list[(i - 1 + list.length) % list.length]);
    else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') replay();
    else if (e.key === 'Escape') { closeStory(); if ($('#cardOverlay').classList.contains('open')) { closeCard(); syncUrl('home'); markChips('home'); } }
  });

  /* ---------- проигрывание ---------- */
  let tokenId = 0;
  function token() {
    const my = ++tokenId;
    return { sleep: ms => new Promise((res, rej) => setTimeout(() => (my === tokenId ? res() : rej(new Error('cancel'))), reduce ? Math.min(ms, 60) : ms)), alive: () => my === tokenId };
  }
  async function playScreen(id) {
    const t = token();
    window.__autoplayDone = false; window.__autoplayT0 = performance.now();
    try {
      if (id === 'card' || id === 'card-story') {
        go('home', { silent: true }); closeCard(true); await waitHero(t, '#cardOverlay .fc-hero'); await t.sleep(250); openCard(); await t.sleep(1700);
        sweepSheen(); await t.sleep(1200);
        if (id === 'card-story') { tapPulse($('.js-share')); await t.sleep(200); openStory(); await t.sleep(1200); }
      } else if (id === 'home-stripe') {
        go('home', { silent: true }); const el = $('#s-home');
        setBeltStripes(el.querySelector('.js-belt'), 3); el.querySelector('.js-stripes').textContent = '3 из 4';
        await waitHero(t, '#s-home .hero-slot'); el.querySelector('.arena').classList.add('in');
        await t.sleep(1600);
        const br = el.querySelector('.js-beltrow'); br.classList.remove('flash'); void br.offsetWidth; br.classList.add('flash');
        setBeltStripes(el.querySelector('.js-belt'), 4, true); el.querySelector('.js-stripes').textContent = '4 из 4'; mark('stripe');
        const rr = br.getBoundingClientRect(), aa = app.getBoundingClientRect(), sc = aa.width / 390;
        confetti({ y: Math.min(.92, (rr.top - aa.top) / sc / 844 + .02), n: 90 }); toast('+1 полоска', 'До серо-белого пояса остался один шаг', 'award', true);
        await t.sleep(2600);
      } else if (id === 'streak-rules') {
        go('streak', { silent: true }); const el = $('#s-streak'), card = el.querySelector('.js-prize');
        toggleRules(card, false); el.scrollTop = 0;
        await t.sleep(1300);
        tapPulse(card.querySelector('.js-rules')); toggleRules(card, true);
        await t.sleep(700); mark('rules');
        await t.sleep(1500);
      } else if (id === 'technique-armbar') {
        go('technique', { silent: true }); const el = $('#s-technique');
        resetTechnique(el);
        await t.sleep(900);
        const tg = el.querySelector('.js-tg[data-i="3"]'); tapPulse(tg); await t.sleep(200); toggleTech(el, tg);
        tg.closest('.tech').classList.add('lit'); mark('armbar');
        await t.sleep(1800);
      } else if (id === 'home-stats') {
        go('home', { silent: true }); const el = $('#s-home'), ar = el.querySelector('.arena');
        await waitHero(t, '#s-home .hero-slot'); ar.classList.add('in');
        await t.sleep(900);
        ar.classList.add('focus'); el.querySelector('.stat-chip[data-stat="Техника"]').classList.add('lit');
        await t.sleep(250); el.querySelector('.js-tip').classList.add('show'); mark('stats');
        await t.sleep(2400);
      } else {
        go(id, { silent: true });
        const el = $('#s-' + id);
        await SCREENS[id].play(el, t);
      }
    } catch (e) { if (e.message !== 'cancel') console.error(e); }
    if (t.alive()) window.__autoplayDone = true;
  }
  function replay() {
    const id = $('#cardOverlay').classList.contains('open') ? 'card' : current;
    if (id === 'home') { const el = $('#s-home'); el.innerHTML = SCREENS.home.html(); SCREENS.home.enter(el, { noGrow: true }); }
    else if (['path', 'streak', 'messages', 'group', 'dashboard'].includes(id)) { const el = $('#s-' + id); el.innerHTML = SCREENS[id].html(); SCREENS[id].enter(el); }
    else if (id === 'ai') { $('#s-ai .js-chat').innerHTML = ''; }
    playScreen(id);
  }

  /* ---------- помощники анимаций ---------- */
  function growMeters(el) { const ms = $$('.meter', el); ms.forEach(m => m.classList.add('pre')); requestAnimationFrame(() => requestAnimationFrame(() => ms.forEach(m => m.classList.remove('pre')))); }
  function countUp(el, from, to, dur) {
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function tapPulse(el) { if (!el || reduce) return; el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); }
  async function typeInto(el, text, t, speed = 30) { el.textContent = ''; for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await t.sleep(speed); } }
  function setBeltStripes(b, n, animateNew) { $$('.belt-bar i', b).forEach((s, i) => { const was = s.classList.contains('on'); s.classList.toggle('on', i < n); s.classList.remove('new'); if (animateNew && i < n && !was) { void s.offsetWidth; s.classList.add('new'); } }); b.setAttribute('aria-label', `Пояс, полосок ${n} из 4`); }

  let toastTimer;
  function toast(title, sub, ic = 'check', red = false, ms = 2800) {
    if (qs.get('toast') === '0') return;
    const el = $('#toast');
    el.innerHTML = `<span class="t-ic ${red ? 'red' : ''}">${I(ic)}</span><div><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }
  function toastPreset(k) {
    const P = { going: ['Тренер знает, что вы придете', 'Напомним за 30 минут', 'check'], skip: ['Пропуск отмечен', 'Серия не сгорит, если отработать в субботу', 'calendar'],
      kaspi: ['Переход в Kaspi', 'В пилоте здесь откроется оплата абонемента', 'wallet'], bday: ['Поздравление отправлено', 'Аружан получит открытку с героем', 'gift'],
      attendance: ['Посещение сохранено', 'Родители получили отметку', 'clipboard-check'], write: ['Шаблон письма готов', 'Откроется WhatsApp с текстом от клуба', 'message-circle'],
      remind: ['Напоминание отправлено', 'Родитель получит ссылку на продление', 'bell'] };
    const [a, b, c] = P[k] || ['Готово', '', 'check']; toast(a, b, c);
  }

  /* конфетти в цветах поясов */
  function confetti({ x = .5, y = .5, n = 120 } = {}) {
    if (reduce) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; const W = 390, H = 844, dpr = Math.min(3, devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; app.appendChild(c); const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    const cols = ['#FFFFFF', '#F4C21B', '#F28C1E', '#2FA84F', '#E2231A', '#9A9A9F'];
    /* движение считается от времени, а не от кадров: одинаково при 60 fps и при медленной съемке */
    const P = Array.from({ length: n }, () => { const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, v = 420 + Math.random() * 640; return { x: W * x, y: H * y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 3 + Math.random() * 5, h: 2 + Math.random() * 2.5, r: Math.random() * 6, vr: (Math.random() - .5) * 24, c: cols[(Math.random() * cols.length) | 0] }; });
    const t0 = performance.now(), G = 1150, K = .9, DUR = 2600;
    const frame = real => { const now = window.__freezeT || real; /* съемка может заморозить время */ const ts = Math.max(0, now - t0) / 1000, k = Math.max(0, now - t0) / DUR, e = (1 - Math.exp(-K * ts)) / K; ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - .6) / .4);
      for (const p of P) { const px = p.x + p.vx * e, py = p.y + G / K * ts + (p.vy - G / K) * e; ctx.save(); ctx.translate(px, py); ctx.rotate(p.r + p.vr * ts); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
      if (k < 1 || window.__freezeT) requestAnimationFrame(frame); else c.remove(); };
    requestAnimationFrame(frame);
  }

  /* ---------- главная: параллакс и 3D ---------- */
  function bindHeroParallax(el) {
    const stage = el.querySelector('.hero-stage'); if (!stage || stage.dataset.bound) return; stage.dataset.bound = 1;
    const img = () => stage.querySelector('.hero-2d');
    stage.addEventListener('pointermove', e => {
      if (reduce || stage.querySelector('.hero-slot.is-3d')) return;
      const r = stage.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      const i = img(); if (i) i.style.transform = `translateX(-50%) perspective(700px) rotateY(${dx * 10}deg) rotateX(${-dy * 4}deg) translateX(${dx * 8}px)`;
      const tt = stage.querySelector('.tatami'); if (tt) tt.style.translate = `${-dx * 10}px 0`;
    });
    stage.addEventListener('pointerleave', () => { const i = img(); if (i) i.style.transform = ''; const tt = stage.querySelector('.tatami'); if (tt) tt.style.translate = ''; });
  }
  const GLB = qs.get('glb') || '../assets/hero/hero.glb';
  const MV_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  let glbPromise = null, mvPromise = null;
  function glbAvailable() {
    if (glbPromise) return glbPromise;
    if (qs.get('nogl') === '1' || location.protocol === 'file:') return (glbPromise = Promise.resolve(false));
    glbPromise = fetch(GLB, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false);
    return glbPromise;
  }
  function loadModelViewer() {
    if (customElements.get('model-viewer')) return Promise.resolve(true);
    if (mvPromise) return mvPromise;
    mvPromise = new Promise(res => { const s = document.createElement('script'); s.type = 'module'; s.src = MV_SRC; s.onload = () => customElements.whenDefined('model-viewer').then(() => res(true)); s.onerror = () => res(false); document.head.appendChild(s); });
    return mvPromise;
  }
  const MV_ATTR = {
    home: { 'camera-orbit': '62deg 84deg 2.65m', 'field-of-view': '25deg', 'min-camera-orbit': 'auto 72deg auto', 'max-camera-orbit': 'auto 92deg auto' },
    card: { 'camera-orbit': '68deg 86deg 2.5m', 'field-of-view': '26deg', 'min-camera-orbit': 'auto 74deg auto', 'max-camera-orbit': 'auto 92deg auto' }
  };
  async function mountHero(slot, kind) {
    if (!slot || slot.dataset.mounted) return; slot.dataset.mounted = '1';
    if (!(await glbAvailable())) return;
    const img = slot.querySelector('.hero-2d'); if (img) { img.src = 'img/hero-apose.webp'; img.classList.remove('float'); }
    if (!(await loadModelViewer())) return;
    const mv = document.createElement('model-viewer');
    const a = Object.assign({ src: GLB, alt: 'Герой Алихана в 3D, можно покрутить', 'camera-controls': '', 'auto-rotate': '', 'auto-rotate-delay': '1500', 'rotation-per-second': '22deg',
      'interaction-prompt': 'none', 'touch-action': 'pan-y', 'disable-zoom': '', 'disable-pan': '', 'disable-tap': '', 'shadow-intensity': '1', 'shadow-softness': '0.9', exposure: '1.05',
      'environment-image': 'neutral', 'camera-target': '0m 0m 0m', loading: 'eager', reveal: 'auto', 'interpolation-decay': '120' }, MV_ATTR[kind]);
    if (qs.get('rot') === '0') delete a['auto-rotate'];
    for (const [k, v] of Object.entries(a)) mv.setAttribute(k, v);
    const show = () => { slot.classList.add('is-3d'); const st = slot.closest('.hero-stage'); st && st.classList.add('has-3d'); };
    mv.addEventListener('load', show);
    mv.addEventListener('model-visibility', e => { if (e.detail && e.detail.visible) show(); });
    let tries = 0; const poll = setInterval(() => { if (mv.loaded) { show(); clearInterval(poll); } else if (++tries > 80) clearInterval(poll); }, 250);
    mv.addEventListener('camera-change', e => { if (e.detail && e.detail.source === 'user-interaction') { const st = slot.closest('.hero-stage'); st && st.classList.add('touched'); } });
    mv.addEventListener('error', () => slot.classList.remove('is-3d'));
    slot.appendChild(mv);
  }

  /* ---------- карточка бойца ---------- */
  function cardHTML() {
    return `
      <div class="ov-top"><button class="icon-btn js-close" aria-label="Закрыть">${I('x')}</button><b>Карточка бойца</b><button class="icon-btn" aria-label="Еще">${I('ellipsis')}</button></div>
      <div class="fcard-wrap">${fcard(true)}</div>
      <div class="ov-actions">
        <button class="btn btn-red btn-block js-share">${I('instagram')}Поделиться в сторис</button>
        <p class="note">Отметка @step.jiu.jitsu добавится сама</p>
      </div>`;
  }
  function fcard(live) {
    return `<div class="fcard js-fcard">
      <div class="sheen"></div>
      <div class="fc-top"><div class="fc-rating">${KID.rating}</div><div class="fc-pos">БЕЛЫЙ</div>${belt('white', 3, 4)}</div>
      <img class="fc-logo" src="img/step-mark-white.svg" alt="STEP">
      <div class="fc-hero" ${live ? 'data-hero="card"' : ''}><img class="hero-2d" src="img/${live ? 'hero-3q' : 'hero-win'}.webp" alt="" draggable="false"></div>
      <div class="fc-name"><b>АЛИХАН</b><i></i></div>
      <div class="fc-stats">${[[62, 'СИЛ'], [71, 'ГИБ'], [58, 'ТЕХ'], [66, 'ВЫН'], [84, 'ДУХ'], [36, 'ТРН']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
      <div class="fc-foot">STEP JIU JITSU ACADEMY · АСТАНА</div>
    </div>`;
  }
  function openCard() {
    const ov = $('#cardOverlay'); ov.classList.add('open'); ov.inert = false;
    const fc = ov.querySelector('.js-fcard'); fc.style.animation = 'none'; void fc.offsetWidth; fc.style.animation = '';
    tabbar.classList.add('hidden');
    mountHero(ov.querySelector('[data-hero="card"]'), 'card');
    if (!fc.dataset.bound) {
      fc.dataset.bound = 1;
      fc.addEventListener('pointermove', e => { if (reduce) return; const r = fc.getBoundingClientRect(); const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        if (!e.target.closest('model-viewer')) fc.style.transform = `rotateY(${dx * 12}deg) rotateX(${-dy * 10}deg)`; fc.querySelector('.sheen').style.setProperty('--sx', `${50 + dx * 120}%`); });
      fc.addEventListener('pointerleave', () => { fc.style.transform = ''; });
    }
  }
  function closeCard(quick) { const ov = $('#cardOverlay'); if (!ov.classList.contains('open')) return; ov.classList.remove('open'); ov.inert = true; tabbar.classList.remove('hidden'); closeStory(); }
  function sweepSheen() { const s = $('#cardOverlay .sheen'); if (!s || reduce) return; s.animate([{ backgroundPosition: '120% 0' }, { backgroundPosition: '-20% 0' }], { duration: 1200, easing: 'cubic-bezier(.77,0,.175,1)' }); }
  function openStory() {
    const st = $('#story');
    st.innerHTML = `<div class="story-frame"><div class="st-bars"><i></i><i></i><i></i></div><div class="st-title">Третья полоска Алихана в STEP</div>
      <div class="st-card">${fcard(false)}</div><span class="st-tag">@step.jiu.jitsu</span><span class="st-red"></span></div>
      <div class="story-actions"><button class="btn btn-white btn-block js-story-save">${I('instagram')}Выложить в сторис</button><button class="btn btn-ghost btn-block js-story-close">Назад к карточке</button></div>`;
    st.inert = false; requestAnimationFrame(() => st.classList.add('open'));
    $('#cardOverlay').classList.add('under-story');
  }
  function closeStory() { $('#story').classList.remove('open'); $('#story').inert = true; $('#cardOverlay').classList.remove('under-story'); }

  /* ---------- серия: футболка ---------- */
  function shirtSVG() {
    return `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M27 10 L15 15 L5 28 L14 35 L19 30 L19 70 L61 70 L61 30 L66 35 L75 28 L65 15 L53 10 C51 15 46 18 40 18 C34 18 29 15 27 10 Z" fill="#0B0B0C" stroke="#2A2A2E" stroke-width="1.2"/>
      <g transform="translate(26 36) scale(.044)"><use href="#stepmark"/></g>
      <image href="img/step-mark-white.svg" x="25" y="35" width="30" height="5"/></svg>`;
  }

  function toggleRules(card, on) {
    const open = on === undefined ? !card.classList.contains('open') : on;
    card.classList.toggle('open', open); card.querySelector('.js-rules').setAttribute('aria-expanded', String(open));
  }

  /* ---------- сообщения: голосовое ---------- */
  async function playVoice(el, t) {
    const bars = $$('.wave i', el), dur = el.querySelector('.js-dur'), btn = el.querySelector('.js-play');
    btn.innerHTML = I('pause');
    for (let i = 0; i < bars.length; i++) { bars[i].classList.add('on'); dur.textContent = `0:${String(Math.round(i / bars.length * 12)).padStart(2, '0')}`; await t.sleep(90); }
    dur.textContent = '0:12'; btn.innerHTML = I('play');
    await t.sleep(400); bars.forEach(b => b.classList.remove('on'));
  }

  /* ---------- ИИ-тренер ---------- */
  const POSE = { head: [135, 300], sh: [255, 330], el: [372, 360], hand: [525, 368], hip: [440, 252], kn: [600, 150], an: [640, 335], toe: [700, 345] };
  function poseSVG() {
    const L = (a, b, d) => `<line class="bone" style="--d:${d}ms" x1="${POSE[a][0]}" y1="${POSE[a][1]}" x2="${POSE[b][0]}" y2="${POSE[b][1]}"/>`;
    const J = (a, d) => `<circle class="jt" style="--d:${d}ms" cx="${POSE[a][0]}" cy="${POSE[a][1]}" r="11"/>`;
    // идеальная линия плечо-колено и стрелка вверх у таза
    const ideal = [POSE.sh, POSE.kn], hx = POSE.hip[0], hyIdeal = POSE.sh[1] + (POSE.kn[1] - POSE.sh[1]) * (hx - POSE.sh[0]) / (POSE.kn[0] - POSE.sh[0]);
    return `<svg class="pose" viewBox="0 0 768 512" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <line class="hint" x1="${ideal[0][0]}" y1="${ideal[0][1]}" x2="${ideal[1][0]}" y2="${ideal[1][1]}"/>
      <path class="hint" d="M${hx} ${POSE.hip[1] - 10} L${hx} ${hyIdeal + 6} M${hx - 9} ${hyIdeal + 16} L${hx} ${hyIdeal + 4} L${hx + 9} ${hyIdeal + 16}" style="stroke-dasharray:none"/>
      ${L('head', 'sh', 0)}${L('sh', 'el', 120)}${L('el', 'hand', 220)}${L('sh', 'hip', 160)}${L('hip', 'kn', 300)}${L('kn', 'an', 420)}${L('an', 'toe', 520)}
      ${['head', 'sh', 'el', 'hand', 'hip', 'kn', 'an'].map((k, i) => J(k, i * 90)).join('')}
      <g class="lbl" transform="translate(${hx - 330} ${hyIdeal - 118})"><rect width="300" height="58" rx="14"/><text x="22" y="39">таз выше на 4 см</text></g>
    </svg>`;
  }
  async function renderAiChat(el, instant, t) {
    const chat = el.querySelector('.js-chat'); chat.innerHTML = '';
    const add = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); const n = d.firstChild; if (instant) n.style.animation = 'none'; chat.appendChild(n); return n; };
    const scroll = () => { if (!instant) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); };
    const S = ms => instant ? null : t.sleep(ms);
    add(`<div class="in"><div class="bubble">Привет! Домашка от тренера Нурасыла: <b>мост 30 секунд</b>. Сними Алихана сбоку и пришли видео, я проверю технику.</div><p class="msg-meta">ИИ-тренер, 17:02</p></div>`);
    await S(900);
    add(`<div class="out"><div class="vid"><img src="img/bridge.webp" alt="Видео: Алихан делает мост дома"><span class="play-o">${I('play')}</span><div class="v-cap">Мост, домашка<span>0:34</span></div></div></div>`); scroll();
    await S(700);
    let typing; if (!instant) { typing = add(`<div class="in"><div class="bubble typing"><i></i><i></i><i></i></div></div>`); scroll(); await S(1100); typing.remove(); }
    const an = add(`<div class="in"><div class="bubble analysis ${instant ? 'go' : 'scanning'}">
        <div class="frame"><img src="img/bridge.webp" alt="">${poseSVG()}<span class="scan"></span></div>
        <div class="metrics"><div><b>31 с</b><span>держал мост, цель 30</span></div><div><b>3 из 3</b><span>подхода засчитаны</span></div></div>
        <div class="a-text"><strong>Отлично, Алихан!</strong> Мост держится ровно. Подсказка: поставь стопы ближе к тазу и толкайся пятками, тогда таз поднимется выше, а шея не устанет.</div>
        <div class="xp-row"><span class="xp-badge js-xp">+20 опыта</span><div class="xp-meter"><small>Уровень 7<em class="js-xpn">${instant ? '360' : '340'} / 400</em></small><div class="xp-track"><i class="js-xpbar" style="--xp:${instant ? 90 : 85}"></i></div></div></div>
      </div></div>`);
    scroll();
    if (instant) return;
    await S(2300);
    an.querySelector('.analysis').classList.remove('scanning'); an.querySelector('.analysis').classList.add('go');
    await S(1700); scroll();
    await S(500);
    const xp = an.querySelector('.js-xp'); xp.classList.add('bump'); an.querySelector('.js-xpbar').style.setProperty('--xp', 90);
    const n = an.querySelector('.js-xpn'); let v = 340; const iv = setInterval(() => { v += 2; n.textContent = `${v} / 400`; if (v >= 360) clearInterval(iv); }, 45);
    await S(1500);
  }

  /* ---------- тренер: группа ---------- */
  function updateCount(el) {
    const n = $$('.kid.here', el).length, total = KIDS.length;
    el.querySelector('.js-count').textContent = `${n}/${total}`;
    el.querySelector('.js-ring').style.strokeDashoffset = String(175.9 * (1 - n / total));
    const lbl = document.querySelector('.js-savelbl'); if (lbl) lbl.textContent = `Сохранить посещение, ${n} из ${total}`;
  }

  /* ---------- тренер: новый ученик ---------- */
  function resetAdd(el) {
    el.querySelector('.js-tr').className = 'transcript empty js-tr'; el.querySelector('.js-tr').textContent = '«Алихан, семь лет, мама Айгерим...»';
    el.querySelector('.js-micstate').textContent = 'Нажмите и говорите'; el.querySelector('.js-mic').classList.remove('live');
    $$('.field', el).forEach(f => { f.classList.remove('filled'); const v = f.querySelector('.v'); if (v) { v.className = 'v ph'; v.textContent = 'не заполнено'; } });
    $$('.src span', el).forEach(s => s.classList.remove('on'));
    const vf = el.querySelector('.js-vf'); vf.className = 'viewfinder js-vf'; vf.innerHTML = `<div class="vf-cam">${I('camera')}</div><span class="corners"></span><span class="flash"></span>`;
    el.querySelector('.js-pct').innerHTML = `<span class="stepper"><i class="on"></i><i></i>Фото для героя</span><b style="margin-top:8px">Сфотографируйте ребенка</b><p>Герой в ги STEP соберется сам за 10 секунд</p><button class="btn btn-white btn-sm js-shot">${I('camera')}Сделать фото</button>`;
    el.scrollTop = 0;
  }
  async function runAdd(el, t) {
    const mic = el.querySelector('.js-mic'), tr = el.querySelector('.js-tr'), st = el.querySelector('.js-micstate');
    tapPulse(mic); mic.classList.add('live'); st.innerHTML = 'Слушаю<span class="lvl">' + '<i></i>'.repeat(5) + '</span>';
    const lv = $$('.lvl i', st); const lvT = setInterval(() => lv.forEach(i => i.style.height = (3 + Math.random() * 11) + 'px'), 90);
    tr.className = 'transcript js-tr'; mark('listen');
    const words = 'Алихан, семь лет. Мама Айгерим, номер плюс семь семьсот семь четыреста восемнадцать двадцать шесть девяносто три. Пришли из инстаграма.'.split(' ');
    let s = '';
    try {
      for (const w of words) { s += (s ? ' ' : '') + w; tr.innerHTML = esc(s) + '<span class="caret"></span>'; await t.sleep(150); }
    } finally { clearInterval(lvT); }
    mic.classList.remove('live'); st.textContent = 'Распознано, заполняю карточку'; tr.innerHTML = esc(s);
    await t.sleep(350);
    for (const [k, , val] of FIELDS) {
      const f = el.querySelector(`.field[data-f="${k}"]`), v = f.querySelector('.v');
      v.className = 'v'; v.textContent = ''; f.classList.add('filled');
      for (let i = 1; i <= val.length; i++) { v.textContent = val.slice(0, i); await t.sleep(22); }
      await t.sleep(110);
    }
    const src = el.querySelector('.field[data-f="src"]'); src.classList.add('filled'); src.querySelector('[data-s="ig"]').classList.add('on');
    st.textContent = 'Карточка заполнена за 9 секунд';
    await t.sleep(700);
    await runPhoto(el, t);
  }
  async function runPhoto(el, t) {
    const vf = el.querySelector('.js-vf'), pct = el.querySelector('.js-pct');
    if (vf.classList.contains('busy')) return; vf.classList.add('busy');
    vf.innerHTML = `<img src="img/kid-photo.webp" alt="Фото ребенка с камеры"><span class="corners"></span><span class="flash"></span>`;
    pct.innerHTML = `<span class="stepper"><i class="on"></i><i></i>Камера</span><b style="margin-top:8px">Держите телефон ровно</b><p>Лицо в рамке, хватит одного кадра</p>`;
    await t.sleep(900);
    vf.querySelector('.flash').classList.add('go');
    await t.sleep(300);
    pct.innerHTML = `<span class="stepper"><i class="on"></i><i class="on"></i>Собираем героя</span><b style="margin-top:8px">Фото становится героем</b><p>Ги STEP, белый пояс, лицо Алихана</p>`;
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; vf.insertBefore(cv, vf.querySelector('.corners'));
    const [a, b] = await Promise.all([loadImg('img/kid-photo.webp'), loadImg('img/hero-bust.webp')]);
    vf.querySelector('img').style.opacity = '0';
    await morph(cv, a, b, reduce ? 50 : 2600, t);
    const done = document.createElement('img'); done.className = 'hero-done'; done.src = 'img/hero-bust.webp'; done.alt = 'Герой Алихана'; done.style.objectPosition = '50% 20%';
    vf.insertBefore(done, vf.querySelector('.corners')); requestAnimationFrame(() => vf.classList.add('done'));
    pct.innerHTML = `<span class="stepper"><i class="on"></i><i class="on"></i>Готово</span><b style="margin-top:8px">Герой Алихана готов</b><p>Белый пояс, 0 полосок. Маме ушла ссылка на STEP UP</p>${belt('white', 0, 4)}`;
    toast('Ученик добавлен', 'Алихан в группе 6-8 лет, маме отправлена ссылка', 'user-plus');
    vf.classList.remove('busy');
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    await t.sleep(3300);
  }
  async function waitHero(t, sel) {
    if (!(await glbAvailable())) return;
    for (let i = 0; i < 80; i++) { const s = $(sel); if (s && s.classList.contains('is-3d')) { await t.sleep(300); return; } await t.sleep(100); }
  }
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  function morph(cv, A, B, dur, t) {
    const S = 300, ctx = cv.getContext('2d');
    const off = (img, bust) => { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      if (bust) { const g = x.createRadialGradient(150, 120, 10, 150, 150, 220); g.addColorStop(0, '#2A2A2E'); g.addColorStop(1, '#151517'); x.fillStyle = g; x.fillRect(0, 0, S, S);
        const sc = S / img.width * 1.0; x.drawImage(img, 0, -S * .06, img.width * sc, img.height * sc); }
      else x.drawImage(img, 0, 0, S, S);
      return x.getImageData(0, 0, S, S).data; };
    const da = off(A, false), db = off(B, true), step = 4, P = [];
    for (let y = 0; y < S; y += step) for (let x = 0; x < S; x += step) {
      const i = ((y + 2) * S + (x + 2)) * 4, ang = Math.random() * Math.PI * 2, rad = 20 + Math.random() * 70;
      P.push({ x, y, ca: [da[i], da[i + 1], da[i + 2]], cb: [db[i], db[i + 1], db[i + 2]], mx: x + Math.cos(ang) * rad, my: y + Math.sin(ang) * rad - 30, d: Math.random() * .18 });
    }
    return new Promise(res => {
      const t0 = performance.now();
      const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const frame = now => {
        const k = Math.min(1, (now - t0) / dur);
        ctx.fillStyle = '#151517'; ctx.fillRect(0, 0, S, S);
        for (const p of P) {
          const kk = Math.min(1, Math.max(0, (k - p.d) / (1 - p.d)));
          let x, y, c, sz;
          if (kk < .45) { const e = ease(kk / .45); x = p.x + (p.mx - p.x) * e; y = p.y + (p.my - p.y) * e; c = p.ca; sz = 4 - 1.8 * e; }
          else { const e = ease((kk - .45) / .55); x = p.mx + (p.x - p.mx) * e; y = p.my + (p.y - p.my) * e; c = [0, 1, 2].map(j => p.ca[j] + (p.cb[j] - p.ca[j]) * Math.min(1, e * 1.3)); sz = 2.2 + 1.8 * e; }
          ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(x, y, sz, sz);
        }
        if (k < 1 && (!t || t.alive())) requestAnimationFrame(frame); else res();
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------- тренер: техника ---------- */
  function resetTechnique(el) {
    const tg = el.querySelector('.js-tg[data-i="3"]'); tg.classList.remove('on'); tg.setAttribute('aria-pressed', 'false'); tg.closest('.tech').classList.remove('done', 'pop');
    el.querySelector('.js-tcount').textContent = '3 из 5';
    setBeltStripes(el.querySelector('.js-tbelt'), 3); setBeltStripes(el.querySelector('.js-sbelt'), 3);
    el.querySelector('.js-stxt').textContent = '3 из 4, до серо-белого'; const b = el.querySelector('.js-stripe'); b.disabled = false; b.innerHTML = `${I('plus')}Поставить полоску`;
    $$('.tech.lit', el).forEach(x => x.classList.remove('lit'));
    $$('.js-pc', el).forEach(c => c.classList.remove('on')); el.querySelector('.js-ptext').innerHTML = '<span style="color:#9A9A9F">Напишите или надиктуйте пару слов</span>';
    el.scrollTop = 0;
  }
  function toggleTech(el, tg) {
    const on = !tg.classList.contains('on'); tg.classList.toggle('on', on); tg.setAttribute('aria-pressed', String(on));
    const row = tg.closest('.tech'); row.classList.toggle('done', on); row.classList.remove('pop'); if (on) { void row.offsetWidth; row.classList.add('pop'); }
    el.querySelector('.js-tcount').textContent = `${$$('.tlist .tech.done', el).length} из 5`;
    if (on && tg.dataset.i === '3') toast('Ачивка «Первый армбар»', 'Алихан и мама увидят ее в приложении', 'zap', true);
  }
  function giveStripe(el) {
    const b = el.querySelector('.js-stripe'); if (b.disabled) return;
    setBeltStripes(el.querySelector('.js-tbelt'), 4, true); setBeltStripes(el.querySelector('.js-sbelt'), 4, true);
    el.querySelector('.js-stxt').textContent = '4 из 4, можно на серо-белый';
    b.disabled = true; b.innerHTML = `${I('check')}Полоска поставлена`;
    const r = el.querySelector('.stripe-card').getBoundingClientRect(), a = app.getBoundingClientRect(), sc = a.width / 390;
    confetti({ x: .5, y: Math.min(.9, (r.top - a.top) / sc / 844 + .05) });
    toast('Алихан получил 4-ю полоску', 'Родители уже видят ее на герое', 'award', true);
  }

  /* ---------- масштаб рамки под окно ---------- */
  function fit() {
    if (!FRAME || innerWidth <= 520) return;
    const wrap = $('.device-wrap'), dev = $('.device'), barH = $('.deck-bar').offsetHeight;
    const s = Math.min(1, (innerHeight - barH - 56) / 868, (innerWidth - 32) / 414);
    wrap.style.width = 414 * s + 'px'; wrap.style.height = 868 * s + 'px';
    dev.style.width = '414px'; dev.style.height = '868px'; dev.style.transform = `scale(${s})`; dev.style.transformOrigin = '0 0';
  }
  addEventListener('resize', fit);

  /* ---------- старт ---------- */
  const auto = qs.get('autoplay');
  const startId = auto || qs.get('screen') || ROLES[qs.get('role') || 'parent'].start;
  const startRole = roleOf(startId) || qs.get('role') || 'parent';
  setRole(startRole, { keep: true });
  const baseId = ['card', 'card-story'].includes(startId) ? 'card' : { 'home-stripe': 'home', 'home-stats': 'home', 'streak-rules': 'streak', 'technique-armbar': 'technique' }[startId] || startId;
  if (SCREENS[baseId] || baseId === 'card') go(baseId, { silent: true }); else go(ROLES[startRole].start, { silent: true });
  fit();
  mountHero($('#cardOverlay [data-hero="card"]'), 'card');
  if (qs.get('anchor')) setTimeout(() => { const a = document.getElementById(qs.get('anchor')); if (a) a.closest('.screen').scrollTop = a.offsetTop - 60; }, 50);
  if (auto) {
    window.__autoplayDone = false;
    const begin = () => playScreen(auto);
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(begin, 150));
  } else {
    window.__autoplayDone = true;
    if (startId === 'add' && qs.get('state') === 'done') { const el = $('#s-add'); runAdd(el, { sleep: () => Promise.resolve(), alive: () => true }); }
  }
  window.STEP_UP = { go, setRole, playScreen, screens: Object.keys(SCREENS).concat('card') };
})();
