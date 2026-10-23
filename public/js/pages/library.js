import { CONSOLES } from '../consoles.js';
import { currentUser, getLibrary, removeGame, stats, updateGame } from '../store.js';
import { countersHTML, esc, partyLabel, toast, year } from '../ui.js';

export function renderLibrary(page) {
  const user = currentUser();
  const filters = { status: 'all', party: 'all' };

  page.innerHTML = `
    <section class="page-head">
      <h1>Mi colección</h1>
      <p class="lead">Juegos de ${esc(user.name.split(' ')[0])}, organizados por consola.</p>
    </section>

    <section class="panel" id="counters" aria-label="Contadores"></section>

    <div class="filters lib-filters">
      <div class="field">
        <label for="f-status">Estado</label>
        <select id="f-status">
          <option value="all">Todos</option>
          <option value="playing">Jugando ahora</option>
          <option value="completed">Completados</option>
        </select>
      </div>
      <div class="field">
        <label for="f-party">Tipo</label>
        <select id="f-party">
          <option value="all">First y third party</option>
          <option value="first">Solo first party</option>
          <option value="third">Solo third party</option>
        </select>
      </div>
      <a class="btn primary" href="#/explorar">Agregar juegos</a>
    </div>

    <div id="shelves"></div>
  `;

  const countersEl = page.querySelector('#counters');
  const shelves = page.querySelector('#shelves');

  function draw() {
    const all = getLibrary();
    countersEl.innerHTML = countersHTML(stats(all));

    if (!all.length) {
      shelves.innerHTML = `
        <div class="empty">
          <h2>Tu estante está vacío</h2>
          <p>Busca un juego en el catálogo y guárdalo en la consola donde lo jugaste.</p>
          <a class="btn primary" href="#/explorar">Buscar mi primer juego</a>
        </div>`;
      return;
    }

    const visible = all.filter(
      (g) =>
        (filters.status === 'all' || g.status === filters.status) &&
        (filters.party === 'all' || g.party === filters.party)
    );

    const groups = CONSOLES.map((c) => ({
      c,
      all: all.filter((g) => g.platformId === c.id),
      items: visible
        .filter((g) => g.platformId === c.id)
        .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'playing' ? -1 : 1)),
    })).filter((g) => g.items.length);

    if (!groups.length) {
      shelves.innerHTML = '<p class="status">Ningún juego coincide con esos filtros.</p>';
      return;
    }

    shelves.innerHTML = groups
      .map(
        ({ c, all: inConsole, items }) => `
        <section class="shelf" aria-labelledby="h-${c.id}">
          <header class="shelf-head">
            <h2 id="h-${c.id}">${esc(c.name)}</h2>
            <p>${inConsole.filter((g) => g.status === 'completed').length} de ${inConsole.length} completados</p>
          </header>
          <ul class="lib-list">
            ${items.map(row).join('')}
          </ul>
        </section>`
      )
      .join('');
  }

  const row = (g) => `
    <li class="lib-item" data-key="${esc(g.key)}">
      ${g.image ? `<img src="${esc(g.image)}" alt="" loading="lazy">` : '<span class="thumb-empty"></span>'}
      <div class="lib-info">
        <strong>${esc(g.name)}</strong>
        <span class="meta">${year(g.released)}</span>
        <span class="badge-row">
          <span class="badge ${g.party}">${partyLabel(g.party)}</span>
          <span class="badge ${g.status}">${g.status === 'completed' ? 'Completado' : 'Jugando'}</span>
        </span>
      </div>
      <div class="lib-actions">
        <button class="btn small ${g.status === 'playing' ? 'primary' : 'ghost'}" type="button" data-action="toggle">
          ${g.status === 'playing' ? 'Marcar completado' : 'Volver a jugando'}
        </button>
        <button class="btn small ghost" type="button" data-action="party">
          Cambiar a ${g.party === 'first' ? 'third' : 'first'} party
        </button>
        <button class="btn small danger" type="button" data-action="remove" aria-label="Quitar ${esc(g.name)}">Quitar</button>
      </div>
    </li>`;

  page.querySelector('#f-status').addEventListener('change', (e) => {
    filters.status = e.target.value;
    draw();
  });
  page.querySelector('#f-party').addEventListener('change', (e) => {
    filters.party = e.target.value;
    draw();
  });

  shelves.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const key = btn.closest('.lib-item').dataset.key;
    const game = getLibrary().find((g) => g.key === key);
    if (!game) return;

    if (btn.dataset.action === 'toggle') {
      const status = game.status === 'playing' ? 'completed' : 'playing';
      updateGame(key, { status });
      toast(status === 'completed' ? `¡${game.name} completado!` : `${game.name} vuelve a "jugando".`);
    } else if (btn.dataset.action === 'party') {
      updateGame(key, { party: game.party === 'first' ? 'third' : 'first' });
    } else if (btn.dataset.action === 'remove') {
      if (confirm(`¿Quitar "${game.name}" de tu colección?`)) {
        removeGame(key);
        toast(`${game.name} se quitó de tu colección.`);
      }
    }
    draw();
  });

  draw();
}
