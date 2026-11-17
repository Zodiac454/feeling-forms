/**
 * Интерфейс чат-помощника.
 * Отправляет вопрос на /api/chat (прокси DeepSeek).
 * Если сервер или ключ недоступны — отвечает локально по данным сайта.
 */

import { buildMessages, localAnswer } from './assistant.js';

export function initChat({ organs, about }) {
  const template = document.getElementById('tpl-chat');

  if (!template) {
    return;
  }

  const root = template.content.firstElementChild.cloneNode(true);
  document.body.append(root);

  const launcher = root.querySelector('[data-chat-open]');
  const panel = root.querySelector('.chat__panel');
  const closeButton = root.querySelector('[data-chat-close]');
  const log = root.querySelector('[data-chat-log]');
  const chips = root.querySelector('[data-chat-chips]');
  const form = root.querySelector('.chat__form');
  const input = root.querySelector('.chat__input');
  const sendButton = root.querySelector('.chat__send');
  const status = root.querySelector('[data-chat-status]');
  const messageTemplate = document.getElementById('tpl-chat-msg');

  let history = [];
  let busy = false;
  let useAI = true;

  addMessage(
    'bot',
    'Здравствуйте! Я помощник по материалам исследования. Спросите о метафорах, эмоциях или проекте.'
  );

  checkHealth();

  launcher.addEventListener('click', () => {
    setOpen(true);

    if (!useAI) {
      checkHealth();
    }
  });
  closeButton.addEventListener('click', () => setOpen(false));

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  });

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-chip]');

    if (chip) {
      send(chip.textContent);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send(input.value);
  });

  input.addEventListener('input', resizeInput);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  async function checkHealth() {
    try {
      const response = await fetch('/api/health');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      useAI = Boolean(data.ok && data.hasKey);
      setStatus(useAI ? 'DeepSeek подключён' : 'локальный режим');
    } catch (error) {
      useAI = false;
      setStatus('локальный режим');
    }
  }

  async function send(raw) {
    const text = raw.trim();

    if (!text || busy) {
      return;
    }

    input.value = '';
    resizeInput();
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    setBusy(true);

    const typing = addMessage('bot', 'Печатает…', 'chat__msg--typing');

    let reply;

    try {
      reply = await answer(text);
    } catch (error) {
      console.warn('Помощник ответил локально:', error);
      reply = localAnswer(text, organs, about).text;
      useAI = false;
      setStatus('локальный режим');
    }

    typing.remove();
    addMessage('bot', reply);
    history.push({ role: 'assistant', content: reply });
    history = history.slice(-8);

    setBusy(false);
    input.focus();
  }

  async function answer(text) {
    if (useAI) {
      try {
        return await askDeepSeek();
      } catch (error) {
        console.warn('DeepSeek недоступен:', error);
        useAI = false;
        setStatus('локальный режим');
      }
    }

    return localAnswer(text, organs, about).text;
  }

  async function askDeepSeek() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: buildMessages(history, organs, about) }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.answer) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data.answer;
    } finally {
      clearTimeout(timer);
    }
  }

  function addMessage(role, text, extraClass = '') {
    const node = messageTemplate.content.firstElementChild.cloneNode(true);

    node.classList.add(`chat__msg--${role}`);

    if (extraClass) {
      node.classList.add(extraClass);
    }

    node.querySelector('.chat__text').textContent = text;
    log.append(node);
    log.scrollTop = log.scrollHeight;

    return node;
  }

  function setOpen(open) {
    root.classList.toggle('chat--open', open);
    launcher.setAttribute('aria-expanded', String(open));

    if (open) {
      input.focus();
      log.scrollTop = log.scrollHeight;
    } else {
      launcher.focus();
    }
  }

  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }
}
