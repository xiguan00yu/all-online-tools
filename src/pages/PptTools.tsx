import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
} from '@pxlkit/ui-kit'
import type { LoadedPresentation } from 'pptx-viewer'
import { Layout } from '../components/Layout'
import { PptStage } from '../components/ppt/PptStage'
import {
  formatBytes,
  isLegacyPptFile,
  isPptxFile,
  loadPptxFromFile,
} from '../components/ppt/loadPptx'
import { useI18n, type TranslateFn } from '../i18n'

type Status = {
  kind: 'idle' | 'loading' | 'ready' | 'error'
  text: string
}

function loadErrorMessage(
  result: Extract<Awaited<ReturnType<typeof loadPptxFromFile>>, { ok: false }>,
  t: TranslateFn,
): string {
  if (result.code === 'legacy_ppt') return t('ppt.legacyOnly')
  if (result.code === 'bad_type') return t('ppt.badType')
  if (result.code === 'empty') return t('ppt.emptySlides')
  if (result.code === 'invalid') {
    return t('ppt.cannotLoad', {
      detail: result.detail ?? t('ppt.unknownError'),
    })
  }
  return t('ppt.cannotLoad', {
    detail: result.detail ?? t('ppt.unknownError'),
  })
}

export function PptTools() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const presentationRef = useRef<LoadedPresentation | null>(null)

  const [presentation, setPresentation] = useState<LoadedPresentation | null>(
    null,
  )
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null,
  )
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })

  useEffect(() => {
    document.title = t('ppt.documentTitle')
  }, [t])

  useEffect(() => {
    setStatus((prev) =>
      prev.kind === 'idle' ? { kind: 'idle', text: t('ppt.idle') } : prev,
    )
  }, [t])

  const clearLoaded = useCallback(() => {
    if (presentationRef.current) {
      presentationRef.current.cleanup()
      presentationRef.current = null
    }
    setPresentation(null)
    setSlideIndex(0)
    setSlideCount(0)
    setFileMeta(null)
  }, [])

  useEffect(() => {
    return () => {
      if (presentationRef.current) {
        presentationRef.current.cleanup()
        presentationRef.current = null
      }
    }
  }, [])

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (isLegacyPptFile(file)) {
      clearLoaded()
      setStatus({ kind: 'error', text: t('ppt.legacyOnly') })
      return
    }

    if (!isPptxFile(file)) {
      clearLoaded()
      setStatus({ kind: 'error', text: t('ppt.badType') })
      return
    }

    clearLoaded()
    setStatus({
      kind: 'loading',
      text: t('ppt.loading', { name: file.name }),
    })
    setFileMeta({ name: file.name, size: file.size })

    const result = await loadPptxFromFile(file)
    if (!result.ok) {
      setPresentation(null)
      setStatus({ kind: 'error', text: loadErrorMessage(result, t) })
      return
    }

    presentationRef.current = result.presentation
    setPresentation(result.presentation)
    setSlideCount(result.slideCount)
    setSlideIndex(0)
    setStatus({
      kind: 'ready',
      text: t('ppt.ready', {
        name: file.name,
        n: result.slideCount,
        size: formatBytes(file.size),
      }),
    })
  }

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setSlideIndex((i) => Math.min(slideCount - 1, i + 1))
  }, [slideCount])

  useEffect(() => {
    if (!presentation || slideCount <= 0) return

    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (
        ev.key === 'ArrowRight' ||
        ev.key === 'ArrowDown' ||
        ev.key === 'PageDown' ||
        ev.key === ' '
      ) {
        ev.preventDefault()
        goNext()
      } else if (
        ev.key === 'ArrowLeft' ||
        ev.key === 'ArrowUp' ||
        ev.key === 'PageUp'
      ) {
        ev.preventDefault()
        goPrev()
      } else if (ev.key === 'Home') {
        ev.preventDefault()
        setSlideIndex(0)
      } else if (ev.key === 'End') {
        ev.preventDefault()
        setSlideIndex(slideCount - 1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentation, slideCount, goNext, goPrev])

  const handleClear = () => {
    clearLoaded()
    setStatus({ kind: 'idle', text: t('ppt.idle') })
  }

  return (
    <Layout title={t('ppt.title')} wide>
      <p className="text-sm text-retro-muted">
        {t('ppt.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          .pptx
        </PixelBadge>{' '}
        {t('ppt.introTail')}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e)
        }}
      />

      <PixelCard tone="neutral">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
            {t('ppt.viewer')}
          </h4>
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            pptx-viewer
          </PixelBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          <PixelButton
            type="button"
            tone="cyan"
            size="sm"
            loading={status.kind === 'loading'}
            onClick={handlePickFile}
          >
            {t('ppt.open')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            disabled={!presentation || slideIndex <= 0}
            onClick={goPrev}
          >
            {t('ppt.prev')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            disabled={!presentation || slideIndex >= slideCount - 1}
            onClick={goNext}
          >
            {t('ppt.next')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            disabled={!presentation && status.kind !== 'error'}
            onClick={handleClear}
          >
            {t('ppt.clear')}
          </PixelButton>
        </div>

        {fileMeta ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <PixelBadge tone="green" size="sm">
              {fileMeta.name}
            </PixelBadge>
            <PixelBadge tone="neutral" size="sm">
              {formatBytes(fileMeta.size)}
            </PixelBadge>
            {presentation ? (
              <PixelBadge tone="cyan" size="sm">
                {t('ppt.counter', {
                  current: slideIndex + 1,
                  total: slideCount,
                })}
              </PixelBadge>
            ) : null}
          </div>
        ) : null}

        <p className="mt-3 font-mono text-xs text-retro-muted">
          {status.text || t('ppt.idle')}
        </p>
      </PixelCard>

      {status.kind === 'error' ? (
        <PixelAlert
          tone="red"
          label={t('common.loadFailed')}
          message={status.text}
        />
      ) : null}

      {presentation ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {t('ppt.keyboardHint')}
            </PixelBadge>
          </div>
          <PptStage presentation={presentation} slideIndex={slideIndex} />
          <p className="text-center font-mono text-xs text-retro-muted">
            {t('ppt.fidelityNote')}
          </p>
        </div>
      ) : (
        status.kind !== 'loading' && (
          <PixelCard tone="neutral" padding="md">
            <p className="text-center text-sm text-retro-muted">
              {t('ppt.empty')}
            </p>
          </PixelCard>
        )
      )}
    </Layout>
  )
}
