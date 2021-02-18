import styled from "styled-components"
import Head from "next/head"
import GlobalStyles from "../styles/globals"
import usePointer from "hooks/usePointer"
import useWindowEvents from "hooks/useWindowEvents"
import useKeyboardEvents from "hooks/useKeyboardEvents"

function MyApp({ Component, pageProps }) {
  useKeyboardEvents()
  usePointer()
  useWindowEvents()
  return (
    <>
      <GlobalStyles />
      <WindowContainer>
        <Component {...pageProps} />
      </WindowContainer>
    </>
  )
}

export default MyApp

const WindowContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`
