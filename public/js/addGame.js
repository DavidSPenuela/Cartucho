import { gameDetail } from './api.js';
import { CONSOLES, consoleName } from './consoles.js';
import { addGame, currentUser } from './store.js';
import { closeDialog, esc, openDialog, toast } from './ui.js';

// Abre el formulario para guardar un juego: consola, estado y first/third party.
export async function openAddDialog(game) {
  if (!currentUser()) {
    closeDialog();
    toast('Crea una cuenta o inicia sesión para guardar juegos.', 'warn');
    location.hash = '#/registro';
    return;
  }

  openDialog('<p class="muted">Cargando datos del juego…</p>');

  // El detalle trae la publicadora, con la que se adivina si es first o third party
  let detail = game;
  try {
    detail = await gameDetail(game.id);
  } catch {
    /* si falla, se usa lo que ya tenemos y el usuario elige a mano */
  }

  const known = (detail.platforms?.length ? detail.platforms : game.platforms) || [];
  const options = CONSOLES.filter((c) => known.some((p) => p.id === c.id));
  const consoles = options.length ? options : CONSOLES;
  const guess = detail.firstParty ? 'first' : 'third';
  const publisher = detail.publishers?.length ? detail.publishers.join(', ') : null;

  openDialog(`
    <h2 class="dlg-title">Agregar a mi colección</h2>
    <p class="dlg-sub">${esc(game.name)}</p>
    <form id="add-form" class="stack">
      <div class="field">
        <label for="add-console">Consola en la que lo jugaste</label>
        <select id="add-console" name="platform">
          ${consoles.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
        </select>
      </div>

      <fieldset class="field">
        <legend>Estado</legend>
        <div class="segmented">
          <label><input type="radio" name="status" value="playing" checked><span>Jugando ahora</span></label>
          <label><input type="radio" name="status" value="completed"><span>Completado</span></label>
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>Tipo de juego</legend>
        <div class="segmented">
          <label><input type="radio" name="party" value="first" ${guess === 'first' ? 'checked' : ''}><span>First party</span></label>
          <label><input type="radio" name="party" value="third" ${guess === 'third' ? 'checked' : ''}><span>Third party</span></label>
        </div>
        <p class="hint">${
          publisher
            ? `Publicado por ${esc(publisher)}. Lo marcamos según eso, pero puedes cambiarlo.`
            : 'No encontramos la publicadora. Elige el tipo que corresponde.'
        }</p>
      </fieldset>

      <div class="actions">
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button type="submit" class="btn primary">Guardar juego</button>
      </div>
    </form>
  `);

  const form = document.getElementById('add-form');
  form.querySelector('[data-close]').addEventListener('click', closeDialog);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const platformId = Number(data.get('platform'));
    const result = addGame({
      game: { ...game, image: game.image || detail.image },
      platformId,
      status: data.get('status'),
      party: data.get('party'),
    });
    closeDialog();
    toast(
      result === 'added'
        ? `${game.name} se agregó a ${consoleName(platformId)}.`
        : `Actualizamos ${game.name} en ${consoleName(platformId)}.`
    );
  });
}
