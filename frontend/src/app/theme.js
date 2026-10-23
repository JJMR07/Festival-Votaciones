import { useEffect, useRef, useState } from 'react';

export const THEME_KEY = 'festival-theme';
const validThemes = new Set(['light', 'dark', 'system']);
export function readTheme() {
  try { const value = localStorage.getItem(THEME_KEY); return validThemes.has(value) ? value : 'system'; }
  catch { return 'system'; }
}

export function useTheme() {
  const [theme, updateTheme] = useState(readTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const previousTheme = useRef(resolvedTheme);
  const transitionTimer = useRef(null);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const change = event => setSystemDark(event.matches);
    media.addEventListener?.('change', change);
    return () => media.removeEventListener?.('change', change);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (previousTheme.current !== resolvedTheme) {
      clearTimeout(transitionTimer.current);
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        root.classList.add('theme-changing');
        transitionTimer.current = setTimeout(() => root.classList.remove('theme-changing'), 220);
      } else { root.classList.remove('theme-changing'); }
      previousTheme.current = resolvedTheme;
    }
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080809');
  }, [resolvedTheme]);
  useEffect(() => () => {
    clearTimeout(transitionTimer.current);
    document.documentElement.classList.remove('theme-changing');
  }, []);
  useEffect(() => {
    const sync = event => { if (event.key === THEME_KEY || event.key === null) updateTheme(readTheme()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function setTheme(value) {
    if (!validThemes.has(value)) return;
    updateTheme(value);
    try { localStorage.setItem(THEME_KEY, value); } catch { /* Sigue funcionando si el navegador bloquea el almacenamiento. */ }
  }
  return { theme, resolvedTheme, setTheme };
}
