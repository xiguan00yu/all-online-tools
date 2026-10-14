import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import { CMAP_URL, STANDARD_FONT_URL } from './constants'

let configured = false

/** Configure pdf.js worker once (Vite serves the worker as a URL asset). */
export function ensurePdfjs(): typeof pdfjsLib {
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    configured = true
  }
  return pdfjsLib
}

export { CMAP_URL, STANDARD_FONT_URL }
