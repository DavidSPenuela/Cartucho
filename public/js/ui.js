export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const year = (date) => (date ? String(date).slice(0, 4) : 'Sin fecha');

export function toast(message, type = 'ok') {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  box.append(el);
  setTimeout(() => el.remove(), 3800);
}

/* ---------- Diálogo (modal) ---------- */
const dialog = () => document.getElementById('dialog');

export function openDialog(html, { wide = false } = {}) {
  const d = dialog();
  d.querySelector('.dlg-body').innerHTML = html;
  d.classList.toggle('wide', wide);
  if (!d.open) d.showModal();
  return d;
}

export function closeDialog() {
  if (dialog().open) dialog().close();
}

export function initDialog() {
  const d = dialog();
  d.querySelector('.dlg-close').addEventListener('click', closeDialog);
  d.addEventListener('click', (e) => {
    if (e.target === d) closeDialog(); // clic en el fondo
  });
}

/* ---------- Contadores first / third party ---------- */
export function countersHTML(s) {
  const done = s.completedFirst + s.completedThird;
  const firstPct = done ? Math.round((s.completedFirst / done) * 100) : 0;
  const label = done
    ? `${s.completedFirst} first party y ${s.completedThird} third party completados`
    : 'Todavía no hay juegos completados';
  return `
    <div class="counters">
      <div class="counter first">
        <span class="num">${s.completedFirst}</span>
        <span class="lbl">First party<br>completados</span>
      </div>
      <div class="counter third">
        <span class="num">${s.completedThird}</span>
        <span class="lbl">Third party<br>completados</span>
      </div>
      <div class="counter playing">
        <span class="num">${s.playing}</span>
        <span class="lbl">Jugando<br>ahora</span>
      </div>
    </div>
    <div class="split" role="img" aria-label="${esc(label)}">
      <span class="f" style="width:${firstPct}%"></span>
      <span class="t" style="width:${done ? 100 - firstPct : 0}%"></span>
    </div>`;
}

export const partyLabel = (p) => (p === 'first' ? 'First party' : 'Third party');
