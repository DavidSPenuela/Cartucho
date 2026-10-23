// Servidor: sirve la página y hace de intermediario con la API de RAWG,
// para que la clave (en .env) nunca llegue al navegador.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.RAWG_API_KEY;
const BASE = 'https://api.rawg.io/api';

// IDs de plataformas Nintendo en RAWG
const NINTENDO_IDS = [7, 8, 9, 10, 11, 24, 26, 43, 49, 79, 83, 105];

// Publicadoras que cuentan como "first party"
const FIRST_PARTY_RE = /nintendo|pok[eé]mon company/i;

// Caché sencilla en memoria (10 min) para no gastar el límite de peticiones
const cache = new Map();
const TTL = 10 * 60 * 1000;

async function rawg(endpoint, params = {}) {
  if (!API_KEY || API_KEY === 'tu_clave_aqui') {
    const err = new Error(
      'Falta la clave de la API. Edita el archivo .env y pon tu RAWG_API_KEY (ver README).'
    );
    err.status = 500;
    throw err;
  }
  const qs = new URLSearchParams({ ...params, key: API_KEY });
  const url = `${BASE}${endpoint}?${qs}`;

  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < TTL) return hit.data;

  const r = await fetch(url);
  if (!r.ok) {
    const err = new Error(
      r.status === 401
        ? 'La clave de la API no es válida. Revisa tu archivo .env.'
        : `La API de RAWG respondió con error ${r.status}.`
    );
    err.status = 502;
    throw err;
  }
  const data = await r.json();
  cache.set(url, { t: Date.now(), data });
  return data;
}

// Versión pequeña de la imagen para las tarjetas
const thumb = (url) =>
  url && url.includes('/media/games/') ? url.replace('/media/', '/media/crop/600/400/') : url;

const slim = (g) => ({
  id: g.id,
  name: g.name,
  released: g.released || null,
  image: thumb(g.background_image),
  metacritic: g.metacritic || null,
  genres: (g.genres || []).map((x) => x.name),
  platforms: (g.platforms || [])
    .map((p) => ({ id: p.platform.id, name: p.platform.name }))
    .filter((p) => NINTENDO_IDS.includes(p.id)),
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    console.error('[API]', e.message);
    res.status(e.status || 500).json({ error: e.message || 'Error inesperado.' });
  });

// Lista / búsqueda de juegos de Nintendo
app.get(
  '/api/games',
  wrap(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 80);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const platform = parseInt(req.query.platform, 10);
    const platforms = NINTENDO_IDS.includes(platform) ? String(platform) : NINTENDO_IDS.join(',');

    const params = { platforms, page, page_size: 18 };
    if (q) {
      params.search = q;
      params.search_precise = 'true';
    } else {
      const order = req.query.ordering;
      if (order === 'recent') {
        params.ordering = '-released';
        params.dates = `1983-01-01,${new Date().toISOString().slice(0, 10)}`;
      } else if (order === 'name') {
        params.ordering = 'name';
      } else {
        params.ordering = '-metacritic';
      }
    }

    const data = await rawg('/games', params);
    res.json({
      count: data.count,
      hasMore: Boolean(data.next),
      results: (data.results || []).map(slim),
    });
  })
);

// Detalle de un juego (incluye publicadoras para detectar first/third party)
app.get(
  '/api/games/:id',
  wrap(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID de juego no válido.' });

    const g = await rawg(`/games/${id}`);
    const publishers = (g.publishers || []).map((p) => p.name);
    const developers = (g.developers || []).map((d) => d.name);
    const owners = publishers.length ? publishers : developers;

    res.json({
      ...slim(g),
      image: g.background_image,
      description: g.description_raw || '',
      publishers,
      developers,
      website: g.website || '',
      firstParty: owners.some((n) => FIRST_PARTY_RE.test(n)),
    });
  })
);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Cartucho listo en http://localhost:${PORT}`);
  if (!API_KEY || API_KEY === 'tu_clave_aqui') {
    console.warn('⚠  No hay RAWG_API_KEY en .env: la página abre, pero Explorar no cargará juegos.');
  }
});
