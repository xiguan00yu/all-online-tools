import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  DEFAULT_ZOOM_INDEX,
  PREVIEW_MAX_DPR,
  PREVIEW_MAX_EDGE,
  ZOOM_LEVELS,
} from './constants'
import { markCount, paintInk, pointFromPointer } from './ink'
import type { PageState, PreviewMode, ZoomInfo } from './types'

export type PdfStageHandle = {
  undoStroke: () => void
  clearActivePage: () => void
  scrollToPage: (index: number) => void
  getPages: () => PageState[]
  getMarkCount: () => number
  getActiveIndex: () => number
  commitLive: () => void
}

type PdfStageProps = {
  pages: PageState[]
  mode: PreviewMode
  zoomIndex: number
  exporting: boolean
  onActivePageChange: (current: number, total: number) => void
  onMarksChange: (count: number) => void
  onZoomApplied?: (info: ZoomInfo) => void
}

function isCancelled(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; message?: string }
  const message = e.message ? String(e.message) : ''
  return (
    e.name === 'RenderingCancelledException' ||
    message.includes('Rendering cancelled')
  )
}

function fitWidth(stageEl: HTMLElement | null): number {
  const w = stageEl?.clientWidth ?? window.innerWidth
  return Math.max(1, w - 24)
}

export const PdfStage = forwardRef<PdfStageHandle, PdfStageProps>(
  function PdfStage(
    {
      pages,
      mode,
      zoomIndex,
      exporting,
      onActivePageChange,
      onMarksChange,
      onZoomApplied,
    },
    ref,
  ) {
    const stageRef = useRef<HTMLDivElement>(null)
    const pagesRef = useRef(pages)
    const modeRef = useRef(mode)
    const exportingRef = useRef(exporting)
    const activeIndexRef = useRef(0)
    const renderGenRef = useRef(0)
    const renderTasksRef = useRef<{ cancel: () => void }[]>([])
    const lastFitWRef = useRef(0)
    const downPointersRef = useRef<Record<number, true>>({})
    const observerRef = useRef<IntersectionObserver | null>(null)
    const zoomLayoutTimerRef = useRef(0)
    const resizeTimerRef = useRef(0)
    const [opened, setOpened] = useState(false)

    pagesRef.current = pages
    modeRef.current = mode
    exportingRef.current = exporting

    const currentZoom = useCallback(() => {
      return ZOOM_LEVELS[zoomIndex] ?? 1
    }, [zoomIndex])

    const pageCssWidth = useCallback(() => {
      return fitWidth(stageRef.current) * currentZoom()
    }, [currentZoom])

    const pointerDownCount = () => {
      let n = 0
      for (const _id in downPointersRef.current) n += 1
      return n
    }

    const clearLiveStrokes = useCallback(() => {
      for (const state of pagesRef.current) {
        if (!state.liveStroke) continue
        state.liveStroke = null
        if (state.ink) {
          paintInk(state.ink, state.strokes, null, state.width, state.height)
        }
      }
    }, [])

    const bindInk = useCallback(
      (state: PageState) => {
        const ink = state.ink
        if (!ink) return

        const onDown = (e: PointerEvent) => {
          if (modeRef.current !== 'draw' || exportingRef.current) return
          if (e.button != null && e.button !== 0) return
          if (pointerDownCount() > 1) return
          e.preventDefault()
          try {
            ink.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          activeIndexRef.current = state.index
          onActivePageChange(state.index + 1, pagesRef.current.length)
          const rect = ink.getBoundingClientRect()
          const radius =
            rect.width > 0 ? (8 / rect.width) * state.width : 8
          state.liveStroke = {
            radius,
            points: [pointFromPointer(e, ink, state.width, state.height)],
          }
          paintInk(
            ink,
            state.strokes,
            state.liveStroke,
            state.width,
            state.height,
          )
        }

        const onMove = (e: PointerEvent) => {
          if (!state.liveStroke || modeRef.current !== 'draw') return
          if (pointerDownCount() > 1) {
            state.liveStroke = null
            paintInk(ink, state.strokes, null, state.width, state.height)
            return
          }
          e.preventDefault()
          const next = pointFromPointer(e, ink, state.width, state.height)
          const pts = state.liveStroke.points
          const last = pts[pts.length - 1]
          const dx = next.x - last.x
          const dy = next.y - last.y
          if (dx * dx + dy * dy < 0.35) return
          pts.push(next)
          paintInk(
            ink,
            state.strokes,
            state.liveStroke,
            state.width,
            state.height,
          )
        }

        const endStroke = () => {
          if (!state.liveStroke) return
          state.strokes.push(state.liveStroke)
          state.liveStroke = null
          paintInk(ink, state.strokes, null, state.width, state.height)
          onMarksChange(markCount(pagesRef.current))
        }

        ink.addEventListener('pointerdown', onDown, { passive: false })
        ink.addEventListener('pointermove', onMove, { passive: false })
        ink.addEventListener('pointerup', endStroke)
        ink.addEventListener('pointercancel', endStroke)

        return () => {
          ink.removeEventListener('pointerdown', onDown)
          ink.removeEventListener('pointermove', onMove)
          ink.removeEventListener('pointerup', endStroke)
          ink.removeEventListener('pointercancel', endStroke)
        }
      },
      [onActivePageChange, onMarksChange],
    )

    const observePages = useCallback(() => {
      if (observerRef.current) observerRef.current.disconnect()
      if (typeof IntersectionObserver !== 'function') return
      observerRef.current = new IntersectionObserver(
        (entries) => {
          let best: IntersectionObserverEntry | null = null
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry
            }
          }
          if (!best) return
          const index = Number(
            (best.target as HTMLElement).getAttribute('data-index'),
          )
          if (!Number.isFinite(index)) return
          activeIndexRef.current = index
          onActivePageChange(index + 1, pagesRef.current.length)
        },
        { threshold: [0.35, 0.6] },
      )
      const nodes = stageRef.current?.querySelectorAll('.pdf-page')
      if (!nodes) return
      for (const node of nodes) observerRef.current.observe(node)
    }, [onActivePageChange])

    const cancelRenders = () => {
      for (const task of renderTasksRef.current) {
        try {
          task.cancel()
        } catch {
          /* ignore */
        }
      }
      renderTasksRef.current = []
    }

    const captureAnchor = () => {
      const stage = stageRef.current
      if (!stage) return null
      const width = Math.max(1, stage.scrollWidth)
      const height = Math.max(1, stage.scrollHeight)
      return {
        x: (stage.scrollLeft + stage.clientWidth / 2) / width,
        y: (stage.scrollTop + stage.clientHeight / 2) / height,
      }
    }

    const restoreAnchor = (anchor: { x: number; y: number } | null) => {
      const stage = stageRef.current
      if (!stage || !anchor) return
      let left = anchor.x * stage.scrollWidth - stage.clientWidth / 2
      let top = anchor.y * stage.scrollHeight - stage.clientHeight / 2
      if (left < 0) left = 0
      if (top < 0) top = 0
      stage.scrollTo(left, top)
    }

    const layoutPages = useCallback(async () => {
      const stage = stageRef.current
      if (!stage || !pagesRef.current.length) return
      const gen = ++renderGenRef.current
      cancelRenders()
      const progressive = !opened
      const holder = progressive ? stage : document.createElement('div')
      if (progressive) stage.innerHTML = ''
      const cssW = pageCssWidth()
      lastFitWRef.current = fitWidth(stage)
      const dpr = Math.min(window.devicePixelRatio || 1, PREVIEW_MAX_DPR)
      const unbinders: Array<() => void> = []

      for (let i = 0; i < pagesRef.current.length; i++) {
        if (gen !== renderGenRef.current) return
        const state = pagesRef.current[i]
        const cssScale = cssW / state.width
        const cssH = state.height * cssScale
        const longest = Math.max(cssW, cssH)
        let pixelRatio =
          longest > 0 ? Math.min(dpr, PREVIEW_MAX_EDGE / longest) : 1
        if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) pixelRatio = 1
        const viewport = state.pdfPage.getViewport({
          scale: cssScale * pixelRatio,
        })
        const wrap = document.createElement('div')
        wrap.className = 'pdf-page'
        wrap.id = `pdf-page-${i}`
        wrap.setAttribute('data-index', String(i))
        wrap.style.width = `${cssW}px`
        wrap.style.position = 'relative'
        wrap.style.margin = '0 auto 12px'
        wrap.style.background = '#ffffff'
        wrap.style.boxShadow = '0 1px 4px rgba(11, 17, 33, 0.35)'

        const sheet = document.createElement('canvas')
        sheet.className = 'pdf-sheet'
        sheet.width = Math.max(1, Math.floor(viewport.width))
        sheet.height = Math.max(1, Math.floor(viewport.height))
        sheet.style.width = `${cssW}px`
        sheet.style.height = `${cssH}px`
        sheet.style.display = 'block'
        sheet.style.touchAction = 'pan-x pan-y'

        const ink = document.createElement('canvas')
        ink.className = 'pdf-ink'
        ink.width = sheet.width
        ink.height = sheet.height
        ink.style.width = `${cssW}px`
        ink.style.height = `${cssH}px`
        ink.style.display = 'block'
        ink.style.position = 'absolute'
        ink.style.left = '0'
        ink.style.top = '0'
        ink.style.touchAction =
          modeRef.current === 'draw' ? 'none' : 'pan-x pan-y'
        ink.style.pointerEvents =
          modeRef.current === 'draw' ? 'auto' : 'none'

        wrap.appendChild(sheet)
        wrap.appendChild(ink)
        holder.appendChild(wrap)
        state.ink = ink

        const ctx = sheet.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, sheet.width, sheet.height)
          try {
            const task = state.pdfPage.render({
              canvasContext: ctx,
              viewport,
            })
            renderTasksRef.current.push(task)
            await task.promise
          } catch (err) {
            if (gen !== renderGenRef.current || isCancelled(err)) return
            continue
          }
        }
        if (gen !== renderGenRef.current) return
        const unbind = bindInk(state)
        if (unbind) unbinders.push(unbind)
        paintInk(ink, state.strokes, state.liveStroke, state.width, state.height)
        if (!opened) setOpened(true)
      }

      if (gen !== renderGenRef.current) return
      if (!progressive && Math.abs(cssW - pageCssWidth()) > 1) return
      if (!progressive) {
        const anchor = captureAnchor()
        stage.innerHTML = ''
        while (holder.firstChild) stage.appendChild(holder.firstChild)
        for (const state of pagesRef.current) {
          if (state.ink) {
            paintInk(
              state.ink,
              state.strokes,
              state.liveStroke,
              state.width,
              state.height,
            )
          }
        }
        restoreAnchor(anchor)
      }
      observePages()
      onActivePageChange(
        activeIndexRef.current + 1,
        pagesRef.current.length,
      )
      onZoomApplied?.({
        scale: currentZoom(),
        index: zoomIndex,
        total: ZOOM_LEVELS.length,
      })
    }, [
      bindInk,
      currentZoom,
      observePages,
      onActivePageChange,
      onZoomApplied,
      opened,
      pageCssWidth,
      zoomIndex,
    ])

    // Initial + pages change layout
    useEffect(() => {
      setOpened(false)
      activeIndexRef.current = 0
      void layoutPages()
      return () => {
        cancelRenders()
        if (observerRef.current) observerRef.current.disconnect()
      }
      // Intentionally only when pages identity changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pages])

    // Mode: update ink pointer-events / touch-action
    useEffect(() => {
      const stage = stageRef.current
      if (!stage) return
      const inks = stage.querySelectorAll<HTMLCanvasElement>('canvas.pdf-ink')
      for (const ink of inks) {
        ink.style.pointerEvents = mode === 'draw' ? 'auto' : 'none'
        ink.style.touchAction = mode === 'draw' ? 'none' : 'pan-x pan-y'
      }
      if (mode === 'draw') {
        stage.style.overflow = 'hidden'
        stage.style.touchAction = 'none'
      } else {
        stage.style.overflow = 'auto'
        stage.style.touchAction = 'pan-x pan-y'
      }
    }, [mode])

    // Zoom: CSS resize then re-render after debounce
    useEffect(() => {
      if (!pagesRef.current.length || !opened) return
      const cssW = pageCssWidth()
      const stage = stageRef.current
      if (!stage) return
      const anchor = captureAnchor()
      for (let i = 0; i < pagesRef.current.length; i++) {
        const state = pagesRef.current[i]
        const wrap = document.getElementById(`pdf-page-${i}`)
        if (!wrap) continue
        const cssH = state.height * (cssW / state.width)
        ;(wrap as HTMLElement).style.width = `${cssW}px`
        const canvases = wrap.querySelectorAll('canvas')
        for (const c of canvases) {
          ;(c as HTMLCanvasElement).style.width = `${cssW}px`
          ;(c as HTMLCanvasElement).style.height = `${cssH}px`
        }
      }
      restoreAnchor(anchor)
      onZoomApplied?.({
        scale: currentZoom(),
        index: zoomIndex,
        total: ZOOM_LEVELS.length,
      })
      window.clearTimeout(zoomLayoutTimerRef.current)
      zoomLayoutTimerRef.current = window.setTimeout(() => {
        if (!pagesRef.current.length || exportingRef.current) return
        void layoutPages()
      }, 180)
    }, [zoomIndex, currentZoom, layoutPages, onZoomApplied, opened, pageCssWidth])

    // Resize
    useEffect(() => {
      const onResize = () => {
        window.clearTimeout(resizeTimerRef.current)
        resizeTimerRef.current = window.setTimeout(() => {
          if (!pagesRef.current.length || exportingRef.current) return
          const stage = stageRef.current
          if (Math.abs(fitWidth(stage) - lastFitWRef.current) < 16) return
          void layoutPages()
        }, 180)
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [layoutPages])

    // Multi-touch cancels live stroke
    useEffect(() => {
      const onDown = (e: PointerEvent) => {
        downPointersRef.current[e.pointerId] = true
        if (pointerDownCount() > 1) clearLiveStrokes()
      }
      const forget = (e: PointerEvent) => {
        delete downPointersRef.current[e.pointerId]
      }
      document.addEventListener('pointerdown', onDown, true)
      document.addEventListener('pointerup', forget, true)
      document.addEventListener('pointercancel', forget, true)
      return () => {
        document.removeEventListener('pointerdown', onDown, true)
        document.removeEventListener('pointerup', forget, true)
        document.removeEventListener('pointercancel', forget, true)
      }
    }, [clearLiveStrokes])

    useImperativeHandle(ref, () => ({
      undoStroke: () => {
        const state = pagesRef.current[activeIndexRef.current]
        if (!state || !state.strokes.length) return
        state.strokes.pop()
        state.liveStroke = null
        if (state.ink) {
          paintInk(state.ink, state.strokes, null, state.width, state.height)
        }
        onMarksChange(markCount(pagesRef.current))
      },
      clearActivePage: () => {
        const state = pagesRef.current[activeIndexRef.current]
        if (!state) return
        state.strokes = []
        state.liveStroke = null
        if (state.ink) {
          paintInk(state.ink, state.strokes, null, state.width, state.height)
        }
        onMarksChange(markCount(pagesRef.current))
      },
      scrollToPage: (index: number) => {
        const el = document.getElementById(`pdf-page-${index}`)
        if (!el) return
        activeIndexRef.current = index
        el.scrollIntoView({ block: 'start', inline: 'nearest' })
        onActivePageChange(index + 1, pagesRef.current.length)
      },
      getPages: () => pagesRef.current,
      getMarkCount: () => markCount(pagesRef.current),
      getActiveIndex: () => activeIndexRef.current,
      commitLive: () => {
        for (const state of pagesRef.current) {
          if (!state.liveStroke) continue
          state.strokes.push(state.liveStroke)
          state.liveStroke = null
          if (state.ink) {
            paintInk(state.ink, state.strokes, null, state.width, state.height)
          }
        }
        onMarksChange(markCount(pagesRef.current))
      },
    }))

    return (
      <div
        ref={stageRef}
        className={`pdf-stage rounded-sm border border-retro-border/40 bg-[#1a1a1e] ${
          mode === 'draw' ? 'mode-draw' : 'mode-browse'
        }`}
        style={{
          maxHeight: 'min(70vh, 720px)',
          overflow: mode === 'draw' ? 'hidden' : 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 12px 24px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: mode === 'draw' ? 'none' : 'pan-x pan-y',
        }}
      />
    )
  },
)

// Re-export default zoom for consumers that need it without importing constants
export { DEFAULT_ZOOM_INDEX, ZOOM_LEVELS }
