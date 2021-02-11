import { useEffect, useState } from "react"
import styled from "styled-components"
import GlobalStyles from "../styles/globals"
import electron from "electron"

function MyApp({ Component, pageProps }) {
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

const RestoreFocus = styled.div<{ isClickable: boolean }>`
  width: 48px;
  position: absolute;
  left: 0px;
  top: 0px;
  height: 100%;
  background-color: ${({ isClickable }) =>
    isClickable ? "green" : "rgba(0,0,0,.5)"};
  z-index: 999;
`
