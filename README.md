# cf8

VS Code-szerű Electron + React + TypeScript + MUI projektváz.

- Rootban csak konfiguráció.
- Forráskód a `src/` alatt.
- Electron windows: `src/windows/`
- Worker threads: `src/workers/`
- Renderer (Vite): `src/renderer/` (komponensek a `src/renderer/components/` alatt)
- `ViewStack` keep-alive: nézetek mountolva maradnak.

## Fejlesztés

```bash
npm install
npm run dev
npm run build
npm start