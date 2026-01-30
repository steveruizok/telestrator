# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telestrator is a macOS Electron desktop application that provides an on-screen drawing/annotation tool. It creates a transparent, always-on-top window for drawing over screen content.

## Development Commands

**Requires Node.js 18.17+** (or Node.js 20+)

```bash
nvm use 20            # Switch to Node 20 (recommended)
yarn install          # Install dependencies
yarn dev              # Start development server (Electron + Next.js with hot reload)
yarn build            # Build macOS app (Intel x64 & Apple Silicon arm64)
yarn release          # Create GitHub release with built DMG
```

**No test framework is configured.**

## Architecture

**Tech Stack**: Electron 28 + Next.js 14 + React 18 + TypeScript 5

**Process Model**:
- **Main process** (`main/background.js`): Window management, global shortcuts, auto-updates
- **Renderer process** (`renderer/`): React UI built with Next.js

**Key Architectural Patterns**:

1. **State Machine** (`renderer/lib/state.ts`): Uses State Designer library for hierarchical state management. All app behavior flows through this state machine:
   - `app` → `loading` / `ready`
   - `ready` → `inactive` / `active` / `selecting`
   - `active` → `drawing` / `notDrawing` / `cursorVisible`

2. **Drawing System**: HTML5 Canvas with perfect-freehand library for pressure-sensitive strokes

3. **Window Behavior**: Transparent frameless window that toggles between click-through (inactive) and interactive (active) modes via `Cmd+Option+Z`

**Key Files**:
- `main/background.js` - Electron entry, window setup, global shortcuts
- `renderer/lib/state.ts` - State machine defining all app behavior
- `renderer/components/canvas.tsx` - Drawing surface
- `renderer/components/controls.tsx` - Toolbar UI
- `renderer/hooks/usePointer.tsx` - Input handling

## Configuration

- `electron-builder.yml` - Build config (macOS DMG, code signing)
- `renderer/next.config.js` - Sets webpack target to `electron-renderer`
- TypeScript strict mode is OFF

## Debugging (VS Code)

- Main process: Port 9292 (Node debugger)
- Renderer process: Port 5858 (Chrome debugger)
- Use "Nextron: All" compound config to debug both

## Task Tracking

See `TODO.md` for current tasks and issues.
