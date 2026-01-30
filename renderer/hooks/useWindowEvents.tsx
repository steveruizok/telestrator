import * as React from "react"
import state from "lib/state"

export default function useWindowEvents() {
  React.useEffect(() => {
    // Dynamic require to avoid webpack bundling issues with electron in Next.js
    const electron = typeof window !== 'undefined' && window.require ? window.require('electron') : null
    if (!electron) return

    const { ipcRenderer } = electron

    function handleEvent(_: any, ...args: any[]) {
      state.send(args[0].eventName, args[0].payload || {})
      document.body.focus()
    }
    ipcRenderer.on("projectMsg", handleEvent)
    return () => {
      ipcRenderer.off("projectMsg", handleEvent)
    }
  })
}
