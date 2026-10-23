import { renderAuth } from './pages/auth.js';
import { renderExplore } from './pages/explore.js';
import { renderHome } from './pages/home.js';
import { renderLibrary } from './pages/library.js';
import { currentUser, logout } from './store.js';
import { closeDialog, esc, initDialog, toast } from './ui.js';

const root = document.getElementById('app');
const nav = document.getElementById('nav');

const routes = {
  '/': renderHome,
  '/explorar': renderExplore,
  '/coleccion': renderLibrary,
  '/registro': (page) => renderAuth(page, 'register'),
  '/acceso': (page) => renderAuth(page, 'login'),
};

function renderNav(path) {
  const user = currentUser();
  const link = (href, text) =>
    `<a href="#${href}" ${path === href ? 'aria-current="page"' : ''}>${text}</a>`;

  nav.innerHTML = `
    ${link('/', 'Inicio')}
    ${link('/explorar', 'Explorar')}
    ${user ? link('/coleccion', 'Mi colección') : ''}
    ${
      user
        ? `<span class="nav-user">${esc(user.name.split(' ')[0])}</span>
           <button class="btn small ghost" type="button" id="logout">Salir</button>`
        : `${link('/acceso', 'Entrar')}<a class="btn small primary" href="#/registro">Registrarme</a>`
    }
  `;
  nav.querySelector('#logout')?.addEventListener('click', () => {
    logout();
    toast('Cerraste sesión.');
    location.hash = '#/';
  });
}

function route() {
  closeDialog();
  const path = location.hash.slice(1) || '/';
  const user = currentUser();

  // Rutas protegidas / redirecciones
  if (path === '/coleccion' && !user) return void (location.hash = '#/acceso');
  if ((path === '/registro' || path === '/acceso') && user) return void (location.hash = '#/coleccion');

  const render = routes[path];
  // Cada pantalla se dibuja en un contenedor nuevo para no acumular listeners
  const page = document.createElement('div');
  page.className = 'page';
  root.replaceChildren(page);

  if (render) {
    render(page);
    document.title = `${titleFor(path)} · Cartucho`;
  } else {
    page.innerHTML = `
      <section class="empty">
        <h1>Esta página no existe</h1>
        <a class="btn primary" href="#/">Volver al inicio</a>
      </section>`;
  }

  renderNav(path);
  window.scrollTo(0, 0);
}

const titleFor = (path) =>
  ({ '/': 'Inicio', '/explorar': 'Explorar', '/coleccion': 'Mi colección', '/registro': 'Crear cuenta', '/acceso': 'Iniciar sesión' }[path]);

initDialog();
window.addEventListener('hashchange', route);
// Si cambian los datos (login/logout desde otra pestaña) se actualiza la barra
window.addEventListener('storage', route);
route();
