/**
 * Форма обратной связи.
 * Проверяет поля без HTML-валидации, показывает ошибки,
 * сохраняет сообщение в localStorage и показывает «спасибо».
 */

const STORAGE_KEY = 'feedback';

const MESSAGES = {
  ru: {
    name: 'Введите имя — минимум 2 символа.',
    email: 'Введите корректный email, например name@mail.ru.',
    message: 'Сообщение должно быть не короче 10 символов.',
    consent: 'Отметьте согласие на обработку данных.',
  },
  en: {
    name: 'Enter a name — at least 2 characters.',
    email: 'Enter a valid email, for example name@mail.ru.',
    message: 'The message must be at least 10 characters long.',
    consent: 'Please agree to data processing.',
  },
};

export function initFeedback(form) {
  if (!form) {
    return;
  }

  const modal = form.closest('.modal');
  const success = modal.querySelector('[data-success]');

  form.addEventListener('submit', handleSubmit);

  // Ошибку убираем, как только пользователь начал исправлять поле
  form.addEventListener('input', (event) => {
    if (event.target.name) {
      clearError(event.target);
    }
  });

  // При каждом открытии окна форма снова пустая
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-modal="feedback"]')) {
      resetForm();
    }
  });

  function handleSubmit(event) {
    event.preventDefault();

    const values = readValues();
    const errors = validate(values);

    clearAllErrors();

    if (errors.length > 0) {
      errors.forEach(({ field, message }) => showError(field, message));
      errors[0].field.focus();
      return;
    }

    save(values);

    form.hidden = true;
    success.hidden = false;
    success.querySelector('button').focus();
  }

  function readValues() {
    return {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      consent: form.elements.consent.checked,
    };
  }

  function validate(values) {
    const messages = MESSAGES[document.documentElement.lang === 'en' ? 'en' : 'ru'];
    const errors = [];

    if (values.name.length < 2) {
      errors.push({ field: form.elements.name, message: messages.name });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.push({ field: form.elements.email, message: messages.email });
    }

    if (values.message.length < 10) {
      errors.push({ field: form.elements.message, message: messages.message });
    }

    if (!values.consent) {
      errors.push({ field: form.elements.consent, message: messages.consent });
    }

    return errors;
  }

  function showError(field, message) {
    field.setAttribute('aria-invalid', 'true');

    const slot = form.querySelector(`[data-error-for="${field.name}"]`);
    if (slot) {
      slot.textContent = message;
    }
  }

  function clearError(field) {
    field.removeAttribute('aria-invalid');

    const slot = form.querySelector(`[data-error-for="${field.name}"]`);
    if (slot) {
      slot.textContent = '';
    }
  }

  function clearAllErrors() {
    form.querySelectorAll('[aria-invalid]').forEach((field) => {
      field.removeAttribute('aria-invalid');
    });

    form.querySelectorAll('[data-error-for]').forEach((slot) => {
      slot.textContent = '';
    });
  }

  function resetForm() {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    clearAllErrors();
  }

  function save(values) {
    const entry = {
      ...values,
      date: new Date().toISOString(),
    };

    const saved = readSaved();
    saved.push(entry);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
      // В приватном режиме localStorage может быть недоступен
      console.warn('Не удалось сохранить отзыв:', error);
    }
  }

  function readSaved() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }
}
