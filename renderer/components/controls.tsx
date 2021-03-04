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
      {sizes.map((size, i) => (
        <SizeButton
          key={i}
          isSelected={size === selectedSize}
          onClick={() => state.send("SELECTED_SIZE", size)}
          size={size}
          color={selectedColor}
        />
      ))}
      <ToolButton
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
        {isPressure ? <PenTool size={24} /> : <Edit2 size={24} />}
      </ToolButton>
      <ToolButton
        isSelected={selectedTool === "arrow"}
        onClick={() => state.send("SELECTED_ARROW")}
      >
        <ArrowDownLeft size={24} />
      </ToolButton>
      <ToolButton
        isSelected={selectedTool === "rect"}
        onClick={() => state.send("SELECTED_RECT")}
      >
        <Square />
      </ToolButton>
      <ToolButton
        isSelected={selectedTool === "ellipse"}
        onClick={() => state.send("SELECTED_ELLIPSE")}
      >
        <Circle />
      </ToolButton>
      <ToolButton onClick={() => state.send("TOGGLED_FADING")}>
        {isFading ? <Unlock /> : <Lock />}
      </ToolButton>
      <ToolButton onClick={() => state.send("DEACTIVATED")}>
        <X size={24} />
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
  grid-auto-rows: 40px;
  padding: 8px 0px;
  opacity: ${({ showActive }) => (showActive ? 1 : 0.2)};
  transition: all 0.25s;
  border-radius: 2px 20px 0 0;
  background-color: rgba(0, 0, 0, 0);
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

  button {
    position: relative;
    outline: none;
    z-index: 2;
    padding: 0 8px;
    border: none;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      /* background-color: rgba(144, 144, 144, 0.1); */
    }
  }
`

const ColorButton = styled.button<{ isSelected: boolean; color: string }>`
  border: none;
  padding: 0;
  font-weight: bold;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  padding-left: 8px;

  &::before {
    content: "";
    border-radius: 100%;
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 100%;
    transform: scale(0.85);
    transition: all 0.16s;
    z-index: -1;
    background-color: rgba(
      255,
      255,
      255,
      ${({ isSelected }) => (isSelected ? 0.25 : 0)}
    );
  }

  &:hover::before {
    transform: scale(1);
    background-color: rgba(255, 255, 255, 0.3);
  }

  &::after {
    content: "";
    display: block;
    border-radius: 100%;
    background-color: rgba(${({ color }) => color}, 1);
    height: 100%;
    width: 100%;
    transform: scale(${({ isSelected }) => (isSelected ? 0.62 : 0.4)});
    transition: transform 0.12s;
    border: ${({ color }) =>
      color === "26, 28, 44"
        ? "2px solid rgba(144, 144, 144, .5)"
        : "2px solid transparent"};
  }

  &:hover:after {
    border: 1px solid rgba(144, 144, 144, 0);
    transform: scale(0.62);
  }
`

const SizeButton = styled.button<{
  isSelected: boolean
  size: number
  color: string
}>`
  opacity: ${({ isSelected }) => (isSelected ? "1" : ".5")};
  background-color: (
    ${({ isSelected }) =>
      isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)"}
  );

  &::before {
    content: "";
    border-radius: 100%;
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 100%;
    transform: scale(0.85);
    transition: all 0.16s;
    z-index: -1;
    background-color: rgba(255, 255, 255, 0);
  }

  &:hover::before {
    transform: scale(1);
    background-color: rgba(255, 255, 255, 0.3);
  }

  &:hover {
    opacity: 1;
    color: #fff;
  }

  &::after {
    content: "";
    display: block;
    border-radius: 100%;
    background-color: rgb(${({ color }) => color});
    height: ${({ size }) => size * 0.75}px;
    width: ${({ size }) => size * 0.75}px;
    transition: transform 0.12s;
    border: ${({ color }) =>
      color === "26, 28, 44"
        ? "2px solid rgba(144, 144, 144, .5)"
        : "2px solid transparent"};
  }

  &:hover:after {
    transform: scale(1);
  }
`

const ToolButton = styled.button<{
  isSelected?: boolean
}>`
  color: ${({ isSelected }) =>
    isSelected ? "rgba(232, 232, 232, 1)" : "rgb(180,180,180, 1)"};
  transition: all 0.12s;

  &:hover {
    color: rgba(200, 200, 200, 1);
  }

  &:disabled {
    opacity: 0.5;
  }

  &:enabled:hover {
    opacity: 1;
    color: rgba(220, 220, 220, 1);
  }

  &::before {
    content: "";
    border-radius: 100%;
    position: absolute;
    top: 0;
    left: 8px;
    height: 40px;
    width: 40px;
    transform: scale(0.85);
    transition: all 0.16s;
    z-index: -1;
    background-color: rgba(144, 144, 144, 0);
  }

  &:enabled:hover::before {
    transform: scale(1);
    background-color: rgba(255, 255, 255, 0.25);
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
  <MinusCircle size={24} />
</ToolButton> 
<ToolButton>
  <Settings size={24} />
</ToolButton> 
*/
