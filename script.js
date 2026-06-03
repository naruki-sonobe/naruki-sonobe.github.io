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

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  var langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(root.getAttribute('data-lang') === 'ja' ? 'en' : 'ja');
    });
  }

  // Keep the icon in sync if the OS theme changes while in "auto" mode.
  mql.addEventListener('change', function () {
    if (root.getAttribute('data-theme') === 'auto') updateThemeIcon();
  });

  updateThemeIcon();

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