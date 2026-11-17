/**
 * «Мозг» чат-помощника.
 *
 * 1. Ищет в JSON подходящие метафоры по органу, эмоции и словам вопроса.
 * 2. Собирает из находок контекст для DeepSeek.
 * 3. Умеет отвечать сама — если API недоступен (нет ключа или интернета).
 */

const STOP_WORDS = new Set([
  'что', 'как', 'какие', 'какой', 'какая', 'почему', 'зачем', 'где', 'когда',
  'это', 'этот', 'эта', 'есть', 'быть', 'для', 'про', 'расскажи', 'покажи',
  'можешь', 'можно', 'мне', 'нам', 'вас', 'ваш', 'все', 'еще', 'или', 'если',
  'же', 'ли', 'бы', 'the', 'and', 'for', 'what', 'how', 'why', 'which',
  'are', 'is', 'was', 'were', 'you', 'your', 'about', 'with', 'tell', 'show',
  'please',
]);

const ORGAN_STEMS = {
  face: ['лиц', 'face'],
  head: ['голов', 'мозг', 'head', 'brain'],
  stomach: ['желуд', 'живот', 'stomach', 'inside'],
  heart: ['сердц', 'heart'],
  chest: ['груд', 'chest'],
  legs: ['ног', 'leg'],
};

const EMOTION_STEMS = [
  'страх', 'тревог', 'волн', 'испуг', 'паник', 'напряж', 'разочаров',
  'уныни', 'тоск', 'шок', 'гнев', 'злоб', 'радост', 'облегч', 'смущ',
  'стыд', 'подавлен', 'депресс', 'беспокой', 'предчувств', 'восстановлен',
  'температур', 'холод', 'тепл', 'тяжест', 'сосредоточен',
];

/** Нижний регистр, ё → е, без знаков препинания. */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Есть ли в тексте слово, начинающееся с основы. */
function hasStem(text, stem) {
  return text.split(' ').some((word) => word.startsWith(stem));
}

function findOrgan(text, organs) {
  return organs.find((organ) =>
    ORGAN_STEMS[organ.id].some((stem) => hasStem(text, stem))
  );
}

/**
 * Поиск подходящих метафор.
 * Оценка: орган +2, совпадение эмоции +3, слово из вопроса +1.
 */
export function retrieve(question, organs, limit = 6) {
  const text = normalize(question);
  const tokens = text
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  const results = [];

  for (const organ of organs) {
    const organMatch = ORGAN_STEMS[organ.id].some((stem) => hasStem(text, stem));

    for (const metaphor of organ.metaphors) {
      let score = 0;

      if (organMatch) {
        score += 2;
      }

      const emotion = normalize(metaphor.emotion);
      for (const stem of EMOTION_STEMS) {
        if (hasStem(text, stem) && emotion.includes(stem)) {
          score += 3;
        }
      }

      const haystack = normalize(
        `${metaphor.quote} ${metaphor.imagery} ${metaphor.concept} ${metaphor.type}`
      );
      for (const token of tokens) {
        if (haystack.includes(token)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push({ score, organ, metaphor });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Контекст для модели: о проекте, статистика и найденные метафоры. */
function buildContext(question, organs, about) {
  const total = organs.reduce((sum, organ) => sum + organ.metaphors.length, 0);
  const stats = organs
    .map((organ) => `${organ.name} — ${organ.metaphors.length}`)
    .join(', ');

  const hits = retrieve(question, organs);

  const aboutText = about.blocks
    .map((block) => `${block.title}: ${block.items.join(' ')}`)
    .join(' ');

  const lines = [
    `О проекте: ${about.intro}`,
    `Данные проекта: ${aboutText}`,
    `Всего метафор: ${total}. По органам: ${stats}.`,
  ];

  if (hits.length > 0) {
    lines.push('Подходящие метафоры:');
    hits.forEach((hit, index) => {
      const m = hit.metaphor;
      lines.push(
        `${index + 1}. Орган: ${hit.organ.name}. ` +
          `Цитата: ${m.quote} ` +
          `Эмоция: ${m.emotion} ` +
          `Образность: ${m.imagery} ` +
          `Концептуальный анализ: ${m.concept} ` +
          `Тип: ${m.type}`
      );
    });
  } else {
    lines.push('Подходящих метафор по запросу не найдено.');
    lines.push(
      'Краткое описание органов: ' +
        organs.map((organ) => `${organ.name} — ${organ.description.ru}`).join(' ')
    );
  }

  return lines.join('\n');
}

/** Сообщения для DeepSeek: инструкция + контекст + история диалога. */
export function buildMessages(history, organs, about) {
  const recentQuestions = history
    .filter((message) => message.role === 'user')
    .slice(-2)
    .map((message) => message.content)
    .join(' ');

  const context = buildContext(recentQuestions, organs, about);

  const system = [
    'Ты — помощник на учебном сайте «Метафорическое тело эмоций».',
    'Сайт посвящён метафорам частей тела в романах Дж. К. Роулинг о Гарри Поттере.',
    'Отвечай кратко (3–6 предложений) на языке вопроса, опираясь только на данные ниже.',
    'Пиши обычным текстом, без markdown-разметки.',
    'Если ответа в данных нет, честно скажи об этом и предложи спросить о метафорах, эмоциях или проекте.',
    'Не выдумывай цитаты, страницы и факты. Цитаты приводи в кавычках.',
    'Не пересчитывай примеры самостоятельно — используй числа, указанные в данных.',
    '',
    'ДАННЫЕ ИССЛЕДОВАНИЯ:',
    context,
  ].join('\n');

  const messages = [{ role: 'system', content: system }];

  history.slice(-8).forEach((message) => {
    messages.push({ role: message.role, content: message.content });
  });

  return messages;
}

/** Ответ без нейросети — по тем же данным сайта. */
export function localAnswer(question, organs, about) {
  const text = normalize(question);

  if (
    ['привет', 'здравствуй', 'здравствуйте', 'hello', 'hi'].some((word) =>
      text.split(' ').includes(word)
    )
  ) {
    return {
      text: 'Здравствуйте! Я помощник по материалам исследования. Спросите о конкретном органе, эмоции или о проекте в целом.',
    };
  }

  if (['спасибо', 'благодар', 'thanks', 'thank'].some((word) => hasStem(text, word))) {
    return {
      text: 'Пожалуйста! Если хотите разобрать ещё одну метафору, просто напишите её или назовите часть тела.',
    };
  }

  if (text.includes('что такое') && text.includes('метафор')) {
    return {
      text:
        'Метафора — это перенос значения по сходству: физическое ощущение ' +
        '(холод в желудке, тяжесть на сердце) становится способом описать эмоцию. ' +
        'В исследовании рассматриваются метафоры частей тела в романах о Гарри Поттере.',
    };
  }

  if (['проект', 'исследован', 'цель', 'зачем', 'о чем'].some((word) => text.includes(word))) {
    return {
      text:
        `${about.intro}\n\n` +
        `${about.blocks[0].title}: ${about.blocks[0].items.join(' ')}`,
    };
  }

  const organ = findOrgan(text, organs);

  if (organ) {
    const hits = retrieve(question, organs).filter(
      (hit) => hit.organ.id === organ.id
    );
    const examples = (hits.length > 0 ? hits.map((hit) => hit.metaphor) : organ.metaphors)
      .slice(0, 2)
      .map((metaphor) => `«${metaphor.quote}» — ${metaphor.emotion}`)
      .join('\n');

    return {
      text:
        `${organ.name}: ${organ.description.ru}\n` +
        `Всего метафор: ${organ.metaphors.length}.\n\n` +
        `Примеры:\n${examples}\n\n` +
        `Полный разбор — в карточке «${organ.name}».`,
    };
  }

  if (['сколько', 'статистик', 'всего', 'чаще', 'количество'].some((word) => text.includes(word))) {
    const total = organs.reduce((sum, item) => sum + item.metaphors.length, 0);
    const top = [...organs].sort(
      (a, b) => b.metaphors.length - a.metaphors.length
    )[0];

    return {
      text:
        `В исследовании ${total} метафор. ` +
        `По органам: ${organs.map((item) => `${item.name} — ${item.metaphors.length}`).join(', ')}. ` +
        `Чаще всего встречается «${top.name}» — ${top.metaphors.length} примеров.`,
    };
  }

  const hits = retrieve(question, organs);

  if (hits.length > 0) {
    const lines = hits.slice(0, 3).map(
      (hit) =>
        `• ${hit.organ.name}: «${hit.metaphor.quote}»\n  Эмоция: ${hit.metaphor.emotion}`
    );

    return {
      text:
        `Нашёл ${hits.length} подходящих метафор:\n\n` +
        `${lines.join('\n\n')}\n\n` +
        'Откройте карточку органа, чтобы увидеть полный анализ.',
    };
  }

  return {
    text:
      'Пока не нашёл этого в данных сайта. Спросите о конкретном органе ' +
      '(желудок, сердце, лицо, голова, грудь, ноги), эмоции ' +
      '(страх, тревога, радость, разочарование) или о проекте.',
  };
}
