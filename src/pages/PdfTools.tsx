import { useCallback, useRef, useState, type ChangeEvent } from 'react'
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

type LoadError = 'engine' | 'load' | 'protected' | 'empty' | null

export function PdfTools() {
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
      setStatusText('请选择 PDF 文件')
      return
    }
    resetDoc()
    setLoading(true)
    setLoadError(null)
    setStatusText('正在加载…')
    try {
      const bytes = await readFileAsUint8Array(file)
      const result = await loadPdfFromBytes(bytes)
      originalBytesRef.current = result.originalBytes
      fileNameRef.current = file.name
      setPages(result.pages)
      setPageTotal(result.pages.length)
      setPageCurrent(1)
      setMarkCount(0)
      setStatusText(`已加载 ${result.pages.length} 页 · ${file.name}`)
    } catch (err) {
      const name =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name: string }).name)
          : ''
      if (name === 'PasswordException') {
        setLoadError('protected')
        setStatusText('该 PDF 受密码保护，无法预览')
      } else if (err instanceof Error && err.message === 'empty') {
        setLoadError('empty')
        setStatusText('PDF 没有页面')
      } else {
        setLoadError('load')
        setStatusText('无法加载该 PDF')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const handle = stageRef.current
    if (!handle || !pages || exporting) return
    setExporting(true)
    setStatusText('正在导出…')
    handle.commitLive()
    const result = await exportRedactedPdf(
      handle.getPages(),
      originalBytesRef.current,
      (p) => {
        if (p.step.startsWith('export: attempt')) {
          setStatusText(
            `导出尝试 ${((p.index ?? 0) + 1)}/${3}…`,
          )
        } else if (p.step === 'export: page jpeg' || p.step === 'export: page original') {
          setStatusText(`导出页面 ${p.page}/${p.pages}…`)
        }
      },
    )
    setExporting(false)
    if (result.kind === 'original') {
      const bytes = originalBytesRef.current
      if (!bytes) {
        setStatusText('没有可导出的文件')
        return
      }
      downloadBytes(
        bytes,
        exportFilename(fileNameRef.current, false),
      )
      setStatusText('已下载原文件（无涂抹标记）')
      return
    }
    if (result.kind === 'pdf') {
      downloadBytes(
        result.bytes,
        exportFilename(fileNameRef.current, true),
      )
      setStatusText(
        `已下载涂抹后的 PDF（${(result.bytes.byteLength / 1024 / 1024).toFixed(2)} MB）`,
      )
      return
    }
    if (result.kind === 'too-large') {
      setStatusText(
        `导出文件过大（${(result.bytes / 1024 / 1024).toFixed(1)} MB），请减少涂抹页或缩小范围`,
      )
      return
    }
    setStatusText(`导出失败：${result.message}`)
  }

  return (
    <Layout title="PDF 工具" wide>
      <p className="text-sm text-retro-muted">
        本地预览、涂抹遮盖敏感内容、导出新 PDF。全部在浏览器完成，不会上传。涂抹页会栅格化为
        JPEG（pica 缩放）；未标记页尽量保留原 PDF 矢量内容。
      </p>

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
          label="加载失败"
          message={statusText ?? '无法打开 PDF'}
        />
      ) : null}

      {loading ? (
        <PixelCard tone="cyan" padding="sm">
          <p className="font-mono text-sm text-retro-muted">加载中…</p>
        </PixelCard>
      ) : null}

      {pages ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {mode === 'draw' ? '涂抹模式 · 手指/鼠标拖曳遮盖' : '浏览模式 · 可缩放滚动'}
            </PixelBadge>
            {mode === 'draw' ? (
              <PixelBadge tone="pink" size="sm">
                页面滚动已锁定，用上/下页切换
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
              选择一个 PDF 开始预览。支持手机触控涂抹。
            </p>
          </PixelCard>
        )
      )}
    </Layout>
  )
}
