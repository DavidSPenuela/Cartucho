// Llamadas a nuestro servidor, que a su vez consulta la API de RAWG con la clave del .env
async function get(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo con "npm start"?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Algo salió mal al consultar los juegos.');
  return data;
}

export function searchGames({ q = '', platform = '', ordering = 'top', page = 1 } = {}) {
  const params = new URLSearchParams({ q, platform, ordering, page });
  return get(`/api/games?${params}`);
}

const detailCache = new Map();
export async function gameDetail(id) {
  if (!detailCache.has(id)) detailCache.set(id, await get(`/api/games/${id}`));
  return detailCache.get(id);
}
