import {
  InvalidFileError,
  isPPTXError,
  loadPresentation,
  type LoadedPresentation,
} from 'pptx-viewer'

export type PptLoadOk = {
  ok: true
  presentation: LoadedPresentation
  slideCount: number
}

export type PptLoadErr = {
  ok: false
  code: 'bad_type' | 'legacy_ppt' | 'invalid' | 'empty' | 'unknown'
  detail?: string
}

export type PptLoadResult = PptLoadOk | PptLoadErr

const PPTX_EXT = /\.pptx$/i
const PPT_EXT = /\.ppt$/i

/** MIME types browsers may report for OOXML presentations. */
const PPTX_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pptx',
])

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function isPptxFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (PPTX_EXT.test(name)) return true
  if (file.type && PPTX_MIME.has(file.type)) return true
  return false
}

export function isLegacyPptFile(file: File): boolean {
  const name = file.name.toLowerCase()
  // Legacy .ppt is OLE compound — not a zip. Reject bare .ppt that is not .pptx.
  return PPT_EXT.test(name) && !PPTX_EXT.test(name)
}

export async function loadPptxFromFile(file: File): Promise<PptLoadResult> {
  if (isLegacyPptFile(file)) {
    return { ok: false, code: 'legacy_ppt' }
  }
  if (!isPptxFile(file)) {
    return { ok: false, code: 'bad_type' }
  }

  try {
    const presentation = await loadPresentation(file)
    const slideCount = presentation.slides.length
    if (slideCount === 0) {
      presentation.cleanup()
      return { ok: false, code: 'empty' }
    }
    return { ok: true, presentation, slideCount }
  } catch (err) {
    if (err instanceof InvalidFileError || isPPTXError(err)) {
      return {
        ok: false,
        code: 'invalid',
        detail: err instanceof Error ? err.message : undefined,
      }
    }
    return {
      ok: false,
      code: 'unknown',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}
