import { app, autoUpdater, globalShortcut } from "electron"
import serve from "electron-serve"
import { createWindow } from "./helpers"
import updater from "update-electron-app"

const isProd = process.env.NODE_ENV === "production"

if (isProd) {
  serve({ directory: "app" })
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`)
}

;(async () => {
  await app.whenReady()

  // Auto Updates

  const server = "https://update.electronjs.org"
  const feed = `${server}/OWNER/REPO/${process.platform}-${
    process.arch
  }/${app.getVersion()}`

  autoUpdater.setFeedURL(feed)

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 10 * 60 * 1000)

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
    console.error("There was a problem updating the application")
    console.error(message)
  })

  // Create window

  const mainWindow = createWindow("main", {
    fullscreenable: false,
    width: 100,
    height: 100,
    transparent: true,
    frame: false,
    titleBarStyle: "customButtonsOnHover",
    webPreferences: { enableRemoteModule: true, nodeIntegration: true },
    hasShadow: false,
    title: "Telestrator",
  })

  mainWindow.maximize()
  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  mainWindow.setAlwaysOnTop(true, "floating")
  mainWindow.setResizable(false)

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

  // Setup global shortcut

  app.whenReady().then(() => {
    // Register a 'CommandOrControl+X' shortcut listener.
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
  })

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

updater()
