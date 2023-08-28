# Telestrator

## [Download the latest release](https://github.com/steveruizok/telestrator/releases)

An on-screen drawing tool (aka a ["telestrator"](https://en.wikipedia.org/wiki/Telestrator)) by [@steveruizok](https://twitter.com/steveruizok).

This project needs a maintainer! (My hands are full with [tldraw](https://github.com/tldraw/tldraw)) DM me!

## Usage

When open, the app sits on top of your screen as a transparent always-on-top window. When activated, your cursor will interact with the app. When not activated, your cursor will pass through to the windows beneath it.

- To view the app's toolbar, move your cursor into the lower left corner of your screen.
- To **activate** the app, select a color or tool. You can now begin drawing.
- To **deactivate** the app (and release your cursor), press `Escape`.

## Keyboard Shortcuts

- `Command + Option + Z` to activate the app.
- `Escape` to deactivate the app.
- `E` for ellipse tool.
- `R` for rectangle tool.
- `A` for arrow tool.
- `D` for draw tool.
- `1` through `6` to select colors.
- `Command + 1` through `Command + 3` to select sizes.
- `Command + E` to clear the screen.
- `Command + F` to toggle fading.
- `Command + Z` to undo.
- `Command + Shift + Z` to redo.
- Clear screen and release pointer with `Command + Shift + E`.

You can also activate the app at any time by pressing `Command + Option + Z`.

## Tips and Tricks

- Double click the drawing tool to toggle between ink-style drawing and solid drawing.

## Roadmap

A loose idea of the features planned for development.

- [ ] Alert user to deactivate shortcut on first activation.
- [ ] In-app updates.
- [ ] Preferences menu.
- [ ] Customize global shortcut.
- [ ] Customize sizes.
- [ ] Customize colors.
- [ ] Customize background color (e.g. chroma key).
- [ ] Customize toolbar location (e.g. left, right, bottom, top).
- [ ] Add as menu icon instead of dock icon.

## Developing

This is an Electron app. If you're set up to do web dev then you'll be able to easily build the app from source. Clone this repo and run `yarn install` and `yarn dev` or `yarn build` just like you would with a regular web project.
