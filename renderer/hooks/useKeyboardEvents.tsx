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
          if (e.metaKey) {
            state.send("CHANGED_SIZE_KEY", { index: Number(e.key) - 1 })
          } else {
            state.send("CHANGED_COLOR_KEY", { index: Number(e.key) - 1 })
          }
          break
        }
        case "f": {
          if (e.metaKey) {
            state.send("TOGGLED_FADING")
          }
          break
        }
        case "D":
        case "P": {
          state.send("TOGGLED_PRESSURE")
          break
        }
        case "d":
        case "p": {
          state.send("SELECTED_PENCIL")

          break
        }
        case "a": {
          state.send("SELECTED_ARROW")
          break
        }
        case "r": {
          state.send("SELECTED_RECT")
          break
        }
        case "e": {
          if (e.metaKey) {
            if (e.shiftKey) {
              state.send("HARD_CLEARED")
            } else {
              state.send("SOFT_CLEARED")
            }
          } else {
            state.send("SELECTED_ELLIPSE")
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
        case "Shift": {
          state.send("TOGGLED_ASPECT_LOCK")
          break
        }
        case "Meta": {
          state.send("TOGGLED_FILL")
        }
      }
    }

    document.addEventListener("keydown", releaseControl)
    return () => document.removeEventListener("keydown", releaseControl)
  }, [])
}
