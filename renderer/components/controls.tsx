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
      <Button disabled={!canUndo} onClick={() => state.send("UNDO")}>
        <CornerUpLeft />
      </Button>
      <Button disabled={!canRedo} onClick={() => state.send("REDO")}>
        <CornerUpRight />
      </Button>
      <IconButton
        color={state.whenIn({ pencil: "accent", eraser: "text" })}
        onClick={() => state.send("SELECTED_PENCIL")}
      >
        <Edit2 size={24} />
      </IconButton>
      <IconButton
        color={state.whenIn({ pencil: "text", eraser: "accent" })}
        onClick={() => state.send("SELECTED_ERASER")}
        onDoubleClick={() => state.send("CLEARED_MARKS")}
      >
        <MinusCircle size={24} />
      </IconButton>
      <IconButton
        onPointerEnter={() => state.send("ENTERED_DRAGGING")}
        onPointerLeave={() => state.send("LEFT_DRAGGING")}
        onPointerDown={() => state.send("STARTED_DRAGGING")}
        onPointerUp={() => state.send("STOPPED_DRAGGING")}
      >
        <Move size={24} />
      </IconButton>
      <IconButton onClick={() => state.send("DEACTIVATED")}>
        <X size={24} />
      </IconButton>
    </ControlsContainer>
  )
}

const ControlsContainer = styled.div<{ showActive: boolean }>`
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
  transition: opacity 0.2s;
  :hover {
    opacity: 1;
  }
`

const ColorButton = styled.button<{ color: string }>`
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
    transform: scale(0.2);
    transition: transform 0.12s;
  }

  &:hover:after {
    transform: scale(1);
  }
`

const SizeButton = styled.button<{
  isSelected: boolean
  size: number
  color: string
}>`
  border: none;
  height: 100%;
  width: 100%;
  padding: 0;
  font-weight: bold;
  cursor: pointer;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: background-color 0.12s;
  border-radius: 100%;
  opacity: ${({ isSelected }) => (isSelected ? "1" : ".5")};

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  &::after {
    content: "";
    display: block;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    height: 100%;
    width: 100%;
    height: ${({ size }) => size}px;
    width: ${({ size }) => size}px;
  }

  &:hover:after {
    transform: scale(1);
    background-color: ${({ color }) => color};
  }
`

const Button = styled.button`
  outline: none;
  border-radius: 100%;
  border: none;
  padding: 0;
  font-weight: bold;
  cursor: pointer;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.6);
    color: #000;
  }

  &:disabled {
    opacity: 0.5;
  }
`

const IconButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
`
