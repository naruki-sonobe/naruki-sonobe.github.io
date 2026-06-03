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
})();
