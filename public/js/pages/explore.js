import { openAddDialog } from '../addGame.js';
import { gameDetail, searchGames } from '../api.js';
import { CONSOLES, consoleShort } from '../consoles.js';
import { closeDialog, esc, openDialog, year } from '../ui.js';

export function renderExplore(page) {
  const state = { q: '', platform: '', ordering: 'top', pageNum: 1, loading: false };
  const games = new Map(); // id -> juego (para abrir detalle / agregar sin volver a pedirlo)

  page.innerHTML = `
    <section class="page-head">
      <h1>Explorar juegos</h1>
      <p class="lead">Catálogo de Nintendo con datos de RAWG. Busca un título y guárdalo en tu colección.</p>
    </section>

    <form id="filters" class="filters" role="search">
      <div class="field grow">
        <label for="q">Buscar por nombre</label>
        <input id="q" type="search" placeholder="Ej. Zelda, Mario, Pokémon…" autocomplete="off">
      </div>
      <div class="field">
        <label for="platform">Consola</label>
        <select id="platform">
          <option value="">Todas</option>
          ${CONSOLES.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="ordering">Ordenar por</label>
        <select id="ordering">
          <option value="top">Mejor valorados</option>
          <option value="recent">Más recientes</option>
          <option value="name">Nombre (A-Z)</option>
        </select>
      </div>
      <button class="btn primary" type="submit">Buscar</button>
    </form>

    <p id="status" class="status" aria-live="polite"></p>
    <div id="grid" class="grid"></div>
    <div class="more"><button id="more" class="btn ghost" type="button" hidden>Cargar más</button></div>
  `;

  const grid = page.querySelector('#grid');
  const statusEl = page.querySelector('#status');
  const moreBtn = page.querySelector('#more');
  const form = page.querySelector('#filters');

  const card = (g) => `
    <article class="game-card" data-id="${g.id}">
      <button class="game-img" type="button" data-action="info" aria-label="Ver información de ${esc(g.name)}">
        ${g.image ? `<img src="${esc(g.image)}" alt="" loading="lazy">` : '<span class="thumb-empty"></span>'}
      </button>
      <div class="game-body">
        <h3>${esc(g.name)}</h3>
        <p class="meta">${year(g.released)}${g.metacritic ? ` · Metacritic ${g.metacritic}` : ''}</p>
        <ul class="chips">
          ${g.platforms.slice(0, 4).map((p) => `<li>${esc(consoleShort(p.id))}</li>`).join('')}
        </ul>
        <div class="card-actions">
          <button class="btn small ghost" type="button" data-action="info">Ver info</button>
          <button class="btn small primary" type="button" data-action="add">Agregar</button>
        </div>
      </div>
    </article>`;

  async function load({ append = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    moreBtn.hidden = true;
    if (!append) {
      grid.innerHTML = '';
      state.pageNum = 1;
    }
    statusEl.className = 'status';
    statusEl.textContent = 'Buscando…';

    try {
      const data = await searchGames({
        q: state.q,
        platform: state.platform,
        ordering: state.ordering,
        page: state.pageNum,
      });
      data.results.forEach((g) => games.set(g.id, g));
      grid.insertAdjacentHTML('beforeend', data.results.map(card).join(''));
      statusEl.textContent = grid.children.length
        ? `${grid.children.length} de ${data.count} juegos`
        : 'No encontramos juegos con esa búsqueda. Prueba con otro nombre o cambia la consola.';
      moreBtn.hidden = !data.hasMore;
    } catch (err) {
      statusEl.className = 'status error';
      statusEl.textContent = err.message;
    } finally {
      state.loading = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = form.querySelector('#q').value.trim();
    state.platform = form.querySelector('#platform').value;
    state.ordering = form.querySelector('#ordering').value;
    load();
  });
  form.querySelector('#platform').addEventListener('change', () => form.requestSubmit());
  form.querySelector('#ordering').addEventListener('change', () => form.requestSubmit());

  moreBtn.addEventListener('click', () => {
    state.pageNum++;
    load({ append: true });
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const game = games.get(Number(btn.closest('.game-card').dataset.id));
    if (!game) return;
    if (btn.dataset.action === 'add') openAddDialog(game);
    else showInfo(game);
  });

  load();
}

/* ---------- Ficha con información del juego ---------- */
async function showInfo(game) {
  openDialog('<p class="muted">Cargando información…</p>', { wide: true });
  let d;
  try {
    d = await gameDetail(game.id);
  } catch (err) {
    openDialog(`<p class="status error">${esc(err.message)}</p>`);
    return;
  }

  const row = (label, value) =>
    value ? `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>` : '';
  const desc = d.description
    ? esc(d.description.length > 700 ? `${d.description.slice(0, 700).trim()}…` : d.description)
    : 'No hay descripción disponible.';

  openDialog(
    `
    <div class="info">
      ${d.image ? `<img class="info-img" src="${esc(d.image)}" alt="">` : ''}
      <h2 class="dlg-title">${esc(d.name)}</h2>
      <p class="badge-row">
        <span class="badge ${d.firstParty ? 'first' : 'third'}">${d.firstParty ? 'First party' : 'Third party'}</span>
        ${d.metacritic ? `<span class="badge plain">Metacritic ${d.metacritic}</span>` : ''}
      </p>
      <p class="info-desc">${desc}</p>
      <dl class="facts">
        ${row('Lanzamiento', d.released)}
        ${row('Publicadora', d.publishers.join(', '))}
        ${row('Desarrolladora', d.developers.join(', '))}
        ${row('Géneros', d.genres.join(', '))}
        ${row('Consolas Nintendo', d.platforms.map((p) => consoleShort(p.id)).join(', '))}
      </dl>
      <div class="actions">
        <button class="btn ghost" type="button" data-close>Cerrar</button>
        <button class="btn primary" type="button" data-add>Agregar a mi colección</button>
      </div>
    </div>`,
    { wide: true }
  );

  const body = document.querySelector('#dialog .dlg-body');
  body.querySelector('[data-close]').addEventListener('click', closeDialog);
  body.querySelector('[data-add]').addEventListener('click', () => openAddDialog(game));
}
