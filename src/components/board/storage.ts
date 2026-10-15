import type { Snapshot } from '@quickdrawjs/core'
import { BOARD_STORAGE_KEY } from './constants'

export function loadStoredSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(BOARD_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSnapshot(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // QuotaExceeded or private mode — ignore; user can still export JSON.
  }
}

export function clearStoredSnapshot(): void {
  try {
    localStorage.removeItem(BOARD_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false
  const doc = (value as { document?: unknown }).document
  if (!doc || typeof doc !== 'object') return false
  const store = (doc as { store?: unknown }).store
  return !!store && typeof store === 'object'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  downloadBlob(blob, filename)
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
