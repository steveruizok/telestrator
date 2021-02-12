import state from "lib/state"
import { useEffect } from "react"

export default function useKeyboardEvents() {
  useEffect(() => {
    function releaseControl(e: KeyboardEvent) {
      switch (e.key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7": {
          state.send("CHANGED_COLOR_KEY", { index: Number(e.key) - 1 })
          break
        }
        case "p": {
          state.send("SELECTED_PENCIL")
          break
        }
        case "e": {
          if (e.metaKey) {
            if (e.shiftKey) {
              state.send("HARD_CLEARED")
            }
            state.send("SOFT_CLEARED")
          } else {
            state.send("SELECTED_ERASER")
          }
          break
        }
        case "z": {
          if (e.metaKey) {
            if (e.shiftKey) {
              state.send("REDO")
            } else {
              state.send("UNDO")
            }
          }
          break
        }
        case "Escape": {
          state.send("DEACTIVATED")
          break
        }
      }
    }

    document.addEventListener("keydown", releaseControl)
    return () => document.removeEventListener("keydown", releaseControl)
  }, [])
}
