# Telestrator

An on-screen drawing tool (aka a ["telestrator"](https://en.wikipedia.org/wiki/Telestrator)) by [@steveruizok](https://twitter.com/steveruizok).

This app is in active development! **More soon.**

## Download

You can [download the latest (pre)release here](https://github.com/steveruizok/telestrator/releases) though there looks to be some [security issues](https://github.com/steveruizok/telestrator/issues/1). Better for now to clone the repo, run `yarn install` and `yarn build` and open the built app from the dist folder. Hold tight, I'll get the app properly built for the next release.



## Keyboard Shortcuts

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
- Release pointer with `Escape`.
- Clear screen and release pointer with `Command + Shift + E`.

## Developing

This is an Electron app. If you're set up to do web dev then you'll be able to easily build the app from source. Clone this repo and run `yarn install` and `yarn dev` or `yarn build` just like you would with a regular web project.
