// Ejecutado antes de cargar CSS/React para evitar un destello claro en modo oscuro.
(function () {
  var theme = 'system';
  try { theme = localStorage.getItem('festival-theme') || 'system'; } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
