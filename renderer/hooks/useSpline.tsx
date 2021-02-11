import * as React from "react"

interface Point2 {
  x: number
  y: number
}

type State = {
  points: Point2[]
  spline: Point2[]
  path: Path2D
  looped: boolean
  segments: number
  splineLength: number
  segmentLengths: number[]
  getSplinePoint: (distance: number, looped: boolean) => Point2
  getSplineGradient: (distance: number, looped: boolean) => Point2
  getNormalizedOffset: (distance: number) => number
}

type Action =
  | {
      type: "SET_POINTS"
      points: Point2[]
    }
  | {
      type: "SET_LOOPED"
      looped: boolean
    }
  | {
      type: "SET_SEGMENTS"
      segments: number
    }
  | {
      type: "MOVE_POINT"
      index: number
      delta: { x: number; y: number }
    }

function init(arg: {
  points: Point2[]
  segments: number
  looped: boolean
}): State {
  const { points, looped, segments } = arg
  const stepSize = 1 / segments,
    pts = [...points],
    l = pts.length - 1

  // Duplicate first point
  pts.unshift(pts[0])

  // Get spline function
  const getSplinePoint = createGetSplinePoint(pts)

  // Get gradient function
  const getSplineGradient = createGetSplineGradient(pts)

  // Calculate spline points / segment lengths / total length
  let spline: Point2[] = []
  let splineLength = 0
  let segmentLengths = Array(points.length).fill(0)

  if (pts.length > 2) {
    let curr: Point2,
      prev = getSplinePoint(0, looped)

    for (let t = 0; t < l; t += stepSize) {
      curr = getSplinePoint(t, looped)

      length = Math.sqrt(
        (curr.x - prev.x) * (curr.x - prev.x) +
          (curr.y - prev.y) * (curr.y - prev.y)
      )

      spline.push(curr)
      segmentLengths[Math.floor(t)] += length
      splineLength += length

      prev = curr
    }

    spline = spline
  }

  // Get normalized offset

  const getNormalizedOffset = createGetNormalizedOffset(segmentLengths)

  // Calculate path
  let path = new Path2D()

  if (spline.length > 0) {
    path.moveTo(spline[0].x, spline[0].y)

    for (let point of spline) {
      path.lineTo(point.x, point.y)
    }
  }

  return {
    points,
    spline,
    splineLength,
    segmentLengths,
    path,
    looped,
    segments,
    getSplineGradient,
    getSplinePoint,
    getNormalizedOffset,
  }
}

function reducer(state: State, action: Action): State {
  const next = { ...state }

  switch (action.type) {
    case "SET_LOOPED": {
      next.looped = action.looped
      break
    }
    case "SET_POINTS": {
      next.points = action.points
      break
    }
    case "SET_SEGMENTS": {
      next.segments = action.segments
      break
    }
    case "MOVE_POINT": {
      const point = next.points[action.index]
      point.x += action.delta.x
      point.y += action.delta.y
      break
    }
  }

  return init({
    points: next.points,
    segments: next.segments,
    looped: next.looped,
  })
}

// Based on @Javidx9
// https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_Splines1.cpp
export function useSpline(points: Point2[], segments = 100, looped = false) {
  const [state, dispatch] = React.useReducer(
    reducer,
    {
      points,
      segments,
      looped,
    },
    init
  )

  const setPoints = React.useCallback(
    (points: Point2[]) => {
      dispatch({ type: "SET_POINTS", points })
    },
    [points, dispatch]
  )

  const movePoints = React.useCallback(
    (index: number, delta: Point2) => {
      dispatch({
        type: "MOVE_POINT",
        index,
        delta,
      })
    },
    [points, dispatch]
  )

  return [state, setPoints, movePoints] as const
}

function createGetSplinePoint(points: Point2[]) {
  return function getSplinePoint(distance: number, looped: boolean): Point2 {
    if (!points[0]) return { x: 0, y: 0 }

    let p0: number,
      p1: number,
      p2: number,
      p3: number,
      l = points.length,
      d = Math.trunc(distance),
      t = distance - d

    if (looped) {
      p1 = d
      p2 = (p1 + 1) % l
      p3 = (p2 + 1) % l
      p0 = p1 >= 1 ? p1 - 1 : l - 1
    } else {
      p1 = Math.min(d + 1, l - 1)
      p2 = Math.min(p1 + 1, l - 1)
      p3 = Math.min(p2 + 1, l - 1)
      p0 = p1 - 1
    }

    let tt = t * t,
      ttt = tt * t,
      q1 = -ttt + 2 * tt - t,
      q2 = 3 * ttt - 5 * tt + 2,
      q3 = -3 * ttt + 4 * tt + t,
      q4 = ttt - tt

    return {
      x:
        0.5 *
        (points[p0].x * q1 +
          points[p1].x * q2 +
          points[p2].x * q3 +
          points[p3].x * q4),
      y:
        0.5 *
        (points[p0].y * q1 +
          points[p1].y * q2 +
          points[p2].y * q3 +
          points[p3].y * q4),
    }
  }
}

function createGetSplineGradient(points: Point2[]) {
  return function getSplineGradient(distance: number, looped: boolean) {
    if (!points[0]) return { x: 0, y: 0 }

    let p0: number,
      p1: number,
      p2: number,
      p3: number,
      l = points.length,
      d = Math.trunc(distance),
      t = distance - d

    if (looped) {
      p1 = d
      p2 = (p1 + 1) % l
      p3 = (p2 + 1) % l
      p0 = p1 >= 1 ? p1 - 1 : l - 1
    } else {
      p1 = Math.min(d + 1, l - 1)
      p2 = Math.min(p1 + 1, l - 1)
      p3 = Math.min(p2 + 1, l - 1)
      p0 = p1 - 1
    }

    let tt = t * t,
      q1 = -3 * tt + 4 * t - 1,
      q2 = 9 * tt - 10 * t,
      q3 = -9 * tt + 8 * t + 1,
      q4 = 3 * tt - 2 * t

    return {
      x:
        0.5 *
        (points[p0].x * q1 +
          points[p1].x * q2 +
          points[p2].x * q3 +
          points[p3].x * q4),
      y:
        0.5 *
        (points[p0].y * q1 +
          points[p1].y * q2 +
          points[p2].y * q3 +
          points[p3].y * q4),
    }
  }
}

function createGetNormalizedOffset(lengths: number[]) {
  return function getNormalizedOffset(distance: number): number {
    let i = 0
    while (distance > lengths[i]) {
      distance -= lengths[i]
      i++
    }

    return i + distance / lengths[i]
  }
}
