import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  createQuickdraw,
  type QuickdrawInstance,
  type Snapshot,
} from '@quickdrawjs/core'
import '@quickdrawjs/core/quickdraw.css'
import { BOARD_AUTOSAVE_MS } from './constants'
import {
  clearStoredSnapshot,
  downloadBlob,
  downloadJson,
  isSnapshot,
  loadStoredSnapshot,
  readJsonFile,
  saveSnapshot,
} from './storage'

export type QuickdrawBoardHandle = {
  exportJson: () => void
  importJsonFile: (file: File) => Promise<{ ok: true } | { ok: false; reason: 'invalid' | 'parse' }>
  exportPng: () => Promise<{ ok: true } | { ok: false; reason: 'empty' }>
  clearBoard: () => void
}

type Props = {
  className?: string
  onStatus?: (message: string) => void
  statusLabels?: {
    restored: string
    saved: string
    cleared: string
    imported: string
    exportedJson: string
    exportedPng: string
    emptyPng: string
    invalidJson: string
    parseFailed: string
  }
}

/**
 * Mounts @quickdrawjs/core into a host div. Autosaves getSnapshot() to
 * localStorage; restores on mount. Imperative API for import/export/clear.
 */
export const QuickdrawBoard = forwardRef<QuickdrawBoardHandle, Props>(
  function QuickdrawBoard({ className, onStatus, statusLabels }, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const instanceRef = useRef<QuickdrawInstance | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const labelsRef = useRef(statusLabels)
    const onStatusRef = useRef(onStatus)
    labelsRef.current = statusLabels
    onStatusRef.current = onStatus

    useImperativeHandle(ref, () => ({
      exportJson() {
        const editor = instanceRef.current?.editor
        if (!editor) return
        const snap = editor.store.getSnapshot()
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
        downloadJson(snap, `whiteboard-${stamp}.json`)
        onStatusRef.current?.(labelsRef.current?.exportedJson ?? 'Exported JSON')
      },
      async importJsonFile(file: File) {
        const editor = instanceRef.current?.editor
        if (!editor) return { ok: false as const, reason: 'parse' as const }
        try {
          const parsed = await readJsonFile(file)
          if (!isSnapshot(parsed)) {
            onStatusRef.current?.(labelsRef.current?.invalidJson ?? 'Invalid JSON')
            return { ok: false as const, reason: 'invalid' as const }
          }
          editor.store.loadSnapshot(parsed, 'remote')
          saveSnapshot(parsed)
          try {
            editor.fitContent({ animate: 0 })
          } catch {
            // empty board — fine
          }
          onStatusRef.current?.(labelsRef.current?.imported ?? 'Imported')
          return { ok: true as const }
        } catch {
          onStatusRef.current?.(labelsRef.current?.parseFailed ?? 'Parse failed')
          return { ok: false as const, reason: 'parse' as const }
        }
      },
      async exportPng() {
        const editor = instanceRef.current?.editor
        if (!editor) return { ok: false as const, reason: 'empty' as const }
        const blob = await editor.exportImage({ background: true, scale: 2 })
        if (!blob) {
          onStatusRef.current?.(labelsRef.current?.emptyPng ?? 'Empty')
          return { ok: false as const, reason: 'empty' as const }
        }
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
        downloadBlob(blob, `whiteboard-${stamp}.png`)
        onStatusRef.current?.(labelsRef.current?.exportedPng ?? 'Exported PNG')
        return { ok: true as const }
      },
      clearBoard() {
        const editor = instanceRef.current?.editor
        if (!editor) return
        editor.clearBoard()
        clearStoredSnapshot()
        saveSnapshot(editor.store.getSnapshot())
        onStatusRef.current?.(labelsRef.current?.cleared ?? 'Cleared')
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      const board = createQuickdraw({
        container: host,
        theme: 'dark',
        grid: 'dots',
        watermark: false,
        themeToggle: false,
        // Keep stock toolbar (pen / shapes / text / pan) — mobile touch is built-in.
      })
      instanceRef.current = board

      const saved = loadStoredSnapshot()
      if (saved) {
        board.editor.store.loadSnapshot(saved, 'remote')
        try {
          board.editor.fitContent({ animate: 0 })
        } catch {
          // empty / degenerate — ignore
        }
        onStatusRef.current?.(labelsRef.current?.restored ?? 'Restored')
      }

      const unlisten = board.editor.store.listen(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          const snap: Snapshot = board.editor.store.getSnapshot()
          saveSnapshot(snap)
        }, BOARD_AUTOSAVE_MS)
      })

      // Ensure canvas sizes to the host after layout.
      requestAnimationFrame(() => {
        board.editor.resize()
      })

      const ro = new ResizeObserver(() => {
        board.editor.resize()
      })
      ro.observe(host)

      return () => {
        unlisten()
        ro.disconnect()
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        // Flush latest snapshot before destroy.
        try {
          saveSnapshot(board.editor.store.getSnapshot())
        } catch {
          // ignore
        }
        board.destroy()
        instanceRef.current = null
      }
    }, [])

    return (
      <div
        ref={hostRef}
        className={className}
        style={{ width: '100%', height: '100%', minHeight: 0, touchAction: 'none' }}
      />
    )
  },
)
