/**
 * Отрисовка интерфейса по данным из JSON.
 * Вся разметка берётся из <template> в index.html.
 */

/** Возвращает первый элемент шаблона по его id. */
function templateRoot(id) {
  const template = document.getElementById(id);

  if (!template) {
    throw new Error(`Не найден шаблон #${id}`);
  }

  return template.content.firstElementChild;
}

function setText(element, value) {
  if (element) {
    element.textContent = value ?? '';
  }
}

/** id модального окна для органа: face → modal-face */
export function modalId(organId) {
  return `modal-${organId}`;
}

/** Карточки органов в сетке. */
export function renderOrgans(organs, grid) {
  const fragment = document.createDocumentFragment();

  organs.forEach((organ) => {
    const card = templateRoot('tpl-organ-card').cloneNode(true);
    card.href = `#${modalId(organ.id)}`;
    card.dataset.modal = modalId(organ.id);
    card.dataset.organ = organ.id;

    const icon = card.querySelector('.organ-card__icon');
    icon.src = organ.image;
    icon.alt = `Иллюстрация органа «${organ.name}»`;

    const name = card.querySelector('.organ-card__name');
    setText(name, organ.name);
    name.dataset.ru = organ.name;
    name.dataset.en = organ.englishName;

    setText(card.querySelector('.organ-card__name-en'), organ.englishName);

    fragment.append(card);
  });

  grid.replaceChildren(fragment);
}

/** Модальные окна всех органов. */
export function renderModals(organs, container) {
  const modals = organs.map((organ) => {
    const modal = templateRoot('tpl-organ-modal').cloneNode(true);
    modal.id = modalId(organ.id);
    modal.setAttribute('aria-labelledby', `${modal.id}-title`);

    const title = modal.querySelector('.modal__title');
    title.id = `${modal.id}-title`;

    const icon = modal.querySelector('.modal__icon');
    icon.src = organ.image;
    icon.alt = `Иллюстрация органа «${organ.name}»`;

    const titleRu = title.querySelector('[data-i18n]');
    setText(titleRu, organ.name);
    titleRu.dataset.ru = organ.name;
    titleRu.dataset.en = organ.englishName;

    setText(title.querySelector('.modal__title-en'), organ.englishName);

    const description = modal.querySelector('.modal__desc');
    setText(description, organ.description.ru);
    description.dataset.ru = organ.description.ru;
    description.dataset.en = organ.description.en;

    const analysis = modal.querySelector('.modal__analysis');
    setText(analysis, organ.analysis.ru);
    analysis.dataset.ru = organ.analysis.ru;
    analysis.dataset.en = organ.analysis.en;

    setText(modal.querySelector('.modal__count'), String(organ.metaphors.length));

    const list = modal.querySelector('.metaphors');
    organ.metaphors.forEach((metaphor) => {
      list.append(renderMetaphor(metaphor));
    });

    return modal;
  });

  container.append(...modals);

  return modals;
}

/** Одна метафора: цитата, картинка и шесть полей анализа. */
function renderMetaphor(metaphor) {
  const item = templateRoot('tpl-metaphor').cloneNode(true);

  const icon = item.querySelector('.metaphor__icon');
  icon.src = metaphor.image;

  setText(item.querySelector('.metaphor__quote'), metaphor.quote);

  item.querySelectorAll('[data-field]').forEach((element) => {
    setText(element, metaphor[element.dataset.field]);
  });

  return item;
}

/** Модальное окно «О проекте». */
export function renderAbout(about, container) {
  const modal = templateRoot('tpl-about').cloneNode(true);

  modal.id = 'about';
  modal.setAttribute('aria-labelledby', 'about-title');

  const title = modal.querySelector('.modal__title');
  title.id = 'about-title';
  setText(title, about.title);

  setText(modal.querySelector('[data-intro]'), about.intro);
  setText(modal.querySelector('[data-outro]'), about.outro);

  const blocks = modal.querySelector('[data-blocks]');
  about.blocks.forEach((block) => {
    blocks.append(renderAboutBlock(block));
  });

  container.append(modal);

  return modal;
}

function renderAboutBlock(block) {
  const fragment = document.getElementById('tpl-about-block').content.cloneNode(true);

  setText(fragment.querySelector('h3'), block.title);

  const list = fragment.querySelector('ul');
  block.items.forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    list.append(item);
  });

  return fragment;
}

/** Модальное окно с формой обратной связи. */
export function renderFeedback(container) {
  const modal = templateRoot('tpl-feedback').cloneNode(true);

  container.append(modal);

  return modal;
}
