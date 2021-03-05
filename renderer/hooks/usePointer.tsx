import * as React from "react"
import { MotionValue, motionValue } from "framer-motion"

interface MotionPointer {
  x: MotionValue<number>
  y: MotionValue<number>
  dx: MotionValue<number>
  dy: MotionValue<number>
  p: MotionValue<number>
  pointerType: string
}
export const mvPointer: MotionPointer = {
  x: motionValue(0),
  y: motionValue(0),
  dx: motionValue(0),
  dy: motionValue(0),
  p: motionValue(0),
  pointerType: "mouse",
}

interface PointerInfo {
  x: number
  y: number
  dx: number
  dy: number
}

export default function usePointer(onMove = (info: PointerInfo) => {}) {
  React.useEffect(() => {
    function updateMotionValues(e: PointerEvent) {
      const x = e.pageX,
        y = e.pageY

      const dx = x - mvPointer.x.get()
      const dy = y - mvPointer.y.get()

      mvPointer.x.set(x)
      mvPointer.y.set(y)
      mvPointer.dx.set(dx)
      mvPointer.dy.set(dy)
      mvPointer.p.set(e.pressure)
      mvPointer.pointerType = e.pointerType

      if (onMove) {
        onMove({ x, y, dx, dy })
      }
    }
    window.addEventListener("pointermove", updateMotionValues)
    return () => window.removeEventListener("pointermove", updateMotionValues)
  }, [])

  return mvPointer
}
