# Telestrator Project Specification

## Overview
Telestrator is a macOS Electron desktop application that provides an on-screen drawing/annotation tool. It creates a transparent, always-on-top window for drawing over screen content.

## Current State
- Existing Electron + Next.js + React application
- Functional drawing capabilities with pressure-sensitive strokes
- State machine-based architecture using State Designer
- macOS-only build target

## Goals for This Ralph Session

### Primary Goal: Modernization and Security Hardening
1. **Update all dependencies** to latest compatible versions
2. **Identify and fix security vulnerabilities**
3. **Document issues** found during review
4. **Propose architectural improvements** if needed

### Success Criteria
- All dependencies updated to latest stable versions
- No critical or high-severity security vulnerabilities
- All issues documented in TODO.md
- Application still builds and runs correctly (`yarn dev`, `yarn build`)

## Technical Requirements

### Dependency Updates
- Must maintain compatibility between Electron, Next.js, and React
- Breaking changes must be addressed, not ignored
- Package manager: yarn (not npm)

### Security Requirements
- Electron security best practices must be followed
- Proper IPC communication between processes
- Content Security Policy should be configured
- No exposed secrets or credentials
- Context isolation should be enabled

### Documentation Requirements
- All bugs/vulnerabilities added to TODO.md Issues section
- Use semantic issue titles: "Fix: <description> (P0/P1/P2)"
- Include implementation plan items for each issue

## Architecture Overview

### Process Model
```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                          │
│  main/background.js                                      │
│  - Window management                                     │
│  - Global shortcuts (Cmd+Option+Z)                       │
│  - Auto-updates                                          │
└─────────────────────────────────────────────────────────┘
                           │
                    IPC Communication
                           │
┌─────────────────────────────────────────────────────────┐
│                   Renderer Process                       │
│  renderer/                                               │
│  - React UI (Next.js)                                   │
│  - State machine (State Designer)                       │
│  - Canvas drawing                                        │
└─────────────────────────────────────────────────────────┘
```

### State Machine
```
app
├── loading
└── ready
    ├── inactive (click-through mode)
    ├── active (interactive mode)
    │   ├── drawing
    │   ├── notDrawing
    │   └── cursorVisible
    └── selecting
```

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| Main Process | `main/background.js` | Electron window, shortcuts, updates |
| State Machine | `renderer/lib/state.ts` | App behavior management |
| Canvas | `renderer/components/canvas.tsx` | Drawing surface |
| Controls | `renderer/components/controls.tsx` | Toolbar UI |
| Pointer Hook | `renderer/hooks/usePointer.tsx` | Input handling |

## Constraints
- macOS only (no Windows/Linux support needed)
- No test framework exists
- TypeScript strict mode is OFF
- Must maintain existing user-facing functionality

## Out of Scope
- Adding new features beyond what's in TODO.md
- Cross-platform support
- Setting up a test framework
- Major rewrites of working code
