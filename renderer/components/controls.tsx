import electron from "electron"
import state, { useSelector } from "lib/state"
import styled from "styled-components"
import * as React from "react"
import { colors, sizes } from "lib/defaults"
import {
  X,
  Edit2,
  MinusCircle,
  Move,
  CornerUpLeft,
  CornerUpRight,
} from "react-feather"

export default function Controls() {
  const showActive = useSelector((state) =>
    state.isInAny("active", "selecting")
  )
  const selectedSize = useSelector((state) => state.data.size)
  const selectedColor = useSelector((state) => state.data.color)
  const canUndo = useSelector((state) => state.can("UNDO"))
  const canRedo = useSelector((state) => state.can("REDO"))
  const selectedTool = useSelector((state) =>
    state.isIn("pencil") ? "pencil" : state.isIn("eraser") ? "eraser" : null
  )

  // Deactivate when escape is pressed
  React.useEffect(() => {
    function releaseControl(e: KeyboardEvent) {
      if (e.key === "Escape") {
        state.send("DEACTIVATED")
      }
    }

    document.addEventListener("keydown", releaseControl)
    return () => document.removeEventListener("keydown", releaseControl)
  }, [])

  return (
    <ControlsContainer
      showActive={showActive}
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
      <ToolButton disabled={!canUndo} onClick={() => state.send("UNDO")}>
        <CornerUpLeft />
      </ToolButton>
      <ToolButton disabled={!canRedo} onClick={() => state.send("REDO")}>
        <CornerUpRight />
      </ToolButton>
      <ToolButton
        isSelected={selectedTool === "pencil"}
        onClick={() => state.send("SELECTED_PENCIL")}
      >
        <Edit2 size={24} />
      </ToolButton>
      <ToolButton
        isSelected={selectedTool === "eraser"}
        onClick={() => state.send("SELECTED_ERASER")}
        onDoubleClick={() => state.send("CLEARED_MARKS")}
      >
        <MinusCircle size={24} />
      </ToolButton>
      <ToolButton
        onPointerEnter={() => state.send("ENTERED_DRAGGING")}
        onPointerLeave={() => state.send("LEFT_DRAGGING")}
        onPointerDown={() => state.send("STARTED_DRAGGING")}
        onPointerUp={() => state.send("STOPPED_DRAGGING")}
      >
        <Move size={24} />
      </ToolButton>
      <ToolButton onClick={() => state.send("DEACTIVATED")}>
        <X size={24} />
      </ToolButton>
    </ControlsContainer>
  )
}

const ControlsContainer = styled.div<{ showActive: boolean }>`
  cursor: pointer;
  position: absolute;
  bottom: 0;
  left: 0;
  height: min-content;
  width: 56px;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 40px;
  padding: 8px;
  opacity: ${({ showActive }) => (showActive ? 1 : 0.2)};
  transition: all 0.25s;
  border-radius: 2px 20px 0 0;
  background-color: rgba(144, 144, 144, 0);
  transform: ${({ showActive }) =>
    showActive ? "translate(0px 0px)" : "translate(-48px, 0px)"};

  :hover {
    opacity: 1;
    transform: translate(0px, 0px);
    background-color: rgba(144, 144, 144, 0.1);
  }

  button {
    cursor: pointer;
    position: relative;
    outline: none;
    z-index: 2;
    border-radius: 100%;
    border: none;
    padding: 0;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: rgb(144, 144, 144, 1);
  }
`

const ColorButton = styled.button<{ isSelected: boolean; color: string }>`
  border: none;
  padding: 0;
  font-weight: bold;
  cursor: pointer;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;

  &::after {
    content: "";
    display: block;
    border-radius: 100%;
    background-color: ${({ color }) => color};
    height: 100%;
    width: 100%;
    transform: scale(${({ isSelected }) => (isSelected ? 0.68 : 0.4)});
    transition: transform 0.12s;
  }

  &:hover:after {
    border: 1px solid rgba(144, 144, 144, 0);
    transform: scale(1);
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
    left: 0;
    height: 100%;
    width: 100%;
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
    color: #fff;
  }

  &::after {
    content: "";
    display: block;
    border-radius: 100%;
    background-color: ${({ color }) => color};
    height: ${({ size }) => size}px;
    width: ${({ size }) => size}px;
    transition: transform 0.12s;
  }

  &:hover:after {
    transform: scale(1);
  }

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
`

const ToolButton = styled.button<{
  isSelected?: boolean
}>`
  color: ${({ isSelected }) =>
    isSelected ? "rgba(255, 255, 255, 1)" : "rgb(144, 144, 144, 1)"};
  transition: all 0.12s;

  &:disabled {
    opacity: 0.5;
  }

  &:enabled:hover {
    opacity: 1;
    color: rgba(144, 144, 144, 1);
  }

  &::before {
    content: "";
    border-radius: 100%;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    transform: scale(0.85);
    transition: all 0.16s;
    z-index: -1;
    background-color: rgba(144, 144, 144, 0);
  }

  &:enabled:hover::before {
    transform: scale(1);
    background-color: rgba(144, 144, 144, 0.2);
  }
`
