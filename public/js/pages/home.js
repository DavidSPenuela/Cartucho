import { consoleShort } from '../consoles.js';
import { currentUser, getLibrary, stats } from '../store.js';
import { countersHTML, esc } from '../ui.js';

export function renderHome(page) {
  const user = currentUser();
  const lib = getLibrary();
  const s = stats(lib);
  const playing = lib.filter((g) => g.status === 'playing').slice(0, 4);

  page.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <h1>Tu estante Nintendo, juego por juego</h1>
        <p class="lead">Guarda lo que ya terminaste y lo que estás jugando, ordenado por consola. Cartucho cuenta cuántos completaste de Nintendo (first party) y cuántos de otras compañías (third party).</p>
        <div class="cta-row">
          ${
            user
              ? `<a class="btn primary" href="#/coleccion">Ir a mi colección</a>
                 <a class="btn ghost" href="#/explorar">Buscar juegos</a>`
              : `<a class="btn primary" href="#/registro">Crear mi cuenta</a>
                 <a class="btn ghost" href="#/explorar">Ver el catálogo</a>`
          }
        </div>
      </div>

      <div class="cart" aria-label="Resumen de tu colección">
        <div class="cart-label">
          <p class="cart-title">${user ? esc(user.name.split(' ')[0]) : 'Tu colección'}</p>
          ${countersHTML(s)}
          ${
            user
              ? ''
              : '<p class="cart-note">Los contadores se llenan cuando inicias sesión y guardas juegos.</p>'
          }
        </div>
        <div class="cart-pins" aria-hidden="true"></div>
      </div>
    </section>

    ${
      playing.length
        ? `<section class="block">
            <h2>Lo que juegas ahora</h2>
            <ul class="now-list">
              ${playing
                .map(
                  (g) => `<li>
                    ${g.image ? `<img src="${esc(g.image)}" alt="" loading="lazy">` : '<span class="thumb-empty"></span>'}
                    <div><strong>${esc(g.name)}</strong><span>${esc(consoleShort(g.platformId))}</span></div>
                  </li>`
                )
                .join('')}
            </ul>
          </section>`
        : ''
    }

    <section class="block">
      <h2>Cómo funciona</h2>
      <ol class="steps">
        <li><strong>Crea tu cuenta.</strong> Es gratis y se guarda en tu navegador.</li>
        <li><strong>Busca un juego.</strong> El catálogo trae portadas, fechas y datos de cada título de Nintendo.</li>
        <li><strong>Guárdalo en su consola.</strong> Elige si lo estás jugando o ya lo terminaste.</li>
        <li><strong>Mira tus números.</strong> Los contadores separan lo completado entre first party y third party.</li>
      </ol>
    </section>
  `;
}
