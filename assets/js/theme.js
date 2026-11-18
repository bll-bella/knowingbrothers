(function () {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-pressed', theme === 'dark');
  }

  toggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    apply(next);
  });
})();
