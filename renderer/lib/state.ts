import electron from "electron"
import { RefObject } from "react"
import { createSelectorHook, createState } from "@state-designer/react"
import cSpline from "cardinal-spline"
import { mvPointer } from "hooks/usePointer"
import * as defaultValues from "lib/defaults"

enum MarkType {
  Freehand = "freehand",
  Ruled = "ruled",
  Ellipse = "ellipse",
  Rect = "rect",
  Arrow = "arrow",
}

interface Mark {
  type: MarkType
  size: number
  color: string
  eraser: boolean
  points: number[]
  strength: number
}

interface CompleteMark {
  type: MarkType
  size: number
  color: string
  eraser: boolean
  points: number[]
  strength: number
  path: Path2D
}

type Elements = {
  frame: HTMLDivElement
  currentCanvas: HTMLCanvasElement
  marksCanvas: HTMLCanvasElement
}

type Refs = { [key in keyof Elements]: RefObject<Elements[key]> }

const state = createState({
  data: {
    isFading: true,
    isDragging: false,
    fadeDelay: 0.2,
    fadeDuration: 1,
    refs: undefined as Refs | undefined,
    color: "#42a6f6",
    size: 16,
    marks: [] as CompleteMark[],
    currentMark: undefined as Mark | undefined,
    redos: [] as CompleteMark[],
    canvasSize: {
      width: 0,
      height: 0,
    },
    circle: undefined as Mark | undefined,
    square: undefined as Mark | undefined,
    arrow: undefined as Mark | undefined,
  },
  on: {
    SELECTED_COLOR: "setColor",
    SELECTED_SIZE: "setSize",
    LOADED: ["setRefs", "setupCanvases"],
  },
  states: {
    app: {
      initial: "loading",
      states: {
        loading: {
          on: {
            LOADED: [
              {
                get: "elements",
                do: ["clearCurrentCanvas", "clearMarksCanvas"],
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
              onEnter: ["clearCurrentMark", "deactivate"],
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
                STARTED_DRAWING: { to: "inactive" },
              },
            },
            active: {
              onEnter: ["activate", { get: "elements", do: "resizeCanvases" }],
              on: {
                DEACTIVATED: { to: "inactive" },
                CHANGED_COLOR_KEY: { do: "setColorFromKey" },
                CHANGED_SIZE_KEY: { do: "setSizeFromKey" },
                UNDO: {
                  get: "elements",
                  if: "hasMarks",
                  do: [
                    "undoMark",
                    "drawPreviousMarks",
                    "clearCurrentCanvas",
                    "drawCurrentMark",
                  ],
                },
                REDO: {
                  get: "elements",
                  if: "hasRedos",
                  do: [
                    "redoMark",
                    "drawPreviousMarks",
                    "clearCurrentCanvas",
                    "drawCurrentMark",
                  ],
                },
                RESIZED: {
                  get: "elements",
                  secretlyDo: [
                    "resizeCanvases",
                    "drawPreviousMarks",
                    "drawCurrentMark",
                  ],
                },
                UNLOADED: {
                  do: "clearRefs",
                  to: "loading",
                },
              },
              states: {
                tool: {
                  on: {
                    HARD_CLEARED: {
                      get: "elements",
                      do: [
                        "clearPreviousMarks",
                        "clearCurrentMark",
                        "clearCurrentCanvas",
                        "clearMarksCanvas",
                      ],
                      to: ["pencil", "inactive"],
                    },
                    MEDIUM_CLEARED: {
                      get: "elements",
                      do: [
                        "clearPreviousMarks",
                        "clearCurrentMark",
                        "clearCurrentCanvas",
                        "clearMarksCanvas",
                      ],
                      to: ["pencil", "selecting"],
                    },
                    SOFT_CLEARED: {
                      get: "elements",
                      do: [
                        "clearPreviousMarks",
                        "clearCurrentMark",
                        "clearCurrentCanvas",
                        "clearMarksCanvas",
                      ],
                      to: ["pencil"],
                    },
                    SELECTED_PENCIL: { to: "pencil" },
                    SELECTED_RECT: { to: "rect" },
                    SELECTED_ARROW: { to: "arrow" },
                    SELECTED_ELLIPSE: { to: "ellipse" },
                    SELECTED_ERASER: { to: "eraser" },
                  },
                  initial: "pencil",
                  states: {
                    pencil: {
                      on: {
                        STARTED_DRAWING: {
                          get: "elements",
                          do: ["beginPencilMark", "drawCurrentMark"],
                        },
                      },
                    },
                    rect: {
                      on: {
                        STARTED_DRAWING: {
                          get: "elements",
                          do: ["beginRectMark", "drawCurrentMark"],
                        },
                      },
                    },
                    ellipse: {
                      on: {
                        STARTED_DRAWING: {
                          get: "elements",
                          do: ["beginEllipseMark", "drawCurrentMark"],
                        },
                      },
                    },
                    arrow: {
                      on: {
                        STARTED_DRAWING: {
                          get: "elements",
                          do: ["beginArrowMark", "drawCurrentMark"],
                        },
                      },
                    },
                    eraser: {
                      on: {
                        STARTED_DRAWING: {
                          get: "elements",
                          secretlyDo: ["beginEraserMark", "drawCurrentMark"],
                        },
                        SELECTED_COLOR: { to: "pencil" },
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
                            "drawPreviousMarks",
                            "clearCurrentCanvas",
                          ],
                          to: ["notDrawing", "hasMarks"],
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
      initial: "noMarks",
      states: {
        notFading: {
          on: {
            TOGGLED_FADING: {
              do: "toggleFading",
              to: "hasMarks",
            },
          },
        },
        noMarks: {
          on: {
            TOGGLED_FADING: { do: "toggleFading", to: "notFading" },
          },
          onEnter: {
            get: "elements",
            secretlyDo: ["clearPreviousMarks", "clearMarksCanvas"],
          },
        },
        hasMarks: {
          onEnter: [
            {
              unless: "fadingEnabled",
              to: "notFading",
            },
            {
              unless: "hasMarks",
              to: "noMarks",
            },
          ],
          on: {
            TOGGLED_FADING: {
              get: "elements",
              secretlyDo: [
                "toggleFading",
                "clearMarksCanvas",
                "drawPreviousMarks",
              ],
              to: "notFading",
            },
          },
          repeat: {
            onRepeat: [
              {
                unless: ["hasMarks", "hasCurrentMark"],
                to: "noMarks",
                else: [
                  {
                    get: "elements",
                    secretlyDo: ["fadeMarks", "removeFadedMarks"],
                  },
                  {
                    if: "hasFadingMarks",
                    secretlyDo: ["clearMarksCanvas", "drawPreviousMarks"],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
  results: {
    elements(data) {
      // console.log(data.refs)

      const frame = data.refs.frame.current
      const currentCanvas = data.refs.currentCanvas.current
      const marksCanvas = data.refs.marksCanvas.current

      if (!frame || !currentCanvas || !marksCanvas) {
        throw Error("Something is missing!")
      }

      return {
        frame,
        currentCanvas,
        marksCanvas,
      }
    },
  },
  conditions: {
    fadingEnabled(data) {
      return data.isFading
    },
    hasCurrentMark(data) {
      return !!data.currentMark
    },
    hasMarks(data) {
      return data.marks.length > 0
    },
    hasRedos(data) {
      return data.redos.length > 0
    },
    hasFadingMarks(data) {
      return !!data.marks.find((mark) => mark.strength <= 1)
    },
  },
  actions: {
    // Fading
    toggleFading(data) {
      data.isFading = !data.isFading
      if (!data.isFading) {
        for (let mark of data.marks) {
          mark.strength = 1
        }
      }
    },
    fadeMarks(data) {
      const { fadeDuration } = data
      const delta = 0.016 / fadeDuration
      for (let mark of data.marks) {
        mark.strength -= delta
      }
    },
    removeFadedMarks(data) {
      data.marks = data.marks.filter((mark) => mark.strength > 0)
    },
    // Pointer Capture
    activate() {
      const mainWindow = electron.remote.getCurrentWindow()
      mainWindow.maximize()
      mainWindow.setIgnoreMouseEvents(false, { forward: false })
      document.body.style.setProperty("cursor", "none")
    },
    deactivate() {
      const mainWindow = electron.remote.getCurrentWindow()
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
      document.body.style.setProperty("cursor", "auto")
    },
    // Setup
    clearRefs(data) {
      data.refs = undefined
    },
    setRefs(data, payload: Refs) {
      data.refs = payload
    },
    setupCanvases(data, payload, elements: Elements) {
      {
        const cvs = elements.currentCanvas
        const ctx = cvs.getContext("2d")
        ctx.globalCompositeOperation = "source-over"
        ctx.save()
      }

      {
        const cvs = elements.marksCanvas
        const ctx = cvs.getContext("2d")
        ctx.save()
      }
    },
    // Tools
    setColorFromKey(data, payload: { index: number }) {
      const { index } = payload
      const keys = Object.values(defaultValues.colors)
      if (keys[index]) {
        data.color = keys[index]
      }
    },
    setSizeFromKey(data, payload: { index: number }) {
      const { index } = payload
      const keys = Object.values(defaultValues.sizes)
      if (keys[index]) {
        data.size = keys[index]
      }
    },
    setColor(data, payload) {
      data.color = payload
    },
    setSize(data, payload) {
      data.size = payload
    },
    // Marks
    clearPreviousMarks(data, payload, elements: Elements) {
      data.marks = []
    },
    clearCurrentMark(data) {
      data.currentMark = undefined
    },
    // Canvases
    resizeCanvases(data, payload, elements: Elements) {
      data.canvasSize = {
        width: elements.frame.offsetWidth,
        height: elements.frame.offsetHeight,
      }

      elements.marksCanvas.width = data.canvasSize.width
      elements.marksCanvas.height = data.canvasSize.height
      elements.currentCanvas.width = data.canvasSize.width
      elements.currentCanvas.height = data.canvasSize.height
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
    beginPencilMark(data, payload: { pressure: number }) {
      const { x, y } = getPointer()
      let p = payload.pressure || 1

      data.currentMark = {
        type: MarkType.Freehand,
        size: data.size,
        color: data.color,
        strength: 1 + data.fadeDelay,
        eraser: false,
        points: [x, y, x, y],
      }
    },
    beginEraserMark(data, payload: { pressure: number }) {
      const { x, y } = getPointer()

      data.currentMark = {
        type: MarkType.Freehand,
        size: data.size,
        color: data.color,
        eraser: true,
        strength: 1 + data.fadeDelay,
        points: [x, y, x, y],
      }
    },
    beginRectMark(data, payload: { pressure: number }) {
      const { x, y } = getPointer()

      data.currentMark = {
        type: MarkType.Rect,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1 + data.fadeDelay,
        points: [x, y, x, y],
      }
    },
    beginEllipseMark(data, payload: { pressure: number }) {
      const { x, y } = getPointer()

      data.currentMark = {
        type: MarkType.Ellipse,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1 + data.fadeDelay,
        points: [x, y, x, y],
      }
    },
    beginArrowMark(data, payload: { pressure: number }) {
      const { x, y } = getPointer()

      data.currentMark = {
        type: MarkType.Arrow,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1 + data.fadeDelay,
        points: [x, y, x, y],
      }
    },
    addPointToMark(data, payload: { pressure: number }) {
      const { points, type } = data.currentMark
      const { x, y } = getPointer()

      switch (type) {
        case MarkType.Freehand: {
          points.push(x, y)
          break
        }
        case MarkType.Arrow:
        case MarkType.Ellipse:
        case MarkType.Rect: {
          points[2] = x
          points[3] = y
          break
        }
      }
    },
    completeMark(data, payload: { pressure: number }) {
      const { type } = data.currentMark
      let path: Path2D

      switch (type) {
        case MarkType.Freehand: {
          path = getFreehandPath(data.currentMark)
          break
        }
        case MarkType.Ellipse: {
          path = getEllipsePath(data.currentMark)
          break
        }
        case MarkType.Rect: {
          path = getRectPath(data.currentMark)
          break
        }
        case MarkType.Arrow: {
          path = getArrowPath(data.currentMark)
          break
        }
      }

      data.marks.push({
        ...data.currentMark,
        path,
      })
    },
    drawPreviousMarks(data, payload, elements: Elements) {
      // First clear the top canvas...
      const cvs = elements.marksCanvas
      const ctx = cvs.getContext("2d")

      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.globalCompositeOperation = "source-over"
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        for (let mark of data.marks) {
          ctx.strokeStyle = mark.color
          ctx.lineWidth = mark.size
          ctx.globalCompositeOperation = mark.eraser
            ? "destination-out"
            : "source-over"
          ctx.globalAlpha = easeOutQuad(Math.min(1, mark.strength))
          ctx.stroke(mark.path)
        }
      }
    },
    drawCurrentMark(data, payload, elements: Elements) {
      const mark = data.currentMark
      const cvs = elements.currentCanvas
      const ctx = cvs.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height)

        if (mark === undefined) return

        const { type } = mark

        let path: Path2D

        switch (type) {
          case MarkType.Freehand: {
            path = getFreehandPath(data.currentMark)
            break
          }
          case MarkType.Ellipse: {
            path = getEllipsePath(data.currentMark)
            break
          }
          case MarkType.Rect: {
            path = getRectPath(data.currentMark)
            break
          }
          case MarkType.Arrow: {
            path = getArrowPath(data.currentMark)
            break
          }
        }

        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.lineWidth = mark.size
        ctx.fillStyle = mark.color
        ctx.strokeStyle = mark.color
        ctx.globalCompositeOperation = "source-over"
        if (mark.eraser) {
          ctx.globalCompositeOperation = "destination-out"
          ctx.strokeStyle = "rgba(144, 144, 144, 1)"
        }

        ctx.stroke(path)
      }
    },
    // Undos and redos
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
function getFreehandPath(mark: Mark) {
  const [x, y, ...rest] = cSpline(mark.points)

  const path = new Path2D()
  path.moveTo(x, y)
  for (let i = 0; i < rest.length - 1; i += 2) {
    path.lineTo(rest[i], rest[i + 1])
  }
  return path
}

function getRectPath(mark: Mark) {
  const { points } = mark
  const x0 = Math.min(points[0], points[2])
  const y0 = Math.min(points[1], points[3])
  const x1 = Math.max(points[0], points[2])
  const y1 = Math.max(points[1], points[3])

  const path = new Path2D()
  path.rect(x0, y0, x1 - x0, y1 - y0)
  return path
}

function getEllipsePath(mark: Mark) {
  const { points } = mark
  const x0 = Math.min(points[0], points[2])
  const y0 = Math.min(points[1], points[3])
  const x1 = Math.max(points[0], points[2])
  const y1 = Math.max(points[1], points[3])
  const w = x1 - x0
  const h = y1 - y0
  const cx = x0 + w / 2
  const cy = y0 + h / 2

  const path = new Path2D()
  path.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
  return path
}

function getArrowPath(mark: Mark) {
  const { points } = mark
  const [x0, y0, x1, y1] = points
  const angle = Math.atan2(y1 - y0, x1 - x0)
  const distance = Math.hypot(y1 - y0, x1 - x0)
  const leg = (Math.min(distance / 2, 48) * mark.size) / 16
  const [x2, y2] = projectPoint(x1, y1, angle + Math.PI * 1.2, leg)
  const [x3, y3] = projectPoint(x1, y1, angle - Math.PI * 1.2, leg)

  const path = new Path2D()
  path.moveTo(x0, y0)
  path.lineTo(x1, y1)
  path.lineTo(x2, y2)
  path.moveTo(x1, y1)
  path.lineTo(x3, y3)
  return path
}

const easeOutQuad = (t: number) => t * (2 - t)

export function getPointer() {
  return {
    x: mvPointer.x.get(),
    y: mvPointer.y.get(),
    dx: mvPointer.dx.get(),
    dy: mvPointer.dy.get(),
  }
}

export function projectPoint(x0: number, y0: number, a: number, d: number) {
  return [Math.cos(a) * d + x0, Math.sin(a) * d + y0]
}

export const useSelector = createSelectorHook(state)
export default state

// state.onUpdate((update) => console.log(update.active, update.log[0]))
