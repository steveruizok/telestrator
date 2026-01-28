# Agent Build Instructions

## Project: Telestrator

macOS Electron desktop application for on-screen drawing/annotation.

## Project Setup
```bash
# Install dependencies (uses yarn, not npm)
yarn install
```

## Development Server
```bash
# Start development server (Electron + Next.js with hot reload)
yarn dev
```

## Build Commands
```bash
# Build macOS app (Intel x64 & Apple Silicon arm64)
yarn build

# Create GitHub release with built DMG
yarn release
```

## Running Tests
```bash
# NO TEST FRAMEWORK IS CONFIGURED
# Verification is done manually via yarn dev
```

## Key Files to Understand
- `main/background.js` - Electron entry, window setup, global shortcuts
- `renderer/lib/state.ts` - State machine defining all app behavior
- `renderer/components/canvas.tsx` - Drawing surface
- `renderer/components/controls.tsx` - Toolbar UI
- `renderer/hooks/usePointer.tsx` - Input handling
- `electron-builder.yml` - Build config (macOS DMG, code signing)
- `package.json` - Dependencies and scripts

## Tech Stack
- **Electron 11** - Desktop application framework
- **Next.js 10** - React framework for renderer
- **React 17** - UI library
- **TypeScript** - Type safety (strict mode OFF)
- **State Designer** - State machine library
- **perfect-freehand** - Pressure-sensitive stroke rendering

## Key Learnings
- Uses yarn, not npm
- No test framework exists - manual testing via `yarn dev`
- State machine in `renderer/lib/state.ts` controls all app behavior
- Window toggles between click-through and interactive via `Cmd+Option+Z`
- Transparent frameless window for drawing over screen content

## Debugging (VS Code)
- Main process: Port 9292 (Node debugger)
- Renderer process: Port 5858 (Chrome debugger)
- Use "Nextron: All" compound config to debug both

## Feature Development Quality Standards

### Git Workflow Requirements

Before moving to the next feature, ALL changes must be:

1. **Committed with Clear Messages**:
   ```bash
   git add <specific-files>
   git commit -m "feat(module): descriptive message following conventional commits"
   ```
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
   - Include scope when applicable: `feat(renderer):`, `fix(main):`, `chore(deps):`

2. **Pushed to Remote Repository**:
   ```bash
   git push origin <branch-name>
   ```

### Documentation Requirements

1. **Update TODO.md** when discovering bugs or issues
2. **Update CLAUDE.md** if architectural patterns change
3. **Keep package.json scripts documented**

### Feature Completion Checklist

Before marking ANY feature as complete, verify:

- [ ] `yarn install` succeeds
- [ ] `yarn dev` starts without errors
- [ ] Manual verification of feature works
- [ ] All changes committed with conventional commit messages
- [ ] All commits pushed to remote repository
- [ ] .ralph/fix_plan.md task marked as complete
- [ ] TODO.md updated with any discovered issues
