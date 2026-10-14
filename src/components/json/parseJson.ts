/** Result of attempting to parse JSON text. */
export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonParseError }

export type JsonParseError = {
  message: string
  /** 0-based character offset when the engine reports one. */
  position: number | null
  /** 1-based line when position is known. */
  line: number | null
  /** 1-based column when position is known. */
  column: number | null
  /** Optional JSON Pointer-ish path if recoverable (usually null for SyntaxError). */
  path: string | null
}

/**
 * Parse JSON text with a readable error (message + position/line/column when possible).
 * Uses native JSON.parse — no extra deps.
 */
export function parseJson(text: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      ok: false,
      error: {
        message: '输入为空',
        position: null,
        line: null,
        column: null,
        path: null,
      },
    }
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch (err) {
    const error = enrichLineColFromMessage(normalizeParseError(err, text), text)
    return { ok: false, error }
  }
}

function normalizeParseError(err: unknown, source: string): JsonParseError {
  const message =
    err instanceof Error && err.message
      ? err.message
      : 'JSON 解析失败'

  const position = extractPosition(message, err)
  const loc = position != null ? offsetToLineCol(source, position) : null

  return {
    message,
    position,
    line: loc?.line ?? null,
    column: loc?.column ?? null,
    path: null,
  }
}

/** Pull a character index out of SyntaxError.message when present (V8/Chromium). */
function extractPosition(message: string, _err: unknown): number | null {
  // V8 / Chromium: "... in JSON at position 42"
  const atPos = message.match(/position\s+(\d+)/i)
  if (atPos) return Number(atPos[1])
  // Firefox-style "line N column M" has no absolute offset; enrichLineColFromMessage handles it.
  return null
}

/** Convert 0-based offset into 1-based line/column. */
export function offsetToLineCol(
  source: string,
  offset: number,
): { line: number; column: number } {
  const safe = Math.max(0, Math.min(offset, source.length))
  let line = 1
  let column = 1
  for (let i = 0; i < safe; i++) {
    if (source[i] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  return { line, column }
}

/**
 * Enrich errors that only report "line N column M" (no absolute position)
 * so callers still get line/column.
 */
export function enrichLineColFromMessage(
  error: JsonParseError,
  _source: string,
): JsonParseError {
  if (error.line != null && error.column != null) return error
  const m = error.message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (!m) return error
  return {
    ...error,
    line: Number(m[1]),
    column: Number(m[2]),
  }
}

export function formatJson(value: unknown, space = 2): string {
  return JSON.stringify(value, null, space)
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value)
}

export function formatParseError(error: JsonParseError): string {
  const parts = [error.message]
  if (error.line != null && error.column != null) {
    parts.push(`行 ${error.line}，列 ${error.column}`)
  } else if (error.position != null) {
    parts.push(`位置 ${error.position}`)
  }
  if (error.path) {
    parts.push(`路径 ${error.path}`)
  }
  return parts.join(' · ')
}
