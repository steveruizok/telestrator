import styled from "styled-components"
import GlobalStyles from "../styles/globals"
import usePointer from "hooks/usePointer"
import useKeyboardEvents from "hooks/useKeyboardEvents"

function MyApp({ Component, pageProps }) {
  useKeyboardEvents()
  usePointer()
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
