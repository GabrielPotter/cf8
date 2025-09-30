# cf8

VS Code-like Electron + React + TypeScript + MUI app scaffold.

- Root contains configuration only.
- Source code lives under `src/`.
- Electron windows: `src/windows/`.
- Worker utilities: `src/workers/`.
- Renderer (Vite): `src/renderer/` (components in `src/renderer/components/`).
- `ViewStack` keep-alive: views stay mounted and non-active ones are hidden.

## macOS prerequisites (before cloning)

We develop on macOS using VS Code. Install these before cloning the repo:

1) Xcode Command Line Tools (required for native Node modules):

```bash
xcode-select --install
```

2) Homebrew (package manager):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3) Git:

```bash
brew install git
```

4) Node.js (recommended via nvm):

```bash
brew install nvm
mkdir -p ~/.nvm
```

Add this to your shell profile (`~/.zshrc`):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"
```

Then install Node:

```bash
nvm install --lts
nvm use --lts
```

5) VS Code:

```bash
brew install --cask visual-studio-code
```

After these are installed, you can clone the repo and start development.

## Development

```bash
npm install
npm run dev
npm run build
npm start
```

## Project summary

cf8 is a VS Code-style desktop app scaffold built with Electron, React, TypeScript, and MUI. The main process owns window lifecycle, IPC, and filesystem operations, while the renderer (Vite + React) provides multiple views: explorer, logs, settings, object catalog, diagram editor, and property grid. The codebase is organized into modular subsystems: configuration and logging, filesystem catalog scanning, JSON object catalog editing, schema-driven property grid UI, and a port-based diagram editor built on React Flow.

### Main process and IPC

- `src/main.ts`: Electron app boot, electron-log integration, IPC handlers for:
  - log read/write
  - JSON reads from `assets/`
  - object catalog list/write
  - config dump (system + user)
  - environment snapshot
  - filesystem catalog scan + create/rename/delete
- `src/preload.ts`: `contextBridge` API exposed to the renderer (`window.api`) for safe IPC access.
- `src/ipc/channels.ts`: typed IPC channel registry.

### Windowing

- `src/windows/window-factory.ts`: window creation and registry, preload wiring, and renderer HTML loading.

### Configuration and logging

- `src/common/config-base.ts`: shared config reader and path-tokenized lookup.
- `src/common/system-config.ts`: system config (dev uses `assets/config/cf8.json`).
- `src/common/user-config.ts`: user config at `~/.cf8/config.json`.
- `src/common/logging.ts` + `src/renderer/logger.ts`: renderer log forwarding to main process with safe fallback.

### Filesystem and object catalogs

- `src/workers/catalogScanner.ts`: recursive directory scan and CRUD (file/folder create/rename/delete).
- `src/workers/objectScanner.ts`: JSON file discovery and parsing for object catalog view.
- `src/common/fileTree.ts`: shared file tree types used by the renderer.

### Renderer views

- `src/renderer/App.tsx`: left-side activity bar with view switching and snackbar integration.
- `SettingsView`: system/user config read-only view (CodeMirror).
- `LogsView`: electron-log file viewer with refresh.
- `ExplorerView`: JSON editor + filesystem tree view with CRUD actions.
- `ObjectView`: editable JSON object catalog with tree editing, insert/delete, and previews.
- `FlowView`: simple React Flow example with resizable split and JSON meta editor.
- `DiagramTestView` + `components/diagram/*`: advanced port-based diagram editor with templates, routing, context menus, import/export, and editors for node/edge metadata.
- `PropsTestView` + `TabbedPropertyGrid` + `PropertyGrid`: JSON Schema-driven property grid with data/schema editors, validation feedback, and read-only mode.

### UI/tooling

- MUI v6 with a dark theme.
- notistack for snackbars.
- CodeMirror for JSON editing.
- React Flow for diagramming.
- Custom tree views: `FileTreeView` and `ObjectTreeView`.

### Build and run

- Dev mode: `tsc -w` (main), Vite (renderer), Electron boot with `VITE_DEV_SERVER_URL`.
- Build: `tsc` + `vite build`, postbuild copies `assets/` to `dist/assets/`.
- Tests: `npm test` (Jest with coverage).

### Project structure (high level)

```
assets/              Static assets, config, sample data
src/
  common/            Shared config/logging/types
  ipc/               IPC channels and types
  renderer/          React UI (views, components, theme)
  windows/           Electron window factory
  workers/           Filesystem/catalog utilities
```

If you want additional platform-specific setup (Windows/Linux) or deeper module docs, add a request and the README can be expanded further.
