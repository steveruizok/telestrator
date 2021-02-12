import * as React from "react"
import { MotionValue, motionValue } from "framer-motion"

interface MotionPointer {
  x: MotionValue<number>
  y: MotionValue<number>
  dx: MotionValue<number>
  dy: MotionValue<number>
}
export const mvPointer: MotionPointer = {
  x: motionValue(0),
  y: motionValue(0),
  dx: motionValue(0),
  dy: motionValue(0),
}

interface PointerInfo {
  x: number
  y: number
  dx: number
  dy: number
}

export default function usePointer(
  onMove = ({ dx, dy, x, y }: PointerInfo) => {}
) {
  React.useEffect(() => {
    function updateMotionValues(e: PointerEvent) {
      const x = e.pageX,
        y = e.pageY

      const dx = x - mvPointer.x.get()
      const dy = y - mvPointer.y.get()

      // if (Math.hypot(dx, dy) < 8) {
      //   return
      // }

      mvPointer.x.set(x)
      mvPointer.y.set(y)
      mvPointer.dx.set(dx)
      mvPointer.dy.set(dy)

      if (onMove) {
        onMove({ x, y, dx, dy })
      }
    }
    window.addEventListener("pointermove", updateMotionValues)
    return () => window.removeEventListener("pointermove", updateMotionValues)
  }, [])

  return mvPointer
}
