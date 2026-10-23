// Datos guardados en el navegador (localStorage).
// Nota: es una práctica; en un proyecto real las cuentas y contraseñas van en un servidor con base de datos.
const USERS = 'cartucho_users';
const SESSION = 'cartucho_session';
const libKey = (userId) => `cartucho_lib_${userId}`;

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const notify = () => window.dispatchEvent(new Event('cartucho:change'));

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);

// Hash de la contraseña (SHA-256) para no guardarla en texto plano
async function hash(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(text)));
}

/* ---------- Usuarios ---------- */
export async function registerUser({ name, email, password, birth, favConsole }) {
  const users = read(USERS, []);
  const mail = email.trim().toLowerCase();
  if (users.some((u) => u.email === mail)) {
    throw new Error('Ya existe una cuenta con ese correo. Prueba iniciar sesión.');
  }
  const user = {
    id: uid(),
    name: name.trim(),
    email: mail,
    passHash: await hash(password),
    birth,
    favConsole: Number(favConsole),
    createdAt: new Date().toISOString(),
  };
  write(USERS, [...users, user]);
  write(SESSION, user.id);
  notify();
  return user;
}

export async function login(email, password) {
  const mail = email.trim().toLowerCase();
  const user = read(USERS, []).find((u) => u.email === mail);
  if (!user || user.passHash !== (await hash(password))) {
    throw new Error('Correo o contraseña incorrectos.');
  }
  write(SESSION, user.id);
  notify();
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION);
  notify();
}

export function currentUser() {
  const id = read(SESSION, null);
  return id ? read(USERS, []).find((u) => u.id === id) ?? null : null;
}

/* ---------- Biblioteca de juegos ---------- */
// Cada entrada: { key, gameId, name, image, released, platformId, status, party, addedAt, completedAt }
// status: 'playing' | 'completed'   party: 'first' | 'third'
export function getLibrary() {
  const u = currentUser();
  return u ? read(libKey(u.id), []) : [];
}

function saveLibrary(list) {
  const u = currentUser();
  if (!u) return;
  write(libKey(u.id), list);
  notify();
}

export function addGame({ game, platformId, status, party }) {
  const key = `${game.id}-${platformId}`;
  const list = getLibrary();
  const now = new Date().toISOString();
  const existing = list.find((g) => g.key === key);
  const entry = {
    key,
    gameId: game.id,
    name: game.name,
    image: game.image || '',
    released: game.released || null,
    platformId: Number(platformId),
    status,
    party,
    addedAt: existing?.addedAt ?? now,
    completedAt: status === 'completed' ? existing?.completedAt ?? now : null,
  };
  saveLibrary(existing ? list.map((g) => (g.key === key ? entry : g)) : [...list, entry]);
  return existing ? 'updated' : 'added';
}

export function updateGame(key, patch) {
  saveLibrary(
    getLibrary().map((g) => {
      if (g.key !== key) return g;
      const next = { ...g, ...patch };
      if (patch.status) next.completedAt = patch.status === 'completed' ? new Date().toISOString() : null;
      return next;
    })
  );
}

export function removeGame(key) {
  saveLibrary(getLibrary().filter((g) => g.key !== key));
}

export function stats(list = getLibrary()) {
  const completed = list.filter((g) => g.status === 'completed');
  return {
    total: list.length,
    playing: list.filter((g) => g.status === 'playing').length,
    completed: completed.length,
    completedFirst: completed.filter((g) => g.party === 'first').length,
    completedThird: completed.filter((g) => g.party === 'third').length,
  };
}
