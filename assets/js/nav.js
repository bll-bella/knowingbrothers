(function () {
  const toggle = document.getElementById('navToggle');
  const headerInner = document.getElementById('headerInner');
  if (!toggle || !headerInner) return;

  function setOpen(open) {
    headerInner.setAttribute('data-nav-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    const isOpen = headerInner.getAttribute('data-nav-open') === 'true';
    setOpen(!isOpen);
  });

  // Tutup menu otomatis begitu salah satu link nav diklik.
  document.querySelectorAll('#mainNav a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
})();
