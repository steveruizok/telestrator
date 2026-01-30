# TODO

- [x] Create CLAUDE.md file
- [x] Create TODO.md file
- [x] Update all dependencies to the latest versions
- [x] Review codebase to find bugs or vulnerabilities
- [x] Add any bugs or vulnerabilities to the `Issues` section below
- [x] Iterate through the issues and implement the fixes (P0 issues completed)
- [x] Review codebase and create an issue proposing optimal architecture
- [x] Implement the proposed architecture (security hardening via IPC, CSP, context isolation)
- [ ] Test modernization: `rm -rf node_modules yarn.lock && yarn install && yarn dev`
- [ ] Verify drawing, undo/redo, cursor, and state transitions work
- [ ] Test build: `yarn build`
- [ ] Run security audit: `yarn audit`
- [ ] Commit changes

## Issues

Tip: Use semantic titles for issues, e.g. "Fix: <title> (P0)".

### Fix: Disable nodeIntegration and enable contextIsolation (P0) ✅ COMPLETED

**Location:** `main/background.js:48`

The application had `nodeIntegration: true` which allowed the renderer process full access to Node.js APIs. This was a critical security vulnerability.

**Fix Applied:**
- [x] Set `nodeIntegration: false` in webPreferences
- [x] Set `contextIsolation: true` in webPreferences
- [x] Created preload script (`main/preload.js`) to expose only necessary IPC methods
- [x] Refactored renderer code to use IPC instead of direct Node.js/remote access
- [x] Updated `renderer/lib/state.ts` to use `window.electronAPI` for window control

### Fix: Remove deprecated enableRemoteModule (P0) ✅ COMPLETED

**Location:** `main/background.js:48`

The `remote` module was deprecated since Electron 10 and removed in Electron 14+.

**Fix Applied:**
- [x] Removed `enableRemoteModule: true` from webPreferences
- [x] Created IPC handlers in main process for window operations (`window:maximize`, `window:setIgnoreMouseEvents`)
- [x] Replaced `remote.getCurrentWindow()` calls with IPC invocations via `window.electronAPI`
- [x] Added TypeScript type declarations for the electronAPI

### Fix: Add Content Security Policy (P1) ✅ COMPLETED

**Location:** `main/background.js`

Content Security Policy has been implemented via Electron's `session.webRequest.onHeadersReceived`.

**Implementation Applied:**
- [x] Added CSP via `session.webRequest.onHeadersReceived` in main process
- [x] Restrict script sources to 'self' (+ 'unsafe-eval' in dev for Next.js HMR)
- [x] Allow 'unsafe-inline' for styles (required by styled-components)
- [x] Allow data: and blob: URIs for canvas images
- [x] Block plugins (object-src 'none')
- [x] Restrict connections, forms, and base URI to 'self'

**CSP Directives:**
- Production: No unsafe-eval, maximum security
- Development: Allows unsafe-eval for Next.js hot reload, localhost connections

### Fix: Update outdated dependencies (P1) ✅ COMPLETED

**Location:** `package.json`

Full modernization completed - upgraded from Node 16 requirement to Node 18.17+.

**Updated Dependencies:**
- [x] Electron 11 → 28
- [x] Next.js 10 → 14
- [x] React 17 → 18
- [x] TypeScript 4 → 5
- [x] Framer Motion 3 → 11
- [x] styled-components 5 → 6
- [x] perfect-freehand 0.3 → 1.2
- [x] electron-updater 4 → 6
- [x] electron-builder 22 → 24
- [x] electron-store 6 → 8
- [x] nextron 6 → 9

**Removed:**
- [x] sharp (not needed with `images.unoptimized: true`)
- [x] babel-plugin-styled-components (using SWC compiler)
- [x] .babelrc file (Next.js 14 uses SWC)

**Config Updates:**
- [x] `renderer/next.config.js` - Rewritten for Next.js 14 (output: 'export', SWC styled-components)
- [x] `renderer/tsconfig.json` - Updated to ES2020 target, bundler moduleResolution
- [x] `main/helpers/create-window.js` - Fixed default security (nodeIntegration: false, contextIsolation: true)

### Investigate: Architecture improvements for Electron security model (P2) ✅ COMPLETED

**Location:** `main/background.js`, `main/helpers/create-window.js`, `renderer/lib/state.ts`

The current architecture has been improved with:
1. ✅ Secure IPC-based communication via preload script
2. ✅ Context isolation enabled
3. ✅ Node integration disabled
4. ✅ Content Security Policy implemented
5. ✅ Full dependency modernization completed
6. ✅ Node 18.17+ / Node 20+ supported
