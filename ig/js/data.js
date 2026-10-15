/* Content of the mock: profile, posts, highlights.
   Texts follow the brand rules: no long dashes, no letter "yo", no invented prices or reviews. */
(function () {
  const I = window.ICON;

  window.PROFILE = {
    username: 'step.jiu.jitsu',
    name: 'STEP Jiu-Jitsu Academy · BJJ Астана',
    category: 'Спортивный клуб',
    posts: 25,
    followers: 613,
    following: 1,
    // bio is kept under 150 characters (checked in app.js on load)
    bio: [
      'Джиу-джитсу для детей с 4 лет и взрослых',
      'Главный тренер @nurassylsensei',
      'Бронзовый призер чемпионата мира',
      'Астана, Достык 3',
      'Запись на пробную ниже',
    ],
  };

  // p00 is the new pinned reel (ad A). The rest are the club's current reels with new covers.
  window.POSTS = [
    {
      id: 'p00', kind: 'reel', pinned: true, tag: 'Новый рилс',
      title: 'Ему 6. И он только что бросил тренера',
      img: 'img/new/reel_a_frame.webp',
      caption: 'Ему 6. И он только что бросил тренера. Дети с 4 лет учатся бросать, правильно падать и верить в себя. Запишитесь на пробную тренировку по кнопке в профиле.',
      likes: 1284, comments: 96, reposts: 41, shares: 218, views: '24,7 тыс.',
      video: 'video/reel-a.mp4',
    },
    // three new formats we will produce for the club
    { id: 'n01', kind: 'toon', tag: 'Родителям', title: 'Мама, смотри', img: 'img/new/moms_frame.webp',
      bubble: 'А мой теперь сам меня на тренировку тащит!',
      likes: 236, comments: 31, reposts: 6, shares: 44, views: '7 105',
      caption: 'А мой теперь сам меня на тренировку тащит! Узнали себя? Отметьте маму, которой это знакомо.' },
    { id: 'n02', kind: 'type', tag: 'Почему BJJ', title: 'И ни одного удара.', sub: 'Джиу-джитсу: контроль вместо драки',
      likes: 184, comments: 17, reposts: 9, shares: 38, views: '5 640',
      caption: 'И ни одного удара. В джиу-джитсу дети учатся удерживать и контролировать соперника, поэтому тренировки проходят спокойно и безопасно.' },
    { id: 'n03', kind: 'app', tag: 'STEP UP', title: 'Прогресс ребенка в телефоне', img: 'img/new/app_home.webp',
      likes: 152, comments: 24, reposts: 3, shares: 21, views: '4 930',
      caption: 'Скоро в STEP: приложение, где родитель видит прогресс ребенка. Полоски, техники и похвала тренера в одном месте.' },
    { id: 'p01', tag: 'Дети', title: 'Сильные<br>духом', likes: 87, comments: 6, reposts: 1, shares: 4, views: '1 912',
      caption: 'Он улыбается так после каждой тренировки. Сильные духом растут на татами STEP.' },
    { id: 'p02', tag: 'Дети', title: 'Цена<br>опоздания', likes: 64, comments: 4, reposts: 0, shares: 3, views: '1 408',
      caption: 'Опоздал на тренировку? Вся группа уже знает, что будет дальше. Досмотрите до конца.' },
    { id: 'p03', tag: 'Игра', title: 'Игровая<br>пятница', likes: 112, comments: 9, reposts: 2, shares: 7, views: '2 233',
      caption: 'По пятницам у нас игровая тренировка. Дети играют, борются и уходят домой довольными.' },
    { id: 'p04', tag: 'Игра', title: 'Глухой<br>телефон', likes: 160, comments: 21, reposts: 3, shares: 11, views: '3 870',
      caption: 'Сыграли в глухой телефон прямо на татами. Угадайте, что дошло до последнего игрока.' },
    { id: 'p05', tag: 'Родителям', title: 'Родители<br>на татами', likes: 58, comments: 3, reposts: 0, shares: 2, views: '1 156',
      caption: 'Каждый четверг тренировка для родителей. Попробуйте то, чему учится ваш ребенок.' },
    { id: 'p06', tag: 'Турнир', title: 'BJJ Open', likes: 141, comments: 12, reposts: 2, shares: 6, views: '2 941', collab: 'rinakaligazy',
      caption: 'BJJ Open. Турнирный день учеников STEP.' },
    { id: 'p07', tag: 'Тренер', title: 'Медали<br>учеников', likes: 196, comments: 18, reposts: 4, shares: 9, views: '4 102', collab: 'nurassylsensei',
      caption: 'Медали учеников и их тренер @nurassylsensei. Гордимся каждым.' },
    { id: 'p08', tag: 'Турнир', title: 'Как судят<br>схватку', likes: 73, comments: 5, reposts: 0, shares: 2, views: '1 530', collab: 'rinakaligazy',
      caption: 'Судья поднимает руку, схватка начинается. Турнирный день глазами родителя.' },
    { id: 'p09', tag: 'Турнир', title: 'Karaganda<br>Open', likes: 128, comments: 11, reposts: 1, shares: 5, views: '2 618', collab: 'beka__askarbekov',
      caption: 'Karaganda Open. Медаль нашего ученика и много опыта на ковре.' },
    { id: 'p10', tag: 'Дети', title: 'Маленькие<br>шаги', likes: 92, comments: 7, reposts: 1, shares: 4, views: '1 987',
      caption: 'Маленькие шаги, большие победы. Так выглядит обычная детская тренировка в STEP.' },
    { id: 'p11', tag: 'Турнир', title: 'Nurly<br>Astana', likes: 104, comments: 8, reposts: 1, shares: 3, views: '2 245', collab: 'nurassylsensei',
      caption: 'Турнир Nurly Astana. Слушаем тренера и выходим на ковер.' },
    { id: 'p12', tag: 'Турнир', title: 'Новая<br>медаль', likes: 119, comments: 10, reposts: 2, shares: 6, views: '2 489', collab: 'nurassylsensei',
      caption: 'Новая медаль в копилку клуба. Спасибо партнеру Aquaterra.' },
  ];

  window.WA_TEXT = {
    trial: 'Здравствуйте! Хочу записать ребенка на пробную тренировку в STEP.',
    parents: 'Здравствуйте! Хочу прийти на тренировку для родителей в четверг.',
    prices: 'Здравствуйте! Подскажите, пожалуйста, цены на абонементы для ребенка.',
  };

  const logo = '<img class="sl-logo" src="img/step-logo-white.svg" alt="STEP Jiu Jitsu Academy">';
  const kicker = (t) => `<div class="kicker"><i></i><span>${t}</span></div>`;
  const photo = (src, pos) => `<img class="sl-bg" src="${src}" alt="" style="object-position:${pos || '50% 50%'}"><div class="sl-shade"></div>`;
  const cta = (wa, label) => `<button type="button" class="sl-cta" data-wa="${wa}">${I.whatsapp}<span>${label}</span></button>`;

  window.HIGHLIGHTS = [
    {
      id: 'trial', label: 'Пробная', icon: 'handWaving',
      slides: [
        { dur: 6, html: `<div class="sl sl--photo">${photo('img/posts/p03-full.webp', '50% 40%')}
          <div class="sl-foot">${kicker('Пробная')}<h3 class="sl-title">Первая тренировка в STEP</h3>
          <p class="sl-text">Для детей с 4 лет и взрослых. Познакомитесь с тренером, залом и группой.</p></div></div>` },
        { dur: 10, html: `<div class="sl sl--dark">${logo}
          <div class="sl-body">${kicker('Пробная')}<h3 class="sl-title">Как записаться</h3>
          <ol class="steps">
            <li><b>1</b><span>Напишите нам в WhatsApp или в директ</span></li>
            <li><b>2</b><span>Подберем группу по возрасту и удобный день</span></li>
            <li><b>3</b><span>Приходите в спортивной одежде и возьмите воду</span></li>
          </ol></div>
          <div class="sl-actions">${cta('trial', 'Написать в WhatsApp')}<p class="sl-addr">${I.mapPin}<span>Астана, Достык 3</span></p></div></div>` },
      ],
    },
    {
      id: 'coach', label: 'Тренер', icon: 'medal',
      slides: [
        { dur: 6, html: `<div class="sl sl--photo">${photo('img/posts/p07-full.webp', '40% 50%')}
          <div class="sl-foot">${kicker('Главный тренер')}<h3 class="sl-title">Нурасыл Утепов</h3>
          <p class="sl-text">@nurassylsensei. Тренирует детей и взрослых в STEP.</p></div></div>` },
        { dur: 9, html: `<div class="sl sl--dark">${logo}
          <div class="sl-body"><img class="coach-face" src="img/coach-face.webp" alt="Нурасыл Утепов">
          ${kicker('Тренер')}<h3 class="sl-title">Нурасыл Утепов</h3>
          <ul class="facts">
            <li><i class="belt"></i><span>Мастер спорта РК</span></li>
            <li><i class="belt"></i><span>Чемпион Казахстана</span></li>
            <li><i class="belt"></i><span>Бронзовый призер чемпионата мира</span></li>
            <li><i class="belt"></i><span>Амбассадор Kingz Kazakhstan</span></li>
          </ul></div></div>` },
      ],
    },
    {
      id: 'stepup', label: 'STEP UP', icon: 'deviceMobile',
      slides: [
        { dur: 7, html: `<div class="sl sl--glow">
          <div class="su-top"><img class="su-logo" src="img/step-up-white.svg" alt="STEP UP"><span class="soon">Скоро</span></div>
          <img class="su-hero" src="img/hero-pose.webp" alt="Герой ребенка в ги STEP">
          <div class="sl-foot sl-foot--glow"><h3 class="sl-title">Приложение, где видно прогресс ребенка</h3></div></div>` },
        { dur: 10, html: `<div class="sl sl--dark">${logo}
          <div class="sl-body">${kicker('STEP UP')}<h3 class="sl-title">Что увидит родитель</h3>
          <div class="beltbar" aria-label="Пример: белый пояс, 3 полоски из 4">
            <div class="beltbar-belt"><span class="beltbar-tab"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div>
            <p>Белый пояс, 3 полоски из 4</p>
          </div>
          <ul class="points">
            <li style="--c:var(--belt-yellow)"><span>Героя ребенка, который растет после каждой тренировки</span></li>
            <li style="--c:var(--belt-orange)"><span>Путь до следующего пояса: полоски и техники</span></li>
            <li style="--c:var(--belt-green)"><span>Похвалу тренера и напоминания о тренировках</span></li>
          </ul></div><img class="su-bust" src="img/hero-bust.webp" alt=""></div>` },
      ],
    },
    {
      id: 'tour', label: 'Турниры', icon: 'trophy',
      slides: [
        { dur: 5, html: `<div class="sl sl--photo">${photo('img/posts/p06-full.webp', '50% 40%')}
          <div class="sl-foot">${kicker('Турнир')}<h3 class="sl-title">BJJ Open</h3><p class="sl-text">Турнирный день учеников STEP.</p></div></div>` },
        { dur: 5, html: `<div class="sl sl--photo">${photo('img/posts/p09-full.webp', '50% 35%')}
          <div class="sl-foot">${kicker('Турнир')}<h3 class="sl-title">Karaganda Open</h3><p class="sl-text">Медаль нашего ученика.</p></div></div>` },
        { dur: 5, html: `<div class="sl sl--photo">${photo('img/posts/p12-full.webp', '50% 40%')}
          <div class="sl-foot">${kicker('Турнир')}<h3 class="sl-title">Новая медаль</h3><p class="sl-text">Награждение ученика STEP. Спасибо партнеру Aquaterra.</p></div></div>` },
      ],
    },
    {
      id: 'parents', label: 'Родителям', icon: 'usersThree',
      slides: [
        { dur: 8, html: `<div class="sl sl--dark sl--top-photo"><img class="sl-topimg" src="img/posts/p05.webp" alt=""><div class="sl-topfade"></div>
          <div class="sl-foot">${kicker('Родителям')}<h3 class="sl-title">Четверг для родителей</h3>
          <p class="sl-text">Каждый четверг тренировка для мам и пап. Попробуйте то, чему учится ваш ребенок.</p>
          ${cta('parents', 'Записаться на четверг')}</div></div>` },
        { dur: 9, html: `<div class="sl sl--dark">${logo}
          <div class="sl-body">${kicker('Родителям')}<h3 class="sl-title">Коротко о клубе</h3>
          <dl class="recap">
            <div><dt>Возраст</dt><dd>дети с 4 лет и взрослые</dd></div>
            <div><dt>Главный тренер</dt><dd>Нурасыл Утепов</dd></div>
            <div><dt>Родителям</dt><dd>тренировка по четвергам</dd></div>
            <div><dt>Адрес</dt><dd>Астана, Достык 3</dd></div>
            <div><dt>Запись</dt><dd>WhatsApp или директ</dd></div>
          </dl></div></div>` },
      ],
    },
    {
      id: 'prices', label: 'Цены', icon: 'tag',
      slides: [
        { dur: 10, html: `<div class="sl sl--dark">${logo}
          <div class="sl-body"><span class="note">Пример оформления, цены уточняются</span>
          <h3 class="sl-title">Цены и абонементы</h3>
          <ul class="prices">
            <li><div><b>Пробная тренировка</b><span>знакомство с тренером и группой</span></div><em>уточняется</em></li>
            <li><div><b>Абонемент на месяц</b><span>дети с 4 лет и взрослые</span></div><em>уточняется</em></li>
            <li><div><b>Тренировка для родителей</b><span>по четвергам</span></div><em>уточняется</em></li>
          </ul></div>
          <div class="sl-actions">${cta('prices', 'Узнать цены в WhatsApp')}</div></div>` },
      ],
    },
  ];

  // Direct: frequent questions with instant replies (shows the AI manager idea)
  window.FAQ = [
    { q: 'Как записаться на пробную?', a: 'Здравствуйте! Пробная проходит по записи. Подскажите возраст ребенка, и мы предложим ближайшие дни.', open: 'trial' },
    { q: 'Сколько стоит абонемент?', a: 'Цена зависит от группы и абонемента. Подскажите возраст ребенка, и мы пришлем актуальные условия.', open: 'prices' },
    { q: 'С какого возраста можно?', a: 'Берем детей с 4 лет. Для взрослых свои группы, а по четвергам тренировка для родителей.', open: 'parents' },
  ];
})();
