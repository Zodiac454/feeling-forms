/**
 * Загрузка JSON с сервера.
 * fetch требует, чтобы страница была открыта через http://, а не file://.
 */
export async function loadJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить ${url} (HTTP ${response.status})`);
  }

  return response.json();
}
