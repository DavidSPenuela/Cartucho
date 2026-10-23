# Cartucho · Bitácora de juegos Nintendo

Práctica 3 · Unidad 3 · Desarrollo Web Integral.

Página web para guardar los juegos de Nintendo que ya jugaste y los que estás jugando, ordenados por consola, con un contador de juegos **completados** separado entre **first party** (hechos por Nintendo) y **third party** (de otras compañías).

## Pantallas

| Ruta | Qué hace |
| --- | --- |
| `#/` | **Inicio**: presentación, resumen de contadores y lo que juegas ahora. |
| `#/registro` y `#/acceso` | **Registro de usuario** con validación de campos, e inicio de sesión. |
| `#/explorar` | **Información del tema**: catálogo de juegos Nintendo desde la API externa (búsqueda, filtro por consola, ficha con detalles). |
| `#/coleccion` | **Mi colección**: juegos por consola, estado (jugando / completado), tipo (first / third party) y contadores. |

## API externa

[RAWG Video Games Database](https://rawg.io/apidocs) (gratuita). El servidor (`server.js`) hace de intermediario: la clave vive en `.env` y nunca llega al navegador.

## Cómo correrlo

Necesitas [Node.js](https://nodejs.org) 18 o superior.

1. Consigue una clave gratis en https://rawg.io/apidocs (botón *Get API Key*).
2. Abre el archivo `.env` y reemplaza `tu_clave_aqui`:

   ```
   RAWG_API_KEY=pega_tu_clave_aqui
   PORT=3000
   ```

   (`.env.example` es una plantilla sin clave real, esa sí se puede subir a GitHub.)
3. Instala y arranca:

   ```bash
   npm install
   npm start
   ```
4. Abre http://localhost:3000

## GitHub

El archivo `.gitignore` ya excluye `.env` y `node_modules/`, así que tu clave no se sube. Antes de hacer `git push`, verifica con `git status` que `.env` no aparezca en la lista.

## Validaciones del registro

- **Nombre**: mínimo 3 caracteres, solo letras y espacios.
- **Correo**: formato válido y no repetido.
- **Contraseña**: mínimo 8 caracteres, con mayúscula, minúscula y número (con indicador de fuerza).
- **Repetir contraseña**: debe coincidir.
- **Fecha de nacimiento**: no futura y mínimo 13 años.
- **Consola favorita**: obligatoria.
- **Aceptar términos**: obligatorio.

## Notas

- Las cuentas y las colecciones se guardan en el `localStorage` del navegador (la contraseña se guarda como hash SHA-256). En un proyecto real irían en una base de datos del servidor.
- First/third party se detecta con la publicadora que devuelve la API (Nintendo y The Pokémon Company cuentan como first party). Puedes corregirlo al agregar el juego o después desde tu colección.

## Estructura

```
cartucho/
├── server.js          # Express + proxy a RAWG (lee .env)
├── package.json
├── .env               # clave de la API (NO se sube a GitHub)
├── .env.example       # plantilla
├── .gitignore
└── public/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── app.js         # router y navegación
        ├── api.js         # llamadas al servidor
        ├── store.js       # usuarios, sesión y colección (localStorage)
        ├── consoles.js    # lista de consolas
        ├── addGame.js     # diálogo "agregar juego"
        ├── ui.js          # utilidades de interfaz
        └── pages/         # home, auth, explore, library
```
