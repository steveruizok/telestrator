import React from "react"
import styled from "styled-components"
import { useSelector } from "lib/state"

function DragSoak() {
  const isDragging = useSelector((state) => state.data.isDragging)
}

const DragSoakContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  -webkit-app-region: drag;
`
