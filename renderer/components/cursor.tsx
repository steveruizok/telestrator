import styled from "styled-components"
import { motion } from "framer-motion"
import { useSelector } from "lib/state"
import { Edit2 } from "react-feather"
import { mvPointer } from "hooks/usePointer"

export default function Cursor() {
  const activeColor = useSelector((state) => state.data.color)
  return (
    <CursorContainer
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        x: mvPointer.x,
        y: mvPointer.y,
      }}
    >
      <Edit2 fill={activeColor} />
    </CursorContainer>
  )
}

const CursorContainer = styled(motion.div)`
  height: 0;
  width: 0;
  pointer-events: none;
  z-index: 999;
  svg {
    transform: rotate(90deg);
  }
`
