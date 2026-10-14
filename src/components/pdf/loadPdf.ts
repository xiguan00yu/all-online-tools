import type { PDFDocumentProxy } from 'pdfjs-dist'
import { CMAP_URL, STANDARD_FONT_URL } from './constants'
import { ensurePdfjs } from './pdfjsSetup'
import type { PageState } from './types'

export type LoadPdfResult = {
  pdf: PDFDocumentProxy
  pages: PageState[]
  originalBytes: Uint8Array
}

export async function loadPdfFromBytes(
  bytes: Uint8Array,
): Promise<LoadPdfResult> {
  const pdfjs = ensurePdfjs()
  const data = bytes.slice(0)
  const task = pdfjs.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_URL,
    disableRange: true,
    disableStream: true,
  })
  const pdf = await task.promise
  if (!pdf.numPages) {
    throw new Error('empty')
  }
  const pages: PageState[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const pdfPage = await pdf.getPage(i)
    const base = pdfPage.getViewport({ scale: 1 })
    pages.push({
      index: i - 1,
      pdfPage,
      width: base.width,
      height: base.height,
      strokes: [],
      liveStroke: null,
      ink: null,
    })
  }
  return { pdf, pages, originalBytes: bytes }
}

export function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (!(result instanceof ArrayBuffer)) {
        reject(new Error('load'))
        return
      }
      resolve(new Uint8Array(result))
    }
    reader.onerror = () => reject(new Error('load'))
    reader.readAsArrayBuffer(file)
  })
}
