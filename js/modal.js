/**
 * Управление модальными окнами:
 * открытие по клику, закрытие по крестику, фону и Esc,
 * блокировка прокрутки страницы и удержание фокуса внутри окна.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let lastFocused = null;
let activeModal = null;

export function initModals() {
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-modal]');

    if (opener) {
      event.preventDefault();
      openModal(document.getElementById(opener.dataset.modal), opener);
      return;
    }

    const closer = event.target.closest('[data-close]');

    if (closer) {
      event.preventDefault();
      closeModal(closer.closest('.modal'));
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!activeModal) {
      return;
    }

    if (event.key === 'Escape') {
      closeModal(activeModal);
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(event, activeModal);
    }
  });

  openFromHash();
}

function openModal(modal, opener) {
  if (!modal) {
    return;
  }

  if (activeModal) {
    closeModal(activeModal, false);
  }

  lastFocused = opener || document.activeElement;
  activeModal = modal;

  modal.classList.add('modal--open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('page--locked');
  history.replaceState(null, '', `#${modal.id}`);

  const closeButton = modal.querySelector('.modal__close');
  if (closeButton) {
    closeButton.focus();
  }
}

function closeModal(modal, restoreFocus = true) {
  if (!modal) {
    return;
  }

  modal.classList.remove('modal--open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('page--locked');

  if (activeModal === modal) {
    activeModal = null;
  }

  if (restoreFocus && lastFocused) {
    lastFocused.focus();
  }

  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function trapFocus(event, modal) {
  const items = [...modal.querySelectorAll(FOCUSABLE)].filter(
    (element) => element.offsetParent !== null
  );

  if (items.length === 0) {
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Открыть окно, если в адресе есть #modal-... */
function openFromHash() {
  const hash = location.hash.slice(1);
  const target = hash ? document.getElementById(hash) : null;

  if (target && target.classList.contains('modal')) {
    openModal(target, null);
  }
}
