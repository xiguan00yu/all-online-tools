/**
 * Structural JSON diff: walk two parsed values and report added / removed / changed
 * paths. Prefer this over a line-based text diff so key moves and nested edits
 * stay readable. No third-party diff library.
 */

export type DiffKind = 'added' | 'removed' | 'changed'

export type DiffEntry = {
  kind: DiffKind
  /** Dot / bracket path, e.g. `user.name` or `items[0].id`. Empty string = root. */
  path: string
  left?: unknown
  right?: unknown
}

export type DiffResult =
  | { ok: true; entries: DiffEntry[]; identical: boolean }
  | { ok: false; leftError?: string; rightError?: string }

function pathJoin(base: string, key: string | number): string {
  if (typeof key === 'number') {
    return base ? `${base}[${key}]` : `[${key}]`
  }
  if (!base) return key
  // Prefer bracket for keys that aren't simple identifiers
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${base}.${key}`
  return `${base}[${JSON.stringify(key)}]`
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function sameType(a: unknown, b: unknown): boolean {
  if (a === null || b === null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) return true
  if (isPlainObject(a) && isPlainObject(b)) return true
  return typeof a === typeof b
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (!sameType(a, b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length) return false
    return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
  }
  return false
}

function walk(left: unknown, right: unknown, path: string, out: DiffEntry[]): void {
  if (deepEqual(left, right)) return

  // Type mismatch or primitive change at this node
  if (
    !sameType(left, right) ||
    left === null ||
    right === null ||
    (typeof left !== 'object') ||
    (typeof right !== 'object')
  ) {
    out.push({ kind: 'changed', path: path || '(root)', left, right })
    return
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length)
    for (let i = 0; i < max; i++) {
      const p = pathJoin(path, i)
      if (i >= left.length) {
        out.push({ kind: 'added', path: p, right: right[i] })
      } else if (i >= right.length) {
        out.push({ kind: 'removed', path: p, left: left[i] })
      } else {
        walk(left[i], right[i], p, out)
      }
    }
    return
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of [...keys].sort()) {
      const p = pathJoin(path, key)
      const hasL = Object.prototype.hasOwnProperty.call(left, key)
      const hasR = Object.prototype.hasOwnProperty.call(right, key)
      if (!hasL) {
        out.push({ kind: 'added', path: p, right: right[key] })
      } else if (!hasR) {
        out.push({ kind: 'removed', path: p, left: left[key] })
      } else {
        walk(left[key], right[key], p, out)
      }
    }
  }
}

/** Compare two already-parsed JSON values. */
export function diffJsonValues(left: unknown, right: unknown): DiffEntry[] {
  const entries: DiffEntry[] = []
  walk(left, right, '', entries)
  return entries
}

/** Pretty preview of a value for the diff list (truncated). */
export function previewValue(value: unknown, max = 120): string {
  let s: string
  try {
    s = JSON.stringify(value)
  } catch {
    s = String(value)
  }
  if (s == null) s = 'null'
  if (s.length > max) return `${s.slice(0, max)}…`
  return s
}
