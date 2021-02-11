import electron from "electron"
import { RefObject } from "react"
import { createSelectorHook, createState } from "@state-designer/react"
import { create } from "lodash"
import cSpline from "cardinal-spline"

interface Point {
  x: number
  y: number
}

interface Mark {
  size: number
  color: string
  eraser: boolean
  points: number[]
  strength: 1
}

type Elements = {
  frame: HTMLDivElement
  currentCanvas: HTMLCanvasElement
  marksCanvas: HTMLCanvasElement
}

type Refs = { [key in keyof Elements]: RefObject<Elements[key]> }

const state = createState({
  data: {
    isDragging: false,
    refs: undefined as Refs | undefined,
    color: "red",
    size: 16,
    marks: [] as Mark[],
    currentMark: undefined as Mark | undefined,
    redos: [] as Mark[],
    canvasSize: {
      width: 0,
      height: 0,
    },
  },
  on: {
    SELECTED_COLOR: "setColor",
    SELECTED_SIZE: "setSize",
  },

  states: {
    tool: {
      on: {
        CLEARED_MARKS: {
          get: "elements",
          do: ["clearHistory", "clearCurrentCanvas", "clearMarksCanvas"],
          to: ["pencil", "selecting"],
        },
      },
      initial: "pencil",
      states: {
        pencil: {
          on: {
            STARTED_DRAWING: {
              get: "elements",
              do: ["beginPencilMark", "drawCurrentMark"],
            },
            SELECTED_ERASER: { to: "eraser" },
          },
        },
        eraser: {
          on: {
            STARTED_DRAWING: {
              get: "elements",
              secretlyDo: ["beginEraserMark", "drawCurrentMark"],
            },
            SELECTED_COLOR: { to: "pencil" },
            SELECTED_PENCIL: { to: "pencil" },
          },
        },
      },
    },
    app: {
      initial: "loading",
      states: {
        loading: {
          on: {
            LOADED: [
              "setRefs",
              {
                get: "elements",
                do: ["setupCanvases", "clearCurrentCanvas", "clearMarksCanvas"],
              },
              {
                to: "ready",
              },
            ],
          },
        },
        ready: {
          initial: "inactive",
          states: {
            inactive: {
              onEnter: "deactivate",
              on: {
                ACTIVATED: { to: "active" },
                ENTERED_CONTROLS: { to: "selecting" },
              },
            },
            selecting: {
              onEnter: "activate",
              on: {
                LEFT_CONTROLS: { to: "inactive" },
                SELECTED: { to: "active" },
              },
            },
            active: {
              onEnter: "activate",
              on: {
                DEACTIVATED: { to: "inactive" },
                UNDO: {
                  if: "hasMarks",
                  do: [
                    "undoMark",
                    "drawMarks",
                    "clearCurrentCanvas",
                    "drawCurrentMark",
                  ],
                },
                REDO: {
                  if: "hasRedos",
                  do: [
                    "redoMark",
                    "drawMarks",
                    "clearCurrentCanvas",
                    "drawCurrentMark",
                  ],
                },
                UNLOADED: {
                  do: "clearRefs",
                  to: "loading",
                },
                RESIZED: {
                  get: "elements",
                  secretlyDo: ["handleResize", "drawMarks", "drawCurrentMark"],
                },
              },
              states: {
                frame: {
                  initial: "fixed",
                  states: {
                    fixed: {
                      on: {
                        STARTED_DRAGGING: { to: "dragging" },
                      },
                    },
                    dragging: {
                      on: {
                        STOPPED_DRAGGING: { to: "fixed" },
                      },
                    },
                  },
                },
                canvas: {
                  initial: "notDrawing",
                  states: {
                    notDrawing: {
                      on: {
                        STARTED_DRAWING: { to: "drawing" },
                      },
                    },
                    drawing: {
                      onEnter: "clearRedos",
                      on: {
                        STOPPED_DRAWING: {
                          get: "elements",
                          do: [
                            "completeMark",
                            "clearCurrentMark",
                            "clearCurrentCanvas",
                            "drawMarks",
                          ],
                          to: "notDrawing",
                        },
                        MOVED_CURSOR: {
                          get: "elements",
                          secretlyDo: ["addPointToMark", "drawCurrentMark"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    marks: {
      states: {
        noMarks: {},
        hasMarks: {},
      },
    },
  },
  results: {
    elements(data) {
      return {
        frame: data.refs.frame.current,
        currentCanvas: data.refs.currentCanvas.current,
        marksCanvas: data.refs.marksCanvas.current,
      }
    },
  },
  conditions: {
    hasMarks(data) {
      return data.marks.length > 0
    },
    hasRedos(data) {
      return data.redos.length > 0
    },
  },
  actions: {
    clearRefs(data) {
      data.refs = undefined
    },
    setRefs(data, payload: Refs) {
      data.refs = payload
    },
    activate() {
      const mainWindow = electron.remote.getCurrentWindow()
      mainWindow.setIgnoreMouseEvents(false, { forward: false })
    },
    deactivate() {
      const mainWindow = electron.remote.getCurrentWindow()
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
    },
    setupCanvases(data, payload, elements: Elements) {
      {
        const cvs = elements.currentCanvas
        const ctx = cvs.getContext("2d")
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.globalCompositeOperation = "source-over"
      }
      {
        const cvs = elements.marksCanvas
        const ctx = cvs.getContext("2d")
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    },
    clearHistory(data, payload, elements: Elements) {
      data.marks = []
    },
    handleResize(data, payload, elements: Elements) {
      data.canvasSize = {
        width: elements.frame.offsetWidth,
        height: elements.frame.offsetHeight,
      }

      elements.marksCanvas.width = data.canvasSize.width
      elements.marksCanvas.height = data.canvasSize.height
      elements.currentCanvas.width = data.canvasSize.width
      elements.currentCanvas.height = data.canvasSize.height
    },
    setColor(data, payload) {
      data.color = payload
    },
    setSize(data, payload) {
      data.size = payload
    },
    clearCurrentMark(data) {
      data.currentMark = undefined
    },
    clearCurrentCanvas(data, payload, elements: Elements) {
      const cvs = elements.currentCanvas
      const ctx = cvs.getContext("2d")
      ctx.clearRect(0, 0, cvs.width, cvs.height)
    },
    clearMarksCanvas(data, payload, elements: Elements) {
      const cvs = elements.marksCanvas
      const ctx = cvs.getContext("2d")
      ctx.clearRect(0, 0, cvs.width, cvs.height)
    },
    drawMarks(data, payload, elements: Elements) {
      // First clear the top canvas...
      const cvs = elements.marksCanvas
      const ctx = cvs.getContext("2d")

      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.globalCompositeOperation = "source-over"

        ctx.save()

        for (let mark of data.marks) {
          drawMark(ctx, mark, "history")
        }
      }
    },
    beginPencilMark(data, payload) {
      const { x, y } = payload
      data.currentMark = {
        size: data.size,
        color: data.color,
        strength: 1,
        eraser: false,
        points: [x, y, x, y, x, y, x, y],
      }
    },
    beginEraserMark(data, payload) {
      const { x, y } = payload
      data.currentMark = {
        size: data.size,
        color: data.color,
        eraser: true,
        strength: 1,
        points: [x, y, x, y, x, y, x, y],
      }
    },
    drawCurrentMark(data, payload, elements: Elements) {
      const cvs = elements.currentCanvas
      const ctx = cvs.getContext("2d")
      ctx.globalCompositeOperation = "source-over"

      ctx.save()

      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        // Draw current mark to the top canvas
        if (data.currentMark !== undefined) {
          drawMark(ctx, data.currentMark, "current")
        }
      }
    },
    completeMark(data) {
      data.currentMark.points = cSpline(data.currentMark.points)
      data.marks.push(data.currentMark)
    },
    addPointToMark(data, payload) {
      const { x, y } = payload
      data.currentMark.points.push(x, y)
    },
    undoMark(data) {
      data.redos.push(data.marks.pop())
    },
    redoMark(data) {
      data.marks.push(data.redos.pop())
    },
    clearRedos(data) {
      data.redos = []
    },
  },
})

// Draw a mark onto the given canvas
function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: Mark,
  layer: "current" | "history"
) {
  ctx.beginPath()
  ctx.lineWidth = mark.size
  ctx.strokeStyle = mark.color
  ctx.globalCompositeOperation = "source-over"

  const pts = layer === "current" ? cSpline(mark.points) : mark.points

  const [x, y, ...rest] = pts

  ctx.moveTo(x, y)

  for (let i = 0; i < rest.length - 1; i += 2) {
    ctx.lineTo(rest[i], rest[i + 1])
  }

  if (mark.eraser) {
    if (layer !== "current") {
      ctx.globalCompositeOperation = "destination-out"
    }
    ctx.strokeStyle = "rgba(144, 144, 144, 1)"
  }

  ctx.stroke()
  ctx.restore()
}

// state.onUpdate((update) => console.log(update.active, update.log[0]))

export const useSelector = createSelectorHook(state)
export default state
