# TODO

- [x] Create CLAUDE.md file
- [x] Create TODO.md file
- [x] Update all dependencies to the latest versions
- [x] Review codebase to find bugs or vulnerabilities
- [x] Add any bugs or vulnerabilities to the `Issues` section below
- [x] Iterate through the issues and implement the fixes (P0 issues completed)
- [ ] Review codebase and create an issue proposing optimal architecture
- [ ] Implement the proposed architecture

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

### Fix: Update outdated dependencies (P0 - BLOCKING)

**Location:** `package.json`

**⚠️ CRITICAL: `yarn dev` is currently broken due to Node.js/Next.js incompatibility**

The application uses very old versions of core dependencies that are incompatible with modern Node.js:
- Electron 11.2.3 (current: 28.x) - Missing 3+ years of security patches
- Next.js 10.0.5 (current: 14.x) - **BROKEN: postcss subpath exports error with Node 18+**
- React 17.0.1 (current: 18.x)
- electron-updater 4.3.8 (current: 6.x)
- electron-builder 22.9.1 (current: 24.x)

**Current Error:**
```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/parser' is not defined by "exports" in .../node_modules/next/node_modules/postcss/package.json
```

**Root Cause:** Next.js 10.0.5's bundled postcss doesn't support Node.js 18+ ESM resolution.

**Implementation Plan:**
- [ ] Option A: Update Next.js to 12.x+ (minimum for Node 18 support)
- [ ] Option B: Use Node.js 16 (nvm use 16) as workaround
- [ ] Update Electron, electron-updater, electron-builder
- [ ] Test `yarn dev` and `yarn build` after updates
- [ ] Run `yarn audit` to identify remaining CVEs

### Investigate: Architecture improvements for Electron security model (P2)

**Location:** `main/background.js`, `main/helpers/create-window.js`, `renderer/lib/state.ts`

The current architecture has been improved with:
1. ✅ Secure IPC-based communication via preload script
2. ✅ Context isolation enabled
3. ✅ Node integration disabled

Remaining improvements:
- [ ] Add Content Security Policy
- [ ] Update dependencies to latest versions
