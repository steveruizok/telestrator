import { app, dialog, globalShortcut, ipcMain, session } from "electron"
import serve from "electron-serve"
import path from "path"
import { createWindow } from "./helpers"
import { autoUpdater } from "electron-updater"

const isProd = process.env.NODE_ENV === "production"

// Content Security Policy
// - default-src 'self': Only allow resources from the app's origin
// - script-src 'self' 'unsafe-eval': Allow scripts from self; unsafe-eval needed for Next.js in dev
// - style-src 'self' 'unsafe-inline': Allow inline styles for styled-components
// - img-src 'self' data: blob:: Allow images from self and data/blob URIs for canvas
// - font-src 'self': Allow fonts from self only
// - connect-src 'self': Allow connections to self only (no external APIs)
// - object-src 'none': Disallow plugins like Flash
// - base-uri 'self': Restrict base URL
// - form-action 'self': Restrict form submissions
const CSP_POLICY = isProd
  ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
  : "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* data:; object-src 'none'; base-uri 'self'; form-action 'self'"

if (isProd) {
  serve({ directory: "app" })
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`)
}

;(async () => {
  await app.whenReady()

  // Apply Content Security Policy to all responses
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP_POLICY]
      }
    })
  })

  // Auto Updates

  autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Application Update",
      message: releaseName,
      detail:
        "A new version has been downloaded. Restart the application to apply the updates.",
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on("error", (message) => {
    console.error("There was a problem updating the application.")
    console.error(message)
  })

  // Create window with secure webPreferences
  const mainWindow = createWindow("main", {
    fullscreenable: false,
    width: 100,
    height: 100,
    transparent: true,
    frame: false,
    titleBarStyle: "customButtonsOnHover",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    hasShadow: false,
    title: "Telestrator",
  })

  mainWindow.maximize()
  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  mainWindow.setAlwaysOnTop(true, "floating")
  mainWindow.setResizable(false)

  // IPC Handlers for window control (replaces remote module usage)
  ipcMain.handle("window:maximize", () => {
    mainWindow.maximize()
  })

  ipcMain.handle("window:setIgnoreMouseEvents", (event, ignore, options) => {
    mainWindow.setIgnoreMouseEvents(ignore, options)
  })

  // Window events

  app.on("browser-window-focus", () => {
    if (mainWindow) {
      mainWindow.webContents.send("projectMsg", { eventName: "FOCUSED_WINDOW" })
    }
  })

  app.on("browser-window-blur", () => {
    if (mainWindow) {
      mainWindow.webContents.send("projectMsg", { eventName: "BLURRED_WINDOW" })
    }
  })

  // Check for updates.
  autoUpdater.checkForUpdatesAndNotify()

  // Register a 'CommandOrControl+Z' shortcut listener.
  const ret = globalShortcut.register("CommandOrControl+Option+Z", () => {
    app.focus({ steal: true })
    mainWindow.webContents.focus()
    mainWindow.webContents.send("projectMsg", {
      eventName: "ACTIVATE_SHORTCUT",
    })
  })

  if (!ret) {
    console.warn("Shortcut registration failed.")
  }

  app.on("will-quit", () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
  })

  // Kickoff

  if (isProd) {
    await mainWindow.loadURL("app://./home.html")
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools({ mode: "detach" })
  }
})()

app.on("window-all-closed", () => {
  app.quit()
})
