export function getSvgPathFromStroke(stroke: number[][]) {
  const d: string[] = []

  let [p0, p1] = stroke

  d.push(`M ${p0[0]} ${p0[1]} Q`)

  for (let i = 1; i < stroke.length; i++) {
    const mpx = p0[0] + (p1[0] - p0[0]) / 2
    const mpy = p0[1] + (p1[1] - p0[1]) / 2
    d.push(`${p0[0]},${p0[1]} ${mpx},${mpy}`)
    p0 = p1
    p1 = stroke[i + 1]
  }

  d.push("Z")

  return d.join(" ")
}
