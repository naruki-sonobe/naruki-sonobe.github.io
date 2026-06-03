/* ============================================================
   Naruki Sonobe — site interactions
   Handles dark/light theme + EN/JA language toggles.
   State is saved in localStorage so it persists across pages.
   ============================================================ */
(function () {
  var root = document.documentElement;
  var mql = window.matchMedia('(prefers-color-scheme: dark)');

  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return mql.matches ? 'dark' : 'light';
  }

  function updateThemeIcon() {
    var isDark = effectiveTheme() === 'dark';
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.classList.toggle('fa-moon', !isDark);
      el.classList.toggle('fa-sun', isDark);
    });
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    updateThemeIcon();
  }

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    try { localStorage.setItem('lang', lang); } catch (e) {}
    if (window.PAGE_TITLE && window.PAGE_TITLE[lang]) {
      document.title = window.PAGE_TITLE[lang];
    }
  }

  // Delegated handler so the toggles work both in the desktop nav and in the
  // dynamically-built mobile bar (which has its own copies of the buttons).
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'theme') {
      setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
    } else if (act === 'lang') {
      setLang(root.getAttribute('data-lang') === 'ja' ? 'en' : 'ja');
    }
  });

  // Tag the existing desktop nav buttons so the delegated handler picks them up.
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.setAttribute('data-act', 'theme');
  var langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.setAttribute('data-act', 'lang');

  // Keep the icon in sync if the OS theme changes while in "auto" mode.
  mql.addEventListener('change', function () {
    if (root.getAttribute('data-theme') === 'auto') updateThemeIcon();
  });

  buildMobileNav();
  updateThemeIcon();

  // ----------------------------------------------------------------
  // Mobile navigation: a sticky top bar + slide-in drawer that holds
  // the sidebar profile and the page navigation. Built here so every
  // page picks it up from this single shared script (styles in style.css).
  // ----------------------------------------------------------------
  function buildMobileNav() {
    if (document.querySelector('.mobile-bar')) return;

    var sidebar = document.querySelector('.sidebar');
    var navLinks = document.querySelectorAll('.main > .nav a');

    // --- Sticky top bar (brand + language/theme toggles + hamburger) ---
    var bar = document.createElement('header');
    bar.className = 'mobile-bar';
    bar.innerHTML =
      '<a class="mobile-brand" href="index.html">' +
        '<span data-lang="en">Naruki Sonobe</span>' +
        '<span data-lang="ja">薗部 成輝</span>' +
      '</a>';

    var actions = document.createElement('div');
    actions.className = 'mobile-actions';
    actions.innerHTML =
      '<button class="ctrl-btn" data-act="lang" type="button" aria-label="Switch language / 言語切替">' +
        '<span data-lang="en">日本語</span><span data-lang="ja">EN</span>' +
      '</button>' +
      '<button class="ctrl-btn" data-act="theme" type="button" aria-label="Toggle dark mode / テーマ切替">' +
        '<i class="fa-solid fa-moon" data-theme-icon aria-hidden="true"></i>' +
      '</button>';

    var burger = document.createElement('button');
    burger.className = 'hamburger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Open menu / メニュー');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';
    actions.appendChild(burger);
    bar.appendChild(actions);

    // --- Overlay + drawer ---
    var overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';

    var drawer = document.createElement('nav');
    drawer.className = 'mobile-drawer';
    drawer.setAttribute('aria-label', 'Site navigation');

    var close = document.createElement('button');
    close.className = 'drawer-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close menu / 閉じる');
    close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    drawer.appendChild(close);

    // Profile (cloned from the sidebar).
    if (sidebar) {
      ['.profile-photo', 'h1', '.name-jp', '.meta-list'].forEach(function (sel) {
        var el = sidebar.querySelector(sel);
        if (el) drawer.appendChild(el.cloneNode(true));
      });
    }

    // Page navigation links.
    if (navLinks.length) {
      drawer.appendChild(makeDivider());
      var ul = document.createElement('ul');
      ul.className = 'drawer-links';
      navLinks.forEach(function (a) {
        var li = document.createElement('li');
        li.appendChild(a.cloneNode(true));
        ul.appendChild(li);
      });
      drawer.appendChild(ul);
    }

    // Social / contact links (cloned from the sidebar).
    var social = sidebar && sidebar.querySelector('.social-list');
    if (social) {
      drawer.appendChild(makeDivider());
      drawer.appendChild(social.cloneNode(true));
    }

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // --- Open / close wiring ---
    function open() {
      document.body.classList.add('drawer-open');
      burger.setAttribute('aria-expanded', 'true');
    }
    function shut() {
      document.body.classList.remove('drawer-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function () {
      document.body.classList.contains('drawer-open') ? shut() : open();
    });
    close.addEventListener('click', shut);
    overlay.addEventListener('click', shut);
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) shut();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') shut();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) shut();
    });

    function makeDivider() {
      var hr = document.createElement('hr');
      hr.className = 'divider';
      return hr;
    }
  }

  // Fill the footer "last updated" date.
  // Site-wide single date = the repository's latest commit (updates on every push,
  // identical across all pages). Falls back to this page's file date if the API
  // is unavailable (offline, rate-limited, or opened locally via file://).
  (function setLastUpdated() {
    var footer = document.querySelector('.footer');
    if (!footer) return;

    var months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

    function render(d) {
      if (isNaN(d.getTime())) return;
      var en = 'Last updated: ' + months[d.getMonth()] + ' ' + d.getFullYear();
      var ja = '最終更新：' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
      var spanEn = document.createElement('span');
      spanEn.setAttribute('data-lang', 'en');
      spanEn.textContent = en;
      var spanJa = document.createElement('span');
      spanJa.setAttribute('data-lang', 'ja');
      spanJa.textContent = ja;
      footer.innerHTML = '';
      footer.appendChild(spanEn);
      footer.appendChild(spanJa);
    }

    // Show the per-page file date immediately so something always appears.
    render(new Date(document.lastModified));

    // Then override with the repo-wide latest commit date.
    var REPO = 'naruki-sonobe/naruki-sonobe.github.io';
    fetch('https://api.github.com/repos/' + REPO + '/commits?per_page=1')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data[0] && data[0].commit && data[0].commit.committer) {
          render(new Date(data[0].commit.committer.date));
        }
      })
      .catch(function () { /* keep the fallback date */ });
  })();
})();