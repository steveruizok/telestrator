import state from "lib/state"
import styled from "styled-components"
import { useStateDesigner } from "@state-designer/react"
import * as React from "react"
import usePointer from "hooks/usePointer"
import { colors, sizes } from "lib/defaults"
import { Edit2, MinusCircle } from "react-feather"

const Static = { w: 600, h: 400 }

export default function App() {
  const local = useStateDesigner(state)
  const rCanvasFrame = React.useRef<HTMLDivElement>()
  const rMarksCanvas = React.useRef<HTMLCanvasElement>()
  const rCurrentCanvas = React.useRef<HTMLCanvasElement>()
  const mvPoint = usePointer(rCanvasFrame)

  React.useEffect(() => {
    state.send("LOADED", {
      frame: rCanvasFrame,
      marksCanvas: rMarksCanvas,
      currentCanvas: rCurrentCanvas,
    })
    return () => state.send("UNLOADED")
  }, [])

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    state.send("MOVED_CURSOR", { x: mvPoint.x.get(), y: mvPoint.y.get() })
  }

  React.useEffect(() => {
    function handleResize() {
      state.send("RESIZED")
    }

    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  return (
    <Layout>
      <CanvasContainer
        ref={rCanvasFrame}
        onPointerDown={(e) => {
          state.send("STARTED_DRAWING", {
            x: mvPoint.x.get(),
            y: mvPoint.y.get(),
          })
        }}
        onPointerUp={(e) =>
          state.send("STOPPED_DRAWING", {
            x: mvPoint.x.get(),
            y: mvPoint.y.get(),
          })
        }
        onPointerMove={handlePointerMove}
      >
        <canvas ref={rMarksCanvas} width={400} height={400} />
        <canvas ref={rCurrentCanvas} width={400} height={400} />
      </CanvasContainer>
    </Layout>
  )
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-auto-rows: auto;
  height: 100%;
  width: 100%;
  user-select: none;

  & canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

const CanvasContainer = styled.div`
  overflow: hidden;
  background-color: transparent;
  position: relative;
`
