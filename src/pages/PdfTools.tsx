import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { PixelAlert, PixelBadge, PixelCard } from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import { DEFAULT_ZOOM_INDEX, ZOOM_LEVELS } from '../components/pdf/constants'
import {
  downloadBytes,
  exportFilename,
  exportRedactedPdf,
} from '../components/pdf/exportPdf'
import { loadPdfFromBytes, readFileAsUint8Array } from '../components/pdf/loadPdf'
import { PdfStage, type PdfStageHandle } from '../components/pdf/PdfStage'
import { PdfToolbar } from '../components/pdf/PdfToolbar'
import type { PageState, PreviewMode } from '../components/pdf/types'
import { useI18n } from '../i18n'

type LoadError = 'engine' | 'load' | 'protected' | 'empty' | null

export function PdfTools() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<PdfStageHandle>(null)
  const originalBytesRef = useRef<Uint8Array | null>(null)
  const fileNameRef = useRef<string | null>(null)

  const [pages, setPages] = useState<PageState[] | null>(null)
  const [mode, setMode] = useState<PreviewMode>('browse')
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [pageCurrent, setPageCurrent] = useState(1)
  const [pageTotal, setPageTotal] = useState(0)
  const [markCount, setMarkCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<LoadError>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = t('pdf.documentTitle')
  }, [t])

  const resetDoc = useCallback(() => {
    setPages(null)
    setMode('browse')
    setZoomIndex(DEFAULT_ZOOM_INDEX)
    setPageCurrent(1)
    setPageTotal(0)
    setMarkCount(0)
    setLoadError(null)
    setStatusText(null)
    originalBytesRef.current = null
  }, [])

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (
      file.type &&
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setLoadError('load')
      setStatusText(t('pdf.pickPlease'))
      return
    }
    resetDoc()
    setLoading(true)
    setLoadError(null)
    setStatusText(t('pdf.loadingDoc'))
    try {
      const bytes = await readFileAsUint8Array(file)
      const result = await loadPdfFromBytes(bytes)
      originalBytesRef.current = result.originalBytes
      fileNameRef.current = file.name
      setPages(result.pages)
      setPageTotal(result.pages.length)
      setPageCurrent(1)
      setMarkCount(0)
      setStatusText(
        t('pdf.loaded', { n: result.pages.length, name: file.name }),
      )
    } catch (err) {
      const name =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name: string }).name)
          : ''
      if (name === 'PasswordException') {
        setLoadError('protected')
        setStatusText(t('pdf.protected'))
      } else if (err instanceof Error && err.message === 'empty') {
        setLoadError('empty')
        setStatusText(t('pdf.emptyPages'))
      } else {
        setLoadError('load')
        setStatusText(t('pdf.cannotLoad'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const handle = stageRef.current
    if (!handle || !pages || exporting) return
    setExporting(true)
    setStatusText(t('pdf.exportingStatus'))
    handle.commitLive()
    const result = await exportRedactedPdf(
      handle.getPages(),
      originalBytesRef.current,
      (p) => {
        if (p.step.startsWith('export: attempt')) {
          setStatusText(
            t('pdf.exportAttempt', {
              i: (p.index ?? 0) + 1,
              total: 3,
            }),
          )
        } else if (
          p.step === 'export: page jpeg' ||
          p.step === 'export: page original'
        ) {
          setStatusText(
            t('pdf.exportPage', {
              page: p.page ?? 0,
              pages: p.pages ?? 0,
            }),
          )
        }
      },
    )
    setExporting(false)
    if (result.kind === 'original') {
      const bytes = originalBytesRef.current
      if (!bytes) {
        setStatusText(t('pdf.noFile'))
        return
      }
      downloadBytes(bytes, exportFilename(fileNameRef.current, false))
      setStatusText(t('pdf.downloadedOriginal'))
      return
    }
    if (result.kind === 'pdf') {
      downloadBytes(result.bytes, exportFilename(fileNameRef.current, true))
      setStatusText(
        t('pdf.downloadedRedacted', {
          mb: (result.bytes.byteLength / 1024 / 1024).toFixed(2),
        }),
      )
      return
    }
    if (result.kind === 'too-large') {
      setStatusText(
        t('pdf.tooLarge', {
          mb: (result.bytes / 1024 / 1024).toFixed(1),
        }),
      )
      return
    }
    setStatusText(t('pdf.exportFailed', { message: result.message }))
  }

  return (
    <Layout title={t('pdf.title')} wide>
      <p className="text-sm text-retro-muted">{t('pdf.intro')}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e)
        }}
      />

      <PixelCard tone="neutral">
        <PdfToolbar
          hasDoc={!!pages}
          mode={mode}
          pageCurrent={pageCurrent}
          pageTotal={pageTotal}
          markCount={markCount}
          zoomIndex={zoomIndex}
          exporting={exporting}
          statusText={statusText}
          onPickFile={handlePickFile}
          onModeChange={setMode}
          onUndo={() => stageRef.current?.undoStroke()}
          onClearPage={() => stageRef.current?.clearActivePage()}
          onPrevPage={() => {
            const idx = Math.max(0, pageCurrent - 2)
            stageRef.current?.scrollToPage(idx)
          }}
          onNextPage={() => {
            const idx = Math.min(pageTotal - 1, pageCurrent)
            stageRef.current?.scrollToPage(idx)
          }}
          onZoomOut={() => {
            if (mode !== 'browse' || exporting) return
            setZoomIndex((z) => Math.max(0, z - 1))
          }}
          onZoomIn={() => {
            if (mode !== 'browse' || exporting) return
            setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))
          }}
          onExport={() => {
            void handleExport()
          }}
        />
      </PixelCard>

      {loadError ? (
        <PixelAlert
          tone="red"
          label={t('common.loadFailed')}
          message={statusText ?? t('pdf.cannotOpen')}
        />
      ) : null}

      {loading ? (
        <PixelCard tone="cyan" padding="sm">
          <p className="font-mono text-sm text-retro-muted">
            {t('common.loading')}
          </p>
        </PixelCard>
      ) : null}

      {pages ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {mode === 'draw' ? t('pdf.modeDraw') : t('pdf.modeBrowse')}
            </PixelBadge>
            {mode === 'draw' ? (
              <PixelBadge tone="pink" size="sm">
                {t('pdf.drawLocked')}
              </PixelBadge>
            ) : null}
          </div>
          <PdfStage
            ref={stageRef}
            pages={pages}
            mode={mode}
            zoomIndex={zoomIndex}
            exporting={exporting}
            onActivePageChange={(current, total) => {
              setPageCurrent(current)
              setPageTotal(total)
            }}
            onMarksChange={setMarkCount}
          />
        </div>
      ) : (
        !loading && (
          <PixelCard tone="neutral" padding="md">
            <p className="text-center text-sm text-retro-muted">
              {t('pdf.empty')}
            </p>
          </PixelCard>
        )
      )}
    </Layout>
  )
}
