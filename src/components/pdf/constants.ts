/** Ported from pfm-app pdfPreviewHtml.ts — preview/export tuning constants. */

export const PDFJS_VERSION = '3.11.174'
const CDN = 'https://cdn.jsdelivr.net/npm'

/** pdf.js cmap / standard font assets (CDN; main libs are npm-bundled). */
export const CMAP_URL = `${CDN}/pdfjs-dist@${PDFJS_VERSION}/cmaps/`
export const STANDARD_FONT_URL = `${CDN}/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`

/** Soft cap for exported PDF size (match pfm upload limit). */
export const MAX_EXPORT_BYTES = 20 * 1024 * 1024

/** On-screen page canvas. Phones are often 3x; keep the long edge sharp when zoomed. */
export const PREVIEW_MAX_DPR = 3
export const PREVIEW_MAX_EDGE = 2880

/**
 * Marked pages flatten to JPEG. Unmarked pages copy from the original PDF.
 * scale 2.5 ≈ 180 DPI store; drawn larger then pica-downscaled with unsharp.
 */
export const EXPORT_MAX_EDGE = 2400
export const EXPORT_RENDER_EDGE = 4096
export const PICA_RESIZE = {
  filter: 'mks2013' as const,
  unsharpAmount: 140,
  unsharpRadius: 0.5,
  unsharpThreshold: 8,
}
export const EXPORT_ATTEMPTS = [
  { scale: 2.5, quality: 0.82 },
  { scale: 2, quality: 0.72 },
  { scale: 1.5, quality: 0.64 },
]

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const
export const DEFAULT_ZOOM_INDEX = 2
