import type { Point, Stroke } from './types'

/** Draw black redaction strokes in page PDF-user-space coords onto a canvas. */
export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  pageW: number,
  pageH: number,
  canvasW: number,
  canvasH: number,
): void {
  if (!strokes.length) return
  const sx = canvasW / pageW
  const sy = canvasH / pageH
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#000000'
  for (const stroke of strokes) {
    if (!stroke.points.length) continue
    const width = Math.max(1, stroke.radius * 2 * sx)
    ctx.lineWidth = width
    ctx.beginPath()
    for (let p = 0; p < stroke.points.length; p++) {
      const x = stroke.points[p].x * sx
      const y = stroke.points[p].y * sy
      if (p === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    if (stroke.points.length === 1) {
      ctx.beginPath()
      ctx.arc(
        stroke.points[0].x * sx,
        stroke.points[0].y * sy,
        width / 2,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }
  ctx.restore()
}

export function paintInk(
  ink: HTMLCanvasElement,
  strokes: Stroke[],
  liveStroke: Stroke | null,
  pageW: number,
  pageH: number,
): void {
  const ctx = ink.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, ink.width, ink.height)
  const all = liveStroke ? strokes.concat([liveStroke]) : strokes
  drawStrokes(ctx, all, pageW, pageH, ink.width, ink.height)
}

export function pointFromPointer(
  e: PointerEvent,
  ink: HTMLCanvasElement,
  pageW: number,
  pageH: number,
): Point {
  const rect = ink.getBoundingClientRect()
  let x = ((e.clientX - rect.left) / rect.width) * pageW
  let y = ((e.clientY - rect.top) / rect.height) * pageH
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x > pageW) x = pageW
  if (y > pageH) y = pageH
  return { x, y }
}

export function markCount(
  pages: { strokes: Stroke[]; liveStroke: Stroke | null }[],
): number {
  let n = 0
  for (const page of pages) {
    n += page.strokes.length
    if (page.liveStroke) n += 1
  }
  return n
}

export function commitLiveStrokes(
  pages: { strokes: Stroke[]; liveStroke: Stroke | null; ink: HTMLCanvasElement | null; width: number; height: number }[],
): void {
  for (const state of pages) {
    if (!state.liveStroke) continue
    state.strokes.push(state.liveStroke)
    state.liveStroke = null
    if (state.ink) {
      paintInk(state.ink, state.strokes, null, state.width, state.height)
    }
  }
}
