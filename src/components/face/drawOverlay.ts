import {
  DrawingUtils,
  FaceLandmarker,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import type { OverlayMode } from './constants'

function landmarksBounds(landmarks: NormalizedLandmark[]) {
  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  // Slight padding so the box sits outside facial contour.
  const padX = (maxX - minX) * 0.08
  const padY = (maxY - minY) * 0.1
  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    w: Math.min(1, maxX + padX) - Math.max(0, minX - padX),
    h: Math.min(1, maxY + padY) - Math.max(0, minY - padY),
  }
}

function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
) {
  const b = landmarksBounds(landmarks)
  const x = b.x * width
  const y = b.y * height
  const w = b.w * width
  const h = b.h * height

  ctx.save()
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) / 200))
  ctx.strokeRect(x, y, w, h)

  // Corner accents
  const len = Math.min(w, h) * 0.18
  ctx.strokeStyle = '#a3e635'
  ctx.beginPath()
  // TL
  ctx.moveTo(x, y + len)
  ctx.lineTo(x, y)
  ctx.lineTo(x + len, y)
  // TR
  ctx.moveTo(x + w - len, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + len)
  // BL
  ctx.moveTo(x, y + h - len)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x + len, y + h)
  // BR
  ctx.moveTo(x + w - len, y + h)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x + w, y + h - len)
  ctx.stroke()
  ctx.restore()
}

function drawMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
) {
  const drawingUtils = new DrawingUtils(ctx)
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_TESSELATION,
    { color: '#C0C0C070', lineWidth: 1 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    { color: '#FF3030', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
    { color: '#FF3030', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    { color: '#30FF30', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
    { color: '#30FF30', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    { color: '#E0E0E0', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
    color: '#E0E0E0',
    lineWidth: 1.5,
  })
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
    { color: '#FF3030', lineWidth: 1.5 },
  )
  drawingUtils.drawConnectors(
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
    { color: '#30FF30', lineWidth: 1.5 },
  )
  drawingUtils.drawLandmarks(landmarks, {
    color: '#22d3ee',
    fillColor: '#22d3ee88',
    radius: 0.8,
  })
}

export function drawFaceOverlay(
  ctx: CanvasRenderingContext2D,
  result: FaceLandmarkerResult | null,
  mode: OverlayMode,
  width: number,
  height: number,
): boolean {
  ctx.clearRect(0, 0, width, height)
  const faces = result?.faceLandmarks
  if (!faces || faces.length === 0) {
    return false
  }

  for (const landmarks of faces) {
    if (mode === 'box') {
      drawBoundingBox(ctx, landmarks, width, height)
    } else {
      drawMesh(ctx, landmarks)
    }
  }
  return true
}
