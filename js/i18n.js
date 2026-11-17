/**
 * Переключение языка интерфейса.
 * Элементы с data-ru и data-en получают нужный текст, выбор запоминается.
 */

const STORAGE_KEY = 'lang';
const RU = 'ru';
const EN = 'en';

export function initI18n(button) {
  if (!button) {
    return;
  }

  let lang = localStorage.getItem(STORAGE_KEY) === EN ? EN : RU;

  applyLang(lang);

  button.addEventListener('click', () => {
    lang = lang === RU ? EN : RU;
    applyLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  });

  function applyLang(value) {
    const isEnglish = value === EN;

    document.documentElement.lang = value;

    document.querySelectorAll('[data-ru][data-en]').forEach((element) => {
      element.textContent = isEnglish ? element.dataset.en : element.dataset.ru;
    });

    button.textContent = isEnglish ? 'RU Русский' : 'EN English';
    button.setAttribute('aria-pressed', String(isEnglish));
  }
}
