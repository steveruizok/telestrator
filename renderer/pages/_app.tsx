import styled from "styled-components"
import GlobalStyles from "../styles/globals"

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
