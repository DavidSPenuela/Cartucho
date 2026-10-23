// Consolas Nintendo (id = id de plataforma en RAWG). Orden: de la más nueva a la más vieja.
export const CONSOLES = [
  { id: 7, name: 'Nintendo Switch', short: 'Switch' },
  { id: 8, name: 'Nintendo 3DS', short: '3DS' },
  { id: 10, name: 'Wii U', short: 'Wii U' },
  { id: 9, name: 'Nintendo DS', short: 'DS' },
  { id: 11, name: 'Wii', short: 'Wii' },
  { id: 24, name: 'Game Boy Advance', short: 'GBA' },
  { id: 105, name: 'GameCube', short: 'GameCube' },
  { id: 43, name: 'Game Boy Color', short: 'GBC' },
  { id: 83, name: 'Nintendo 64', short: 'N64' },
  { id: 26, name: 'Game Boy', short: 'Game Boy' },
  { id: 79, name: 'Super Nintendo', short: 'SNES' },
  { id: 49, name: 'NES', short: 'NES' },
];

export const consoleById = (id) => CONSOLES.find((c) => c.id === Number(id));
export const consoleName = (id) => consoleById(id)?.name ?? 'Nintendo';
export const consoleShort = (id) => consoleById(id)?.short ?? 'Nintendo';
