import * as React from "react"
import styled from "styled-components"
import state, { useSelector } from "lib/state"
import Cursor from "./cursor"

export default function App() {
  const rCanvasFrame = React.useRef<HTMLDivElement>()
  const rMarksCanvas = React.useRef<HTMLCanvasElement>()
  const rCurrentCanvas = React.useRef<HTMLCanvasElement>()

  const showCursor = useSelector((state) => state.isInAny("active"))

  React.useEffect(() => {
    state.send("LOADED", {
      frame: rCanvasFrame,
      marksCanvas: rMarksCanvas,
      currentCanvas: rCurrentCanvas,
    })
    return () => state.send("UNLOADED")
  }, [])

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
        onPointerDown={(e) =>
          state.send("STARTED_DRAWING", {
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
          })
        }
        onPointerUp={(e) =>
          state.send("STOPPED_DRAWING", {
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
          })
        }
        onPointerMove={(e) =>
          state.send("MOVED_CURSOR", {
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
          })
        }
        // onPointerLeave={() => state.send("DEACTIVATED")}
      >
        <canvas ref={rMarksCanvas} width={400} height={400} />
        <canvas ref={rCurrentCanvas} width={400} height={400} />
      </CanvasContainer>
      {showCursor && <Cursor />}
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

  & *[data-cursor="true"] {
    opacity: 0;
  }

  :hover *[data-cursor="true"] {
    opacity: 1;
  }
`

const CanvasContainer = styled.div`
  overflow: hidden;
  background-color: transparent;
  position: relative;
`
