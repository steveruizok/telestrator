import { remote } from "electron"
import getPath from "perfect-freehand"
import { RefObject } from "react"
import { createSelectorHook, createState } from "@state-designer/react"
import { mvPointer } from "hooks/usePointer"
import * as defaultValues from "lib/defaults"

// TODO: Fades should begin after a certain amount of time has passed since the last mark was made.

enum MarkType {
  Freehand = "freehand",
  Ruled = "ruled",
  Ellipse = "ellipse",
  Rect = "rect",
  Arrow = "arrow",
}

interface MarkBase {
  pointerType: string
  pressure: boolean
  type: MarkType
  size: number
  color: string
  eraser: boolean
  strength: number
  points: number[][]
}

interface Mark extends MarkBase {}

interface CompleteMark extends MarkBase {
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
    fadeDelay: 1,
    fadeDuration: 0.5,
    hideCursor: false,
    refs: undefined as Refs | undefined,
    color: "#42a6f6",
    size: 16,
    pressure: true,
    fading: [] as CompleteMark[],
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
    LOADED: ["setRefs", { get: "elements", do: "setupCanvases" }, "activate"],
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
          on: {
            FOCUSED_WINDOW: [],
          },
          states: {
            inactive: {
              onEnter: ["clearCurrentMark", "deactivate"],
              on: {
                ACTIVATE_SHORTCUT: {
                  to: ["active", "drawing"],
                },
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
                BLURRED_WINDOW: { to: "inactive" },
              },
            },
            active: {
              onEnter: ["activate", { get: "elements", do: "resizeCanvases" }],
              on: {
                DEACTIVATED: { to: "inactive" },
                BLURRED_WINDOW: { to: "inactive" },
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
                    TOGGLED_PRESSURE: { do: "togglePressure" },
                    SELECTED_PENCIL: { to: "pencil" },
                    SELECTED_RECT: { to: "rect" },
                    SELECTED_ARROW: { to: "arrow" },
                    SELECTED_ELLIPSE: { to: "ellipse" },
                    SELECTED_ERASER: { to: "eraser" },
                    STARTED_DRAWING: { do: "restoreFades" },
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
                          do: ["beginEraserMark", "drawCurrentMark"],
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
                        STARTED_DRAWING: {
                          if: "drawingWithPen",
                          to: ["cursorHidden", "drawing"],
                          else: { to: "drawing" },
                        },
                      },
                      onEnter: {
                        wait: "fadeDelay",
                        do: "pushMarksToFading",
                        to: "hasMarks",
                      },
                    },
                    drawing: {
                      onEnter: "clearRedos",
                      on: {
                        STOPPED_DRAWING: {
                          get: "elements",
                          secretlyDo: [
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
    cursor: {
      initial: "cursorVisible",
      states: {
        cursorHidden: {
          on: {
            MOVED_CURSOR: {
              unless: "drawingWithPen",
              to: ["cursorVisible"],
            },
          },
        },
        cursorVisible: {},
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
          onEnter: {
            get: "elements",
            if: "isLoaded",
            secretlyDo: ["clearMarksCanvas", "drawPreviousMarks"],
          },
          on: {
            TOGGLED_FADING: { do: "toggleFading", to: "notFading" },
          },
        },
        hasMarks: {
          onEnter: [
            {
              unless: "fadingEnabled",
              to: "notFading",
            },
            {
              unless: ["hasFadingMarks", "hasMarks"],
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
                unless: ["hasFadingMarks"],
                to: "noMarks",
                else: [
                  {
                    get: "elements",
                    secretlyDo: ["fadeMarks", "removeFadedMarks"],
                  },
                  {
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
  times: {
    fadeDelay(data) {
      return data.fadeDelay
    },
  },
  results: {
    elements(data) {
      if (!data.refs) return {}

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
    isLoaded(data) {
      return !!data.refs?.currentCanvas?.current
    },
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
      return data.fading.length > 0
    },
    drawingWithPen(data) {
      const { pointerType } = getPointer()
      return pointerType === "pen"
    },
  },
  actions: {
    // Fading
    toggleFading(data) {
      const { isFading, fading, marks } = data
      data.isFading = !isFading
      if (!data.isFading) {
        marks.unshift(...fading)
        for (let mark of marks) {
          mark.strength = 1
        }
      }
    },
    fadeMarks(data) {
      const { fadeDuration, fading } = data
      const delta = 0.016 / fadeDuration
      for (let mark of fading) {
        mark.strength -= delta
      }
    },
    removeFadedMarks(data) {
      data.fading = data.fading.filter((mark) => mark.strength > 0)
    },
    // Pointer Capture
    activate() {
      const mainWindow = remote.getCurrentWindow()

      mainWindow.maximize()
      mainWindow.setIgnoreMouseEvents(false, { forward: false })
      document.body.style.setProperty("cursor", "none")
    },
    deactivate() {
      const mainWindow = remote.getCurrentWindow()

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
    togglePressure(data) {
      data.pressure = !data.pressure
    },
    setColor(data, payload) {
      data.color = payload
    },
    setSize(data, payload) {
      data.size = payload
    },
    // Marks
    pushMarksToFading(data) {
      data.fading = [...data.marks]
      data.marks = []
    },
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
    hideOrShowCursor(data, payload) {
      const { pointerType } = getPointer()
      data.hideCursor = pointerType === "pen"
    },
    restoreFades(data) {
      // for (let mark of data.marks) {
      //   if (mark.strength > 0.75) {
      //     mark.strength = 1 * 2
      //   }
      // }
    },
    beginPencilMark(data) {
      const { x, y, pressure, pointerType } = getPointer()

      data.currentMark = {
        pointerType,
        pressure: data.pressure,
        type: MarkType.Freehand,
        size: data.size,
        color: data.color,
        strength: 1,
        eraser: false,
        points: [[x, y, pressure]],
      }
    },
    beginEraserMark(data) {
      const { x, y, pressure, pointerType } = getPointer()

      data.currentMark = {
        pointerType,
        pressure: data.pressure,
        type: MarkType.Freehand,
        size: data.size,
        color: data.color,
        eraser: true,
        strength: 1,
        points: [[x, y, pressure]],
      }
    },
    beginRectMark(data) {
      const { x, y, pressure, pointerType } = getPointer()

      data.currentMark = {
        pointerType,
        pressure: data.pressure,
        type: MarkType.Rect,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1,
        points: [[x, y, pressure]],
      }
    },
    beginEllipseMark(data) {
      const { x, y, pressure, pointerType } = getPointer()

      data.currentMark = {
        pointerType,
        pressure: data.pressure,
        type: MarkType.Ellipse,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1,
        points: [[x, y, pressure]],
      }
    },
    beginArrowMark(data) {
      const { x, y, pressure, pointerType } = getPointer()

      data.currentMark = {
        pointerType,
        pressure: data.pressure,
        type: MarkType.Arrow,
        size: data.size,
        color: data.color,
        eraser: false,
        strength: 1,
        points: [[x, y, pressure]],
      }
    },
    addPointToMark(data) {
      const { points, type } = data.currentMark
      const { x, y, pressure, pointerType } = getPointer()

      if (pointerType !== data.currentMark.pointerType) {
        return
      }

      switch (type) {
        case MarkType.Freehand: {
          points.push([x, y, pressure])
          break
        }
        case MarkType.Arrow:
        case MarkType.Ellipse:
        case MarkType.Rect: {
          points[1] = [x, y, pressure]
          break
        }
      }
    },
    completeMark(data) {
      const { type } = data.currentMark
      let path: Path2D

      switch (type) {
        case MarkType.Freehand: {
          path = getFreehandPath(data.currentMark, data.pressure)
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

        for (let mark of [...data.marks, ...data.fading]) {
          ctx.fillStyle = mark.color
          ctx.strokeStyle = mark.color
          ctx.lineWidth = mark.size
          ctx.globalCompositeOperation = mark.eraser
            ? "destination-out"
            : "source-over"
          ctx.globalAlpha = easeOutQuad(Math.min(1, mark.strength))

          if (mark.type === MarkType.Freehand) {
            ctx.fill(mark.path)
          } else {
            ctx.stroke(mark.path)
          }
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
            path = getFreehandPath(data.currentMark, data.pressure)
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

        if (mark.type === MarkType.Freehand) {
          ctx.fill(path)
        } else {
          ctx.stroke(path)
        }
      }
    },
    // Undos and redos
    undoMark(data) {
      if (data.marks.length > 0) {
        data.redos.push(data.marks.pop())
      } else if (data.fading.length > 0) {
        data.redos.push(data.fading.pop())
      }
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
function getFreehandPath(mark: Mark, isPressure: boolean) {
  const { points } = mark

  if (points.length < 10) {
    const path = new Path2D()
    const [x, y] = points[points.length - 1]
    path.moveTo(x, y)
    path.ellipse(x, y, mark.size / 2, mark.size / 2, 0, Math.PI * 2, 0)
    return path
  }
  const path = new Path2D(
    getPath(points, {
      minSize: mark.size * 0.382,
      maxSize: isPressure ? mark.size : mark.size / 2,
      pressure: isPressure,
      simulatePressure: mark.pointerType !== "pen",
    })
  )
  return path

  // points.unshift(points[0])

  // const [x, y, ...rest] = cSpline(
  //   mark.points.reduce<number[]>((acc, [x, y]) => {
  //     acc.push(x, y)
  //     return acc
  //   }, [])
  // )
  // console.log(x, y, rest)
  // const path = new Path2D()
  // path.moveTo(x, y)
  // for (let i = 0; i < rest.length - 2; i += 2) {
  //   path.lineTo(rest[i], rest[i + 1])
  // }
  // return path
}

function getRectPath(mark: Mark) {
  const { points } = mark
  const x0 = Math.min(points[0][0], points[1][0])
  const y0 = Math.min(points[0][1], points[1][1])
  const x1 = Math.max(points[0][0], points[1][0])
  const y1 = Math.max(points[0][1], points[1][1])

  const path = new Path2D()
  path.rect(x0, y0, x1 - x0, y1 - y0)
  return path
}

function getEllipsePath(mark: Mark) {
  const { points } = mark
  const x0 = Math.min(points[0][0], points[1][0])
  const y0 = Math.min(points[0][1], points[1][1])
  const x1 = Math.max(points[0][0], points[1][0])
  const y1 = Math.max(points[0][1], points[1][1])
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
  const [[x0, y0], [x1, y1]] = points
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
    pressure: mvPointer.p.get(),
    pointerType: mvPointer.pointerType,
  }
}

export function projectPoint(x0: number, y0: number, a: number, d: number) {
  return [Math.cos(a) * d + x0, Math.sin(a) * d + y0]
}

export const useSelector = createSelectorHook(state)
export default state

// state.onUpdate((update) => console.log(update.active, update.log[0]))
