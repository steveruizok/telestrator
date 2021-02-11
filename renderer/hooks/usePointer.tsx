import * as React from "react"
import { useMotionValue } from "framer-motion"

export default function usePointer(
  ref: React.RefObject<any>,
  onMove = ({
    dx,
    dy,
    x,
    y,
  }: {
    dx: number
    dy: number
    x: number
    y: number
  }) => {}
) {
  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const mvDX = useMotionValue(0)
  const mvDY = useMotionValue(0)

  const rOffset = React.useRef({
    left: 0,
    top: 0,
  })

  React.useEffect(() => {
    function updateBoundingBox() {
      const { left, top } = ref.current.getBoundingClientRect()
      rOffset.current = { left, top }
    }

    let timeout = setInterval(updateBoundingBox, 1000)
    return () => clearInterval(timeout)
  }, [])

  React.useEffect(() => {
    function updateMotionValues(e: PointerEvent) {
      const { left, top } = rOffset.current
      const x = e.pageX - left,
        y = e.pageY - top

      mvDX.set(x - mvX.get())
      mvDY.set(y - mvY.get())
      mvX.set(x)
      mvY.set(y)

      if (onMove) {
        onMove({
          dx: mvDX.get(),
          dy: mvDY.get(),
          x: mvX.get(),
          y: mvY.get(),
        })
      }
    }

    window.addEventListener("pointermove", updateMotionValues)
    return () => window.removeEventListener("pointermove", updateMotionValues)
  }, [])

  return { x: mvX, y: mvY, dx: mvDX, dy: mvDY }
}
