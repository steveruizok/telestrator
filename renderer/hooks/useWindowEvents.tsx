import { remote, IpcRendererEvent, ipcRenderer } from "electron"
import * as React from "react"
import state from "lib/state"

export default function useWindowEvents() {
  React.useEffect(() => {
    function handleEvent(_: IpcRendererEvent, ...args: any[]) {
      state.send(args[0].eventName, args[0].payload || {})
      document.body.focus()
    }
    ipcRenderer.on("projectMsg", handleEvent)
    return () => {
      ipcRenderer.off("projectMsg", handleEvent)
    }
  })
}
