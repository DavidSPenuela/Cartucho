import { CONSOLES } from '../consoles.js';
import { login, registerUser } from '../store.js';
import { esc, toast } from '../ui.js';

/* ---------- Reglas de validación (devuelven '' si el campo está bien) ---------- */
function ageFrom(birth) {
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

const rules = {
  name: (v) => {
    const t = v.trim();
    if (!t) return 'Escribe tu nombre.';
    if (t.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!/^[\p{L}][\p{L} .'-]*$/u.test(t)) return 'Usa solo letras y espacios.';
    return '';
  },
  email: (v) => {
    const t = v.trim();
    if (!t) return 'Escribe tu correo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'Correo no válido. Ejemplo: nombre@correo.com';
    return '';
  },
  password: (v) => {
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[a-z]/.test(v)) return 'Agrega una letra minúscula.';
    if (!/[A-Z]/.test(v)) return 'Agrega una letra mayúscula.';
    if (!/\d/.test(v)) return 'Agrega un número.';
    return '';
  },
  confirm: (v, all) => (v !== all.password ? 'Las contraseñas no coinciden.' : ''),
  birth: (v) => {
    if (!v) return 'Elige tu fecha de nacimiento.';
    if (new Date(v) > new Date()) return 'La fecha no puede estar en el futuro.';
    if (ageFrom(v) < 13) return 'Debes tener al menos 13 años para registrarte.';
    if (ageFrom(v) > 110) return 'Revisa la fecha de nacimiento.';
    return '';
  },
  favConsole: (v) => (!v ? 'Elige tu consola favorita.' : ''),
  terms: (v) => (!v ? 'Debes aceptar para continuar.' : ''),
};

function strength(v) {
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[^\w\s]/.test(v)) score++;
  return score; // 0 a 5
}

/* ---------- Pantalla ---------- */
export function renderAuth(page, mode = 'register') {
  const isRegister = mode === 'register';

  page.innerHTML = `
    <section class="auth">
      <div class="auth-side">
        <h1>${isRegister ? 'Empieza tu bitácora' : 'Qué bueno verte de nuevo'}</h1>
        <p class="lead">${
          isRegister
            ? 'Con tu cuenta guardas juegos por consola y llevas la cuenta de lo que terminas.'
            : 'Entra para ver tu colección y tus contadores.'
        }</p>
      </div>

      <div class="auth-card">
        <div class="tabs" role="tablist" aria-label="Acceso">
          <a role="tab" href="#/registro" aria-selected="${isRegister}">Crear cuenta</a>
          <a role="tab" href="#/acceso" aria-selected="${!isRegister}">Iniciar sesión</a>
        </div>
        ${isRegister ? registerForm() : loginForm()}
      </div>
    </section>
  `;

  const form = page.querySelector('form');
  isRegister ? wireRegister(form) : wireLogin(form);
}

function field({ id, label, type = 'text', autocomplete = '', extra = '', hint = '' }) {
  return `
    <div class="field" data-field="${id}">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${extra} aria-describedby="err-${id}${hint ? ` hint-${id}` : ''}">
      ${hint ? `<p class="hint" id="hint-${id}">${hint}</p>` : ''}
      <p class="err" id="err-${id}"></p>
    </div>`;
}

function registerForm() {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <form id="register-form" class="stack" novalidate>
      ${field({ id: 'name', label: 'Nombre', autocomplete: 'name' })}
      ${field({ id: 'email', label: 'Correo', type: 'email', autocomplete: 'email' })}
      <div class="field" data-field="password">
        <label for="password">Contraseña</label>
        <input id="password" name="password" type="password" autocomplete="new-password" aria-describedby="hint-password err-password">
        <div class="meter" aria-hidden="true"><span></span></div>
        <p class="hint" id="hint-password">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
        <p class="err" id="err-password"></p>
      </div>
      ${field({ id: 'confirm', label: 'Repite la contraseña', type: 'password', autocomplete: 'new-password' })}
      ${field({ id: 'birth', label: 'Fecha de nacimiento', type: 'date', autocomplete: 'bday', extra: `max="${today}"` })}
      <div class="field" data-field="favConsole">
        <label for="favConsole">Consola favorita</label>
        <select id="favConsole" name="favConsole" aria-describedby="err-favConsole">
          <option value="">Elige una…</option>
          ${CONSOLES.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
        </select>
        <p class="err" id="err-favConsole"></p>
      </div>
      <div class="field check" data-field="terms">
        <label><input type="checkbox" id="terms" name="terms" aria-describedby="err-terms"> Acepto que mis datos se guarden en este navegador.</label>
        <p class="err" id="err-terms"></p>
      </div>
      <p class="err form-err" id="form-error" role="alert"></p>
      <button class="btn primary wide-btn" type="submit">Crear cuenta</button>
    </form>`;
}

function loginForm() {
  return `
    <form id="login-form" class="stack" novalidate>
      ${field({ id: 'email', label: 'Correo', type: 'email', autocomplete: 'email' })}
      ${field({ id: 'password', label: 'Contraseña', type: 'password', autocomplete: 'current-password' })}
      <p class="err form-err" id="form-error" role="alert"></p>
      <button class="btn primary wide-btn" type="submit">Entrar</button>
    </form>`;
}

/* ---------- Comportamiento ---------- */
function valueOf(form, name) {
  const el = form.elements[name];
  return el.type === 'checkbox' ? el.checked : el.value;
}

function showError(form, name, message) {
  const el = form.elements[name];
  const out = form.querySelector(`#err-${name}`);
  if (!el || !out) return;
  out.textContent = message;
  el.setAttribute('aria-invalid', message ? 'true' : 'false');
  el.closest('.field')?.classList.toggle('invalid', Boolean(message));
}

function values(form, names) {
  return Object.fromEntries(names.map((n) => [n, valueOf(form, n)]));
}

function wireRegister(form) {
  const names = ['name', 'email', 'password', 'confirm', 'birth', 'favConsole', 'terms'];
  const touched = new Set();

  const check = (name) => {
    const all = values(form, names);
    const msg = rules[name](all[name], all);
    showError(form, name, msg);
    return msg;
  };

  names.forEach((name) => {
    const el = form.elements[name];
    const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener('blur', () => {
      touched.add(name);
      check(name);
    });
    el.addEventListener(evt, () => {
      if (touched.has(name) || el.getAttribute('aria-invalid') === 'true') check(name);
      if (name === 'password') {
        updateMeter(form);
        if (touched.has('confirm')) check('confirm');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = form.querySelector('#form-error');
    formError.textContent = '';

    const bad = names.filter((n) => check(n));
    if (bad.length) {
      form.elements[bad[0]].focus();
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const v = values(form, names);
      const user = await registerUser(v);
      toast(`¡Bienvenido, ${user.name.split(' ')[0]}!`);
      location.hash = '#/coleccion';
    } catch (err) {
      formError.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function updateMeter(form) {
  const s = strength(form.elements.password.value);
  const bar = form.querySelector('.meter span');
  bar.style.width = `${(s / 5) * 100}%`;
  bar.dataset.level = s <= 2 ? 'low' : s <= 3 ? 'mid' : 'high';
}

function wireLogin(form) {
  const names = ['email', 'password'];
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = form.querySelector('#form-error');
    formError.textContent = '';

    const v = values(form, names);
    const emailMsg = rules.email(v.email);
    const passMsg = v.password ? '' : 'Escribe tu contraseña.';
    showError(form, 'email', emailMsg);
    showError(form, 'password', passMsg);
    if (emailMsg || passMsg) {
      form.elements[emailMsg ? 'email' : 'password'].focus();
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const user = await login(v.email, v.password);
      toast(`Hola de nuevo, ${user.name.split(' ')[0]}.`);
      location.hash = '#/coleccion';
    } catch (err) {
      formError.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}
