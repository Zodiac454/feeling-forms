/**
 * Точка входа приложения.
 * 1. Загружает данные из JSON.
 * 2. Рисует карточки, модальные окна и раздел «О проекте».
 * 3. Подключает интерактив: окна, тему, язык.
 */

import { loadJSON } from './api.js';
import { renderOrgans, renderModals, renderAbout, renderFeedback } from './render.js';
import { initModals } from './modal.js';
import { initTheme } from './theme.js';
import { initI18n } from './i18n.js';
import { initFeedback } from './feedback.js';
import { initChat } from './chat.js';

const grid = document.getElementById('organs-grid');
const modalsContainer = document.getElementById('modals');

start();

async function start() {
  try {
    const [organs, about] = await Promise.all([
      loadJSON('data/organs.json'),
      loadJSON('data/about.json'),
    ]);

    renderOrgans(organs, grid);
    renderModals(organs, modalsContainer);
    renderAbout(about, modalsContainer);

    const feedbackModal = renderFeedback(modalsContainer);

    initModals();
    initFeedback(feedbackModal.querySelector('#feedback-form'));
    initTheme(document.querySelector('[data-action="toggle-theme"]'));
    initI18n(document.querySelector('[data-action="toggle-lang"]'));
    initChat({ organs, about });
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

function showLoadError() {
  const message = document.createElement('p');
  message.className = 'organs__status organs__status--error';
  message.textContent =
    'Не удалось загрузить данные. Откройте сайт через локальный сервер — инструкция в README.md.';

  grid.replaceChildren(message);
}
