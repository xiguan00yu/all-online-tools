import { PixelBadge, PixelButton } from '@pxlkit/ui-kit'
import { PxlKitIcon } from '@pxlkit/core'
import { Download, Eraser, Pencil, Undo, Upload } from '@pxlkit/ui'
import { useI18n } from '../../i18n'
import type { PreviewMode } from './types'
import { ZOOM_LEVELS } from './constants'

type PdfToolbarProps = {
  hasDoc: boolean
  mode: PreviewMode
  pageCurrent: number
  pageTotal: number
  markCount: number
  zoomIndex: number
  exporting: boolean
  statusText: string | null
  onPickFile: () => void
  onModeChange: (mode: PreviewMode) => void
  onUndo: () => void
  onClearPage: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onExport: () => void
}

export function PdfToolbar({
  hasDoc,
  mode,
  pageCurrent,
  pageTotal,
  markCount,
  zoomIndex,
  exporting,
  statusText,
  onPickFile,
  onModeChange,
  onUndo,
  onClearPage,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onExport,
}: PdfToolbarProps) {
  const { t } = useI18n()
  const zoomLabel = `${Math.round((ZOOM_LEVELS[zoomIndex] ?? 1) * 100)}%`
  const canZoomOut = zoomIndex > 0 && mode === 'browse' && !exporting
  const canZoomIn =
    zoomIndex < ZOOM_LEVELS.length - 1 && mode === 'browse' && !exporting

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <PixelButton
          type="button"
          tone="cyan"
          size="sm"
          disabled={exporting}
          onClick={onPickFile}
          iconLeft={
            <PxlKitIcon
              icon={Upload}
              size={14}
              appearance="solid"
              color="currentColor"
              decorative
            />
          }
        >
          {t('pdf.pickPdf')}
        </PixelButton>
        {hasDoc ? (
          <>
            <PixelButton
              type="button"
              tone={mode === 'browse' ? 'cyan' : 'neutral'}
              variant={mode === 'browse' ? 'solid' : 'outline'}
              size="sm"
              disabled={exporting}
              onClick={() => onModeChange('browse')}
            >
              {t('pdf.browse')}
            </PixelButton>
            <PixelButton
              type="button"
              tone={mode === 'draw' ? 'pink' : 'neutral'}
              variant={mode === 'draw' ? 'solid' : 'outline'}
              size="sm"
              disabled={exporting}
              onClick={() => onModeChange('draw')}
              iconLeft={
                <PxlKitIcon
                  icon={Pencil}
                  size={14}
                  appearance="solid"
                  color="currentColor"
                  decorative
                />
              }
            >
              {t('pdf.draw')}
            </PixelButton>
            <PixelButton
              type="button"
              tone="neutral"
              variant="outline"
              size="sm"
              disabled={exporting || !hasDoc}
              onClick={onUndo}
              iconLeft={
                <PxlKitIcon
                  icon={Undo}
                  size={14}
                  appearance="solid"
                  color="currentColor"
                  decorative
                />
              }
            >
              {t('pdf.undo')}
            </PixelButton>
            <PixelButton
              type="button"
              tone="neutral"
              variant="outline"
              size="sm"
              disabled={exporting || !hasDoc}
              onClick={onClearPage}
              iconLeft={
                <PxlKitIcon
                  icon={Eraser}
                  size={14}
                  appearance="solid"
                  color="currentColor"
                  decorative
                />
              }
            >
              {t('pdf.clearPage')}
            </PixelButton>
            <PixelButton
              type="button"
              tone="green"
              size="sm"
              disabled={exporting || !hasDoc}
              onClick={onExport}
              iconLeft={
                <PxlKitIcon
                  icon={Download}
                  size={14}
                  appearance="solid"
                  color="currentColor"
                  decorative
                />
              }
            >
              {exporting ? t('pdf.exporting') : t('pdf.exportPdf')}
            </PixelButton>
          </>
        ) : null}
      </div>

      {hasDoc ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PixelButton
              type="button"
              variant="ghost"
              tone="cyan"
              size="sm"
              disabled={pageCurrent <= 1 || exporting}
              onClick={onPrevPage}
            >
              {t('pdf.prevPage')}
            </PixelButton>
            <PixelBadge tone="cyan" size="sm">
              {pageCurrent} / {pageTotal}
            </PixelBadge>
            <PixelButton
              type="button"
              variant="ghost"
              tone="cyan"
              size="sm"
              disabled={pageCurrent >= pageTotal || exporting}
              onClick={onNextPage}
            >
              {t('pdf.nextPage')}
            </PixelButton>
          </div>
          <div className="flex items-center gap-2">
            <PixelButton
              type="button"
              variant="outline"
              tone="neutral"
              size="sm"
              disabled={!canZoomOut}
              onClick={onZoomOut}
            >
              −
            </PixelButton>
            <PixelBadge tone="neutral" size="sm">
              {zoomLabel}
            </PixelBadge>
            <PixelButton
              type="button"
              variant="outline"
              tone="neutral"
              size="sm"
              disabled={!canZoomIn}
              onClick={onZoomIn}
            >
              +
            </PixelButton>
            <PixelBadge tone={markCount > 0 ? 'pink' : 'neutral'} size="sm">
              {t('pdf.marks', { n: markCount })}
            </PixelBadge>
          </div>
        </div>
      ) : null}

      {statusText ? (
        <p className="font-mono text-xs text-retro-muted">{statusText}</p>
      ) : null}
    </div>
  )
}
