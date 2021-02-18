import { app, screen } from "electron"
import serve from "electron-serve"
import { createWindow } from "./helpers"

const isProd = process.env.NODE_ENV === "production"

if (isProd) {
  serve({ directory: "app" })
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`)
}

;(async () => {
  await app.whenReady()

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
