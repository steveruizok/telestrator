import state, { useSelector } from "lib/state"
import styled from "styled-components"
import * as React from "react"
import { colors, sizes } from "lib/defaults"
import {
  X,
  Edit2,
  Circle,
  Square,
  ArrowDownLeft,
  Lock,
  Unlock,
  PenTool,
} from "react-feather"

export default function Controls() {
  const hideActive = useSelector((state) => state.isIn("drawing"))
  const isFading = useSelector((state) => state.data.isFading)
  const selectedSize = useSelector((state) => state.data.size)
  const selectedColor = useSelector((state) => state.data.color)
  const isPressure = useSelector((state) => state.data.pressure)
  const selectedTool = useSelector((state) => state.data.selectedTool)

  return (
    <ControlsContainer
      data-hide={hideActive}
      showActive={false}
      isDrawing={hideActive}
      onMouseOver={() => state.send("ENTERED_CONTROLS")}
      onMouseLeave={() => state.send("LEFT_CONTROLS")}
      onMouseDown={() => state.send("SELECTED")}
    >
      {colors.map((color, i) => (
        <ColorButton
          key={i}
          color={color}
          isSelected={selectedColor === color}
          onClick={() => state.send("SELECTED_COLOR", color)}
        />
      ))}
      <hr />
      {sizes.map((size, i) => (
        <SizeButton
          key={i}
          isSelected={size === selectedSize}
          onClick={() => state.send("SELECTED_SIZE", size)}
          size={size}
          color={selectedColor}
        />
      ))}
      <hr />
      <ToolButton
        color={selectedColor}
        isSelected={selectedTool === "pencil"}
        onDoubleClick={() => state.send("TOGGLED_PRESSURE")}
        onClick={(e) => {
          if (e.shiftKey) {
            state.send("TOGGLED_PRESSURE")
          } else {
            state.send("SELECTED_PENCIL")
          }
        }}
      >
        {isPressure ? <PenTool size={20} /> : <Edit2 size={20} />}
      </ToolButton>
      <ToolButton
        color={selectedColor}
        isSelected={selectedTool === "arrow"}
        onClick={() => state.send("SELECTED_ARROW")}
      >
        <ArrowDownLeft size={20} />
      </ToolButton>
      <ToolButton
        color={selectedColor}
        isSelected={selectedTool === "rect"}
        onClick={() => state.send("SELECTED_RECT")}
      >
        <Square size={20} />
      </ToolButton>
      <ToolButton
        color={selectedColor}
        isSelected={selectedTool === "ellipse"}
        onClick={() => state.send("SELECTED_ELLIPSE")}
      >
        <Circle size={20} />
      </ToolButton>
      <hr />
      <ToolButton
        isSelected={true}
        color={"26, 28, 44"}
        onClick={() => state.send("TOGGLED_FADING")}
      >
        {isFading ? <Unlock size={20} /> : <Lock size={20} />}
      </ToolButton>
      <ToolButton
        isSelected={true}
        color={"26, 28, 44"}
        onClick={() => state.send("DEACTIVATED")}
      >
        <X size={20} />
      </ToolButton>
    </ControlsContainer>
  )
}

const ControlsContainer = styled.div<{
  showActive: boolean
  isDrawing: boolean
}>`
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  height: min-content;
  width: 56px;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: min-content;
  padding: 8px 0px;
  transition: all 0.25s;
  border-radius: 2px 20px 0 0;
  background-color: rgba(0, 0, 0, 0);
  opacity: ${({ showActive }) => (showActive ? 1 : 0.2)};
  transform: ${({ showActive }) =>
    showActive ? "translate(0px 0px)" : "translate(-48px, 0px)"};

  &[data-hide="true"] {
    pointer-events: none;
  }

  :hover {
    opacity: 1;
    transform: translate(0px, 0px);
    background-color: rgba(0, 0, 0, 0.8);
  }

  & hr {
    width: 100%;
    height: 1px;
    margin: 4px 0;
    padding: 0;
    border-color: rgba(255, 255, 255, 0.07);
  }
`

const Button = styled.button<{}>`
  height: 48px;
  width: 56px;
  position: relative;
  background: none;
  border: none;
  z-index: 2;
  outline: none;

  &::before {
    content: "";
    position: absolute;
    top: 0px;
    height: 40px;
    width: 40px;
    left: 8px;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 1);
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.12s;
  }

  &:hover::before {
    opacity: 0.2;
    transform: scale(1);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0px;
    height: 40px;
    width: 40px;
    left: 8px;
    border-radius: 100%;
  }
`

const ColorButton = styled(Button)<{ color: string; isSelected: boolean }>`
  &::before {
    background-color: rgba(
      ${({ color }) => (color === "26, 28, 44" ? "180,180,180" : color)},
      1
    );
  }
  ::after {
    background-color: rgba(${({ color }) => color}, 1);
    transform: scale(${({ isSelected }) => (isSelected ? 0.81 : 0.62)});
    transition: all 0.12s;
  }
`

const SizeButton = styled(Button)<{
  color: string
  size: number
  isSelected: boolean
}>`
  &::before {
    background-color: rgba(
      ${({ color }) => (color === "26, 28, 44" ? "180,180,180" : color)},
      1
    );
  }

  ::after {
    background-color: rgba(${({ color }) => color}, 1);
    transform: scale(${({ size }) => size / 40});
    transition: all 0.12s;
  }
`
const ToolButton = styled(Button)<{
  color: string
  isSelected?: boolean
}>`
  color: rgba(
    ${({ color }) => (color === "26, 28, 44" ? "180,180,180" : color)},
    1
  );
  opacity: ${({ isSelected }) => (isSelected ? 1 : 0.5)};
  padding-bottom: 4px;
  padding-top: 0px;

  &::before {
    background-color: rgba(
      ${({ color }) => (color === "26, 28, 44" ? "180,180,180" : color)},
      1
    );
  }
`

/* 
const canUndo = useSelector((state) => state.can("UNDO"))
const canRedo = useSelector((state) => state.can("REDO"))

<ToolButton disabled={!canUndo} onClick={() => state.send("UNDO")}>
  <CornerUpLeft />
</ToolButton>
<ToolButton disabled={!canRedo} onClick={() => state.send("REDO")}>
  <CornerUpRight />
</ToolButton>
<ToolButton
  isSelected={selectedTool === "eraser"}
  onClick={() => state.send("SELECTED_ERASER")}
  onDoubleClick={() => state.send("MEDIUM_CLEARED")}
>
  <MinusCircle size={20} />
</ToolButton> 
<ToolButton>
  <Settings size={20} />
</ToolButton> 
*/
