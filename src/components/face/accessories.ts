import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import bunnyEarsUrl from '../../assets/face-accessories/bunny-ears.svg'
import mustacheUrl from '../../assets/face-accessories/mustache.svg'
import santaHatUrl from '../../assets/face-accessories/santa-hat.svg'
import sunglassesUrl from '../../assets/face-accessories/sunglasses.svg'

/** Comic-style face accessories that can be multi-selected. */
export type AccessoryId = 'santa-hat' | 'sunglasses' | 'mustache' | 'bunny-ears'

export const ACCESSORY_IDS: readonly AccessoryId[] = [
  'santa-hat',
  'sunglasses',
  'mustache',
  'bunny-ears',
] as const

const ASSET_URLS: Record<AccessoryId, string> = {
  'santa-hat': santaHatUrl,
  sunglasses: sunglassesUrl,
  mustache: mustacheUrl,
  'bunny-ears': bunnyEarsUrl,
}

/** MediaPipe Face Mesh landmark indices used for anchoring. */
const LM = {
  forehead: 10,
  noseBridge: 168,
  noseTip: 1,
  underNose: 2,
  upperLip: 13,
  // Person's right / left eye outer & inner (image coords).
  rightEyeOuter: 33,
  rightEyeInner: 133,
  leftEyeInner: 362,
  leftEyeOuter: 263,
  rightCheek: 234,
  leftCheek: 454,
  mouthRight: 61,
  mouthLeft: 291,
} as const

type Pt = { x: number; y: number }

function lm(landmarks: NormalizedLandmark[], i: number, w: number, h: number): Pt {
  const p = landmarks[i]
  return { x: p.x * w, y: p.y * h }
}

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function angle(a: Pt, b: Pt): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

type LoadedImage = HTMLImageElement | null

const imageCache = new Map<AccessoryId, LoadedImage>()
const loadPromises = new Map<AccessoryId, Promise<LoadedImage>>()

function loadAccessoryImage(id: AccessoryId): Promise<LoadedImage> {
  const existing = loadPromises.get(id)
  if (existing) return existing

  const promise = new Promise<LoadedImage>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      imageCache.set(id, img)
      resolve(img)
    }
    img.onerror = () => {
      imageCache.set(id, null)
      resolve(null)
    }
    img.src = ASSET_URLS[id]
  })
  loadPromises.set(id, promise)
  return promise
}

/** Prefetch all accessory SVGs once; failed loads stay null (no throw). */
export function preloadAccessoryImages(
  ids: readonly AccessoryId[] = ACCESSORY_IDS,
): Promise<void> {
  return Promise.all(ids.map((id) => loadAccessoryImage(id))).then(() => undefined)
}

function drawAnchored(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  drawW: number,
  drawH: number,
  rot: number,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  ctx.restore()
}

function faceWidthPx(landmarks: NormalizedLandmark[], w: number, h: number): number {
  return dist(lm(landmarks, LM.rightCheek, w, h), lm(landmarks, LM.leftCheek, w, h))
}

function eyeLineAngle(landmarks: NormalizedLandmark[], w: number, h: number): number {
  return angle(
    lm(landmarks, LM.rightEyeOuter, w, h),
    lm(landmarks, LM.leftEyeOuter, w, h),
  )
}

function drawSantaHat(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  const forehead = lm(landmarks, LM.forehead, w, h)
  const fw = faceWidthPx(landmarks, w, h)
  const rot = eyeLineAngle(landmarks, w, h)
  const drawW = fw * 1.45
  const aspect = img.naturalHeight / Math.max(1, img.naturalWidth)
  const drawH = drawW * aspect
  // Brim sits on forehead; shift up along face-up (perpendicular to eye line).
  const upX = Math.sin(rot)
  const upY = -Math.cos(rot)
  const cx = forehead.x + upX * drawH * 0.28
  const cy = forehead.y + upY * drawH * 0.28
  drawAnchored(ctx, img, cx, cy, drawW, drawH, rot)
}

function drawSunglasses(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  const outerR = lm(landmarks, LM.rightEyeOuter, w, h)
  const outerL = lm(landmarks, LM.leftEyeOuter, w, h)
  const bridge = lm(landmarks, LM.noseBridge, w, h)
  const eyeMid = mid(outerR, outerL)
  // Bias slightly toward nose bridge so lenses sit on eyes.
  const cx = eyeMid.x * 0.65 + bridge.x * 0.35
  const cy = eyeMid.y * 0.75 + bridge.y * 0.25
  const iod = dist(outerR, outerL)
  const rot = angle(outerR, outerL)
  const drawW = iod * 2.15
  const aspect = img.naturalHeight / Math.max(1, img.naturalWidth)
  const drawH = drawW * aspect
  drawAnchored(ctx, img, cx, cy, drawW, drawH, rot)
}

function drawMustache(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  const under = lm(landmarks, LM.underNose, w, h)
  const lip = lm(landmarks, LM.upperLip, w, h)
  const mouthR = lm(landmarks, LM.mouthRight, w, h)
  const mouthL = lm(landmarks, LM.mouthLeft, w, h)
  const cx = (under.x + lip.x) / 2
  const cy = under.y * 0.55 + lip.y * 0.45
  const fw = faceWidthPx(landmarks, w, h)
  const rot = angle(mouthR, mouthL)
  const drawW = fw * 0.55
  const aspect = img.naturalHeight / Math.max(1, img.naturalWidth)
  const drawH = drawW * aspect
  drawAnchored(ctx, img, cx, cy, drawW, drawH, rot)
}

function drawBunnyEars(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  const forehead = lm(landmarks, LM.forehead, w, h)
  const fw = faceWidthPx(landmarks, w, h)
  const rot = eyeLineAngle(landmarks, w, h)
  const drawW = fw * 1.55
  const aspect = img.naturalHeight / Math.max(1, img.naturalWidth)
  const drawH = drawW * aspect
  const upX = Math.sin(rot)
  const upY = -Math.cos(rot)
  // Sit above the forehead so ears stick up.
  const cx = forehead.x + upX * drawH * 0.42
  const cy = forehead.y + upY * drawH * 0.42
  drawAnchored(ctx, img, cx, cy, drawW, drawH, rot)
}

/**
 * Draw enabled accessories for one face.
 * Images are loaded once; missing/failed assets are skipped silently.
 * Drawing uses the same (non-CSS-mirrored) landmark space as the video;
 * the shared `scaleX(-1)` wrapper keeps selfie alignment.
 */
export function drawFaceAccessories(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  enabled: ReadonlySet<AccessoryId> | readonly AccessoryId[],
): void {
  if (landmarks.length < 468) return
  const set =
    enabled instanceof Set ? enabled : new Set<AccessoryId>(enabled)
  if (set.size === 0) return

  // Kick off loads for any not yet requested (non-blocking).
  for (const id of set) {
    if (!imageCache.has(id) && !loadPromises.has(id)) {
      void loadAccessoryImage(id)
    }
  }

  const drawers: Record<
    AccessoryId,
    (
      c: CanvasRenderingContext2D,
      lmks: NormalizedLandmark[],
      w: number,
      h: number,
      img: HTMLImageElement,
    ) => void
  > = {
    'santa-hat': drawSantaHat,
    sunglasses: drawSunglasses,
    mustache: drawMustache,
    'bunny-ears': drawBunnyEars,
  }

  // Draw order: ears/hat behind glasses/mustache.
  const order: AccessoryId[] = [
    'bunny-ears',
    'santa-hat',
    'sunglasses',
    'mustache',
  ]
  for (const id of order) {
    if (!set.has(id)) continue
    const img = imageCache.get(id)
    if (!img || !img.complete || img.naturalWidth === 0) continue
    drawers[id](ctx, landmarks, width, height, img)
  }
}
