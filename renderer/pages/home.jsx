import React from "react"
import Head from "next/head"
import Link from "next/link"
import Canvas from "components/canvas"
import Controls from "components/controls"

const Home = () => {
  return (
    <React.Fragment>
      <Canvas />
      <Controls />
    </React.Fragment>
  )
}

export default Home
