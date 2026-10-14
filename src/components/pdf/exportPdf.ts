import { PDFDocument } from 'pdf-lib'
import Pica from 'pica'
import {
  EXPORT_ATTEMPTS,
  EXPORT_MAX_EDGE,
  EXPORT_RENDER_EDGE,
  MAX_EXPORT_BYTES,
  PICA_RESIZE,
} from './constants'
import { commitLiveStrokes, drawStrokes, markCount } from './ink'
import type { PageState } from './types'

export type ExportProgress = {
  step: string
  page?: number
  pages?: number
  bytes?: number
  quality?: number
  index?: number
  scale?: number
  maxBytes?: number
  marks?: number
}

export type ExportResult =
  | { kind: 'original' }
  | { kind: 'pdf'; bytes: Uint8Array }
  | { kind: 'too-large'; bytes: number }
  | { kind: 'error'; message: string }

let picaResizer: ReturnType<typeof Pica> | null = null
let picaJsOnly = false

function createPica(
  features: Array<'js' | 'wasm' | 'ww' | 'cib' | 'all'>,
): ReturnType<typeof Pica> | null {
  try {
    return Pica({ features })
  } catch {
    return null
  }
}

function getPica(): ReturnType<typeof Pica> | null {
  if (picaResizer) return picaResizer
  if (picaJsOnly) return null
  picaResizer = createPica(['js', 'wasm'])
  if (!picaResizer) picaJsOnly = true
  return picaResizer
}

async function resizeWithPica(
  hi: HTMLCanvasElement,
  canvas: HTMLCanvasElement,
): Promise<boolean> {
  const resizer = getPica()
  if (!resizer) return false
  try {
    await resizer.resize(hi, canvas, PICA_RESIZE)
    return true
  } catch {
    picaResizer = null
    if (picaJsOnly) return false
    picaJsOnly = true
    picaResizer = createPica(['js'])
    if (!picaResizer) return false
    try {
      await picaResizer.resize(hi, canvas, PICA_RESIZE)
      return true
    } catch {
      picaResizer = null
      return false
    }
  }
}

async function downscaleCanvas(
  hi: HTMLCanvasElement,
  outW: number,
  outH: number,
  onProgress?: (p: ExportProgress) => void,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const usedPica = await resizeWithPica(hi, canvas)
  if (!usedPica) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outW, outH)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(hi, 0, 0, outW, outH)
    }
  }
  onProgress?.({
    step: usedPica ? 'export: pica resize' : 'export: canvas resize',
  })
  return canvas
}

function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer))
    }
    reader.onerror = () => reject(new Error('encode'))
    reader.readAsArrayBuffer(blob)
  })
}

function canvasToBytesNative(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      try {
        const url = canvas.toDataURL(type, quality)
        const comma = url.indexOf(',')
        const b64 = url.slice(comma + 1)
        const bin = atob(b64)
        const out = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
        resolve(out)
      } catch (err) {
        reject(err)
      }
      return
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('encode'))
          return
        }
        blobToBytes(blob).then(resolve).catch(reject)
      },
      type,
      quality,
    )
  })
}

async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Uint8Array> {
  const resizer = getPica()
  if (resizer && typeof resizer.toBlob === 'function') {
    try {
      const blob = await resizer.toBlob(canvas, type, quality)
      return blobToBytes(blob)
    } catch {
      return canvasToBytesNative(canvas, type, quality)
    }
  }
  return canvasToBytesNative(canvas, type, quality)
}

async function renderPageCanvas(
  state: PageState,
  scale: number,
): Promise<HTMLCanvasElement | null> {
  const viewport = state.pdfPage.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await state.pdfPage.render({ canvasContext: ctx, viewport }).promise
  drawStrokes(
    ctx,
    state.strokes,
    state.width,
    state.height,
    canvas.width,
    canvas.height,
  )
  return canvas
}

async function renderExportPage(
  state: PageState,
  scale: number,
  quality: number,
  onProgress?: (p: ExportProgress) => void,
): Promise<Uint8Array> {
  const longest = Math.max(state.width, state.height)
  let outputScale = scale
  if (longest * outputScale > EXPORT_MAX_EDGE) {
    outputScale = EXPORT_MAX_EDGE / longest
  }
  const outW = Math.max(1, Math.floor(state.width * outputScale))
  const outH = Math.max(1, Math.floor(state.height * outputScale))
  let boost = 2
  const outEdge = Math.max(outW, outH)
  if (outEdge * boost > EXPORT_RENDER_EDGE) boost = EXPORT_RENDER_EDGE / outEdge
  if (boost < 1.15) boost = 1
  let hi = await renderPageCanvas(state, outputScale * boost)
  if (!hi && boost > 1) {
    boost = 1
    hi = await renderPageCanvas(state, outputScale)
  }
  if (!hi) throw new Error('encode')
  let canvas = hi
  if (boost > 1) {
    canvas = await downscaleCanvas(hi, outW, outH, onProgress)
    hi.width = 0
    hi.height = 0
  }
  const bytes = await canvasToBytes(canvas, 'image/jpeg', quality)
  canvas.width = 0
  canvas.height = 0
  return bytes
}

async function buildPdf(
  pages: PageState[],
  originalBytes: Uint8Array | null,
  scale: number,
  quality: number,
  onProgress?: (p: ExportProgress) => void,
): Promise<Uint8Array> {
  let src: PDFDocument | null = null
  if (originalBytes) {
    try {
      src = await PDFDocument.load(originalBytes)
    } catch {
      src = null
    }
  }
  const doc = await PDFDocument.create()
  let cleanIndexes: number[] = []
  // Copying the single unmarked page of a 2-page PDF can drop its content.
  // Draw both pages from the preview instead.
  if (pages.length === 2) {
    onProgress?.({ step: 'export: rasterize two page pdf' })
  } else if (src && src.getPageCount() === pages.length) {
    for (let n = 0; n < pages.length; n++) {
      if (!pages[n].strokes.length) cleanIndexes.push(n)
    }
  }
  let copiedPages: Awaited<ReturnType<PDFDocument['copyPages']>> = []
  if (cleanIndexes.length && src) {
    try {
      copiedPages = await doc.copyPages(src, cleanIndexes)
    } catch {
      copiedPages = []
      cleanIndexes = []
    }
  }
  let cleanCursor = 0
  for (let i = 0; i < pages.length; i++) {
    const state = pages[i]
    if (cleanCursor < copiedPages.length && cleanIndexes[cleanCursor] === i) {
      doc.addPage(copiedPages[cleanCursor])
      cleanCursor += 1
      onProgress?.({
        step: 'export: page original',
        page: i + 1,
        pages: pages.length,
      })
    } else {
      const jpg = await renderExportPage(state, scale, quality, onProgress)
      const image = await doc.embedJpg(jpg)
      const pdfPage = doc.addPage([state.width, state.height])
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: state.width,
        height: state.height,
      })
      onProgress?.({
        step: 'export: page jpeg',
        page: i + 1,
        pages: pages.length,
        bytes: jpg.byteLength,
        quality,
      })
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return doc.save()
}

/** Export: no marks → original; with marks → image PDF compressed ≤ MAX_EXPORT_BYTES. */
export async function exportRedactedPdf(
  pages: PageState[],
  originalBytes: Uint8Array | null,
  onProgress?: (p: ExportProgress) => void,
): Promise<ExportResult> {
  try {
    commitLiveStrokes(pages)
    const marks = markCount(pages)
    onProgress?.({
      step: 'export: start',
      marks,
      pages: pages.length,
    })
    if (marks === 0) {
      return { kind: 'original' }
    }
    let out: Uint8Array | null = null
    for (let i = 0; i < EXPORT_ATTEMPTS.length; i++) {
      const attempt = EXPORT_ATTEMPTS[i]
      onProgress?.({
        step: 'export: attempt',
        index: i,
        scale: attempt.scale,
        quality: attempt.quality,
      })
      out = await buildPdf(
        pages,
        originalBytes,
        attempt.scale,
        attempt.quality,
        onProgress,
      )
      onProgress?.({
        step: 'export: attempt done',
        index: i,
        bytes: out.byteLength,
        maxBytes: MAX_EXPORT_BYTES,
      })
      if (out.byteLength <= MAX_EXPORT_BYTES) break
    }
    if (!out || out.byteLength > MAX_EXPORT_BYTES) {
      return { kind: 'too-large', bytes: out?.byteLength ?? 0 }
    }
    return { kind: 'pdf', bytes: out }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'export failed'
    return { kind: 'error', message }
  }
}

/** Trigger a browser download for the given bytes. */
export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  mime = 'application/pdf',
): void {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportFilename(originalName: string | null, marked: boolean): string {
  const base = (originalName || 'document.pdf').replace(/\.pdf$/i, '') || 'document'
  return marked ? `${base}-redacted.pdf` : `${base}.pdf`
}
