import type { PDFPageProxy } from 'pdfjs-dist'

export type PreviewMode = 'browse' | 'draw'

export type Point = { x: number; y: number }

export type Stroke = {
  radius: number
  points: Point[]
}

export type PageState = {
  index: number
  pdfPage: PDFPageProxy
  width: number
  height: number
  strokes: Stroke[]
  liveStroke: Stroke | null
  /** Ink canvas element for the current layout pass. */
  ink: HTMLCanvasElement | null
}

export type ZoomInfo = {
  scale: number
  index: number
  total: number
}
