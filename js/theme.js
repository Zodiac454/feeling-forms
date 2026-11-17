/**
 * Тёмная и светлая тема.
 * Выбор сохраняется в localStorage, при первом визите берётся из настроек системы.
 */

const STORAGE_KEY = 'theme';
const DARK = 'dark';
const LIGHT = 'light';

export function initTheme(button) {
  if (!button) {
    return;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  let theme = saved === DARK ? DARK : LIGHT;

  applyTheme(theme);

  button.addEventListener('click', () => {
    theme = theme === DARK ? LIGHT : DARK;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  });

  function applyTheme(value) {
    const isDark = value === DARK;

    document.body.dataset.theme = value;
    button.textContent = isDark ? '🌙' : '☀️';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute(
      'aria-label',
      isDark ? 'Включить светлую тему' : 'Включить тёмную тему'
    );
  }
}
