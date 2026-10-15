import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  PixelBadge,
  PixelButton,
  PixelDivider,
  PixelSectionHeader,
} from '@pxlkit/ui-kit'
import {
  QuickdrawBoard,
  type QuickdrawBoardHandle,
} from '../components/board/QuickdrawBoard'
import { BOARD_STORAGE_KEY } from '../components/board/constants'
import { useI18n } from '../i18n'

export function BoardTools() {
  const { t } = useI18n()
  const boardRef = useRef<QuickdrawBoardHandle>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    document.title = t('board.documentTitle')
  }, [t])

  const statusLabels = useMemo(
    () => ({
      restored: t('board.statusRestored'),
      saved: t('board.statusSaved'),
      cleared: t('board.statusCleared'),
      imported: t('board.statusImported'),
      exportedJson: t('board.statusExportedJson'),
      exportedPng: t('board.statusExportedPng'),
      emptyPng: t('board.statusEmptyPng'),
      invalidJson: t('board.statusInvalidJson'),
      parseFailed: t('board.statusParseFailed'),
    }),
    [t],
  )

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void boardRef.current?.importJsonFile(file)
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-retro-border/40 px-3 pb-3 pt-3 pr-28 sm:px-4 sm:pr-36">
        <div className="flex flex-wrap items-center gap-2">
          <PixelButton
            type="button"
            variant="ghost"
            tone="cyan"
            size="sm"
            onClick={() => {
              window.location.assign('./index.html')
            }}
          >
            {t('common.backHome')}
          </PixelButton>
          <PixelSectionHeader
            title={t('board.title')}
            titleTone="cyan"
            size="md"
            as="h1"
            className="!mb-0 min-w-0 flex-1"
          />
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            Quickdraw
          </PixelBadge>
        </div>

        <p className="mt-2 text-xs text-retro-muted sm:text-sm">{t('board.intro')}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            onClick={handleImportClick}
          >
            {t('board.importJson')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            onClick={() => {
              boardRef.current?.exportJson()
            }}
          >
            {t('board.exportJson')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="green"
            variant="outline"
            size="sm"
            onClick={() => {
              void boardRef.current?.exportPng()
            }}
          >
            {t('board.exportPng')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!window.confirm(t('board.clearConfirm'))) return
              boardRef.current?.clearBoard()
            }}
          >
            {t('board.clear')}
          </PixelButton>
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PixelBadge tone="neutral" size="sm">
            {t('board.autosaveBadge')}
          </PixelBadge>
          {status ? (
            <span className="font-mono text-xs text-retro-muted">{status}</span>
          ) : null}
        </div>

        <PixelDivider spacing="sm" className="mt-2" />
        <p className="font-mono text-[10px] text-retro-muted/80 sm:text-xs">
          {t('board.storageHint', { key: BOARD_STORAGE_KEY })}
        </p>
      </header>

      <main className="relative min-h-0 flex-1 bg-retro-bg">
        <QuickdrawBoard
          ref={boardRef}
          className="absolute inset-0"
          onStatus={setStatus}
          statusLabels={statusLabels}
        />
      </main>
    </div>
  )
}
