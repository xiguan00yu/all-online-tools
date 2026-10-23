import {
  formatParseError,
  parseJson,
  type JsonParseError,
} from '../json/parseJson'

/** Soft guidance: UI paginates; very large pastes may still be slow. */
export const JSONL_PAGE_SIZE = 100
/** Warn when raw text exceeds this many bytes. */
export const JSONL_WARN_BYTES = 5 * 1024 * 1024
/** Strong warn — still parse, but document that browsers may struggle. */
export const JSONL_SOFT_MAX_BYTES = 40 * 1024 * 1024
/** Soft line-count warn (pagination keeps list usable). */
export const JSONL_WARN_LINES = 10_000

export type JsonlRecord =
  | { line: number; kind: 'blank'; raw: string }
  | { line: number; kind: 'valid'; raw: string; value: unknown }
  | {
      line: number
      kind: 'invalid'
      raw: string
      error: JsonParseError
      errorText: string
    }

export type JsonlParseResult = {
  records: JsonlRecord[]
  total: number
  blank: number
  valid: number
  invalid: number
  /** Top-level key → count among valid object records. */
  keyFrequency: Record<string, number>
  objectCount: number
}

/**
 * Parse JSONL / NDJSON text: one complete JSON value per non-blank line.
 * Blank lines are tracked but not counted as valid/invalid.
 * Reuses native JSON.parse via parseJson helpers.
 */
export function parseJsonlLines(
  text: string,
  t?: (path: string, params?: Record<string, string | number>) => string,
): JsonlParseResult {
  // Keep trailing empty segment if file ends with newline — still blank.
  const rawLines = text.length === 0 ? [] : text.split(/\r?\n/)
  const records: JsonlRecord[] = []
  const keyFrequency: Record<string, number> = {}
  let blank = 0
  let valid = 0
  let invalid = 0
  let objectCount = 0

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i] ?? ''
    const line = i + 1
    if (raw.trim() === '') {
      blank += 1
      records.push({ line, kind: 'blank', raw })
      continue
    }
    const parsed = parseJson(raw)
    if (parsed.ok) {
      valid += 1
      records.push({ line, kind: 'valid', raw, value: parsed.value })
      if (
        parsed.value !== null &&
        typeof parsed.value === 'object' &&
        !Array.isArray(parsed.value)
      ) {
        objectCount += 1
        for (const key of Object.keys(parsed.value as object)) {
          keyFrequency[key] = (keyFrequency[key] ?? 0) + 1
        }
      }
    } else {
      invalid += 1
      records.push({
        line,
        kind: 'invalid',
        raw,
        error: parsed.error,
        errorText: formatParseError(parsed.error, t),
      })
    }
  }

  return {
    records,
    total: records.length,
    blank,
    valid,
    invalid,
    keyFrequency,
    objectCount,
  }
}

/** Keys that appear on at least `minRatio` of object records, sorted by frequency. */
export function heuristicTableKeys(
  keyFrequency: Record<string, number>,
  objectCount: number,
  opts?: { minRatio?: number; minObjects?: number; maxKeys?: number },
): string[] {
  const minRatio = opts?.minRatio ?? 0.5
  const minObjects = opts?.minObjects ?? 3
  const maxKeys = opts?.maxKeys ?? 12
  if (objectCount < minObjects) return []
  const threshold = Math.ceil(objectCount * minRatio)
  return Object.entries(keyFrequency)
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxKeys)
    .map(([k]) => k)
}

export function previewScalar(value: unknown, max = 80): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') {
    const s = JSON.stringify(value)
    return s.length > max ? `${s.slice(0, max - 1)}…` : s
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) return `Array(${value.length})`
  if (typeof value === 'object') {
    const n = Object.keys(value as object).length
    return `Object(${n})`
  }
  return String(value)
}

/** Compact one-JSON-per-line for valid records (selected or all). */
export function exportNormalizedJsonl(
  records: JsonlRecord[],
  lineFilter?: Set<number>,
): string {
  const lines: string[] = []
  for (const r of records) {
    if (r.kind !== 'valid') continue
    if (lineFilter && !lineFilter.has(r.line)) continue
    lines.push(JSON.stringify(r.value))
  }
  return lines.join('\n') + (lines.length ? '\n' : '')
}

/** Pretty multi-line dump (array of values, or one pretty block per record). */
export function exportPrettyDump(
  records: JsonlRecord[],
  lineFilter?: Set<number>,
): string {
  const parts: string[] = []
  for (const r of records) {
    if (r.kind !== 'valid') continue
    if (lineFilter && !lineFilter.has(r.line)) continue
    parts.push(`// line ${r.line}\n${JSON.stringify(r.value, null, 2)}`)
  }
  return parts.join('\n\n')
}

export function downloadText(filename: string, text: string, mime = 'application/jsonl') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Free-text + optional key/path filter. */
export function recordMatchesSearch(
  record: JsonlRecord,
  query: string,
  keyFilter: string,
): boolean {
  const q = query.trim().toLowerCase()
  const k = keyFilter.trim().toLowerCase()

  if (k) {
    if (record.kind !== 'valid') return false
    if (!valueHasKeyPath(record.value, k)) return false
  }

  if (!q) return true

  if (record.raw.toLowerCase().includes(q)) return true
  if (record.kind === 'invalid' && record.errorText.toLowerCase().includes(q)) {
    return true
  }
  if (record.kind === 'valid') {
    try {
      const s = JSON.stringify(record.value)
      if (s.toLowerCase().includes(q)) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

/** Case-insensitive: key name appears anywhere in the value tree, or dotted path prefix. */
function valueHasKeyPath(value: unknown, needle: string): boolean {
  if (needle.includes('.')) {
    const parts = needle.split('.').filter(Boolean)
    let cur: unknown = value
    for (const part of parts) {
      if (cur === null || typeof cur !== 'object') return false
      if (Array.isArray(cur)) {
        const idx = Number(part)
        if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return false
        cur = cur[idx]
      } else {
        const obj = cur as Record<string, unknown>
        const hit = Object.keys(obj).find((x) => x.toLowerCase() === part)
        if (!hit) return false
        cur = obj[hit]
      }
    }
    return true
  }

  return keyNameExists(value, needle)
}

function keyNameExists(value: unknown, needle: string, depth = 0): boolean {
  if (depth > 8 || value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) {
    return value.some((item) => keyNameExists(item, needle, depth + 1))
  }
  for (const [key, child] of Object.entries(value as object)) {
    if (key.toLowerCase().includes(needle)) return true
    if (keyNameExists(child, needle, depth + 1)) return true
  }
  return false
}
