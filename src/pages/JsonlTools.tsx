import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelCheckbox,
  PixelDivider,
  PixelSegmented,
  PixelTextarea,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import { JsonTree } from '../components/jsonl/JsonTree'
import { SearchBar } from '../components/jsonl/SearchBar'
import { StatsBar } from '../components/jsonl/Stats'
import { TableView } from '../components/jsonl/TableView'
import {
  downloadText,
  exportNormalizedJsonl,
  exportPrettyDump,
  formatBytes,
  heuristicTableKeys,
  JSONL_PAGE_SIZE,
  JSONL_SOFT_MAX_BYTES,
  JSONL_WARN_BYTES,
  JSONL_WARN_LINES,
  parseJsonlLines,
  previewScalar,
  recordMatchesSearch,
  type JsonlParseResult,
  type JsonlRecord,
} from '../components/jsonl/parseLines'
import { useI18n } from '../i18n'

const SAMPLE = `{"id":1,"name":"alpha","tags":["a","b"],"meta":{"ok":true}}
{"id":2,"name":"beta","tags":["b"],"meta":{"ok":false,"score":0.8}}
{"id":3,"name":"gamma","tags":["c","d"],"nested":{"x":1,"y":[2,3]}}
{"id":4,"name":"delta","tags":["a"],"meta":{"ok":true}}
not-json
{"id":5,"name":"epsilon","tags":[],"meta":{"ok":true,"note":"trailing ok"}}
`

function Section({
  title,
  tag,
  children,
}: {
  title: string
  tag?: string
  children: ReactNode
}) {
  return (
    <PixelCard tone="neutral">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
        <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
          {title}
        </h4>
        {tag ? (
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            {tag}
          </PixelBadge>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </PixelCard>
  )
}

function RecordCard({
  record,
  selected,
  onToggle,
  forceOpen,
}: {
  record: JsonlRecord
  selected: boolean
  onToggle: () => void
  forceOpen: { open: boolean; nonce: number } | null
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(record.kind === 'invalid')

  useEffect(() => {
    if (forceOpen === null) return
    setOpen(forceOpen.open)
  }, [forceOpen])

  const tone =
    record.kind === 'valid' ? 'cyan' : record.kind === 'invalid' ? 'red' : 'neutral'

  return (
    <PixelCard tone={tone} padding="sm" bordered>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PixelCheckbox
          label={t('jsonl.record.line', { n: record.line })}
          checked={selected}
          onChange={() => onToggle()}
          tone="cyan"
        />
        <PixelBadge
          tone={
            record.kind === 'valid'
              ? 'green'
              : record.kind === 'invalid'
                ? 'red'
                : 'neutral'
          }
          size="sm"
        >
          {record.kind === 'valid'
            ? t('jsonl.record.valid')
            : record.kind === 'invalid'
              ? t('jsonl.record.invalid')
              : t('jsonl.record.blank')}
        </PixelBadge>
        {record.kind === 'valid' ? (
          <PixelButton
            type="button"
            size="sm"
            tone="neutral"
            variant="ghost"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? t('jsonl.record.collapse') : t('jsonl.record.expand')}
          </PixelButton>
        ) : null}
      </div>

      {record.kind === 'blank' ? (
        <p className="m-0 font-mono text-xs text-retro-muted">
          {t('jsonl.record.blankHint')}
        </p>
      ) : null}

      {record.kind === 'invalid' ? (
        <div className="space-y-2">
          <PixelAlert
            tone="red"
            label={t('jsonl.record.parseError')}
            message={record.errorText}
          />
          <pre className="m-0 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-retro-muted">
            {record.raw}
          </pre>
        </div>
      ) : null}

      {record.kind === 'valid' ? (
        open ? (
          <JsonTree
            value={record.value}
            label={`#${record.line}`}
            defaultOpen
          />
        ) : (
          <p className="m-0 truncate font-mono text-xs text-retro-muted">
            {previewScalar(record.value, 140)}
          </p>
        )
      ) : null}
    </PixelCard>
  )
}

export function JsonlTools() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [text, setText] = useState(SAMPLE)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null,
  )
  const [query, setQuery] = useState('')
  const [keyFilter, setKeyFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [page, setPage] = useState(0)
  const [hideBlank, setHideBlank] = useState(true)
  const [onlyInvalid, setOnlyInvalid] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [forceOpen, setForceOpen] = useState<{ open: boolean; nonce: number } | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    document.title = t('jsonl.documentTitle')
  }, [t])

  const parsed: JsonlParseResult = useMemo(
    () => parseJsonlLines(text, t),
    [text, t],
  )

  const autoKeys = useMemo(
    () => heuristicTableKeys(parsed.keyFrequency, parsed.objectCount),
    [parsed.keyFrequency, parsed.objectCount],
  )

  const allKeyNames = useMemo(() => {
    return Object.entries(parsed.keyFrequency)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k)
  }, [parsed.keyFrequency])

  // Seed table columns when heuristic keys first appear / change substantially.
  useEffect(() => {
    if (columns.length === 0 && autoKeys.length > 0) {
      setColumns(autoKeys.slice(0, 8))
    }
  }, [autoKeys, columns.length])

  const filtered = useMemo(() => {
    return parsed.records.filter((r) => {
      if (hideBlank && r.kind === 'blank') return false
      if (onlyInvalid && r.kind !== 'invalid') return false
      return recordMatchesSearch(r, query, keyFilter)
    })
  }, [parsed.records, hideBlank, onlyInvalid, query, keyFilter])

  // Reset page when filter changes.
  useEffect(() => {
    setPage(0)
  }, [query, keyFilter, hideBlank, onlyInvalid, text])

  const pageCount = Math.max(1, Math.ceil(filtered.length / JSONL_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageSlice = filtered.slice(
    safePage * JSONL_PAGE_SIZE,
    safePage * JSONL_PAGE_SIZE + JSONL_PAGE_SIZE,
  )

  const byteLen = useMemo(() => new Blob([text]).size, [text])
  const sizeWarn =
    byteLen >= JSONL_SOFT_MAX_BYTES
      ? 'softMax'
      : byteLen >= JSONL_WARN_BYTES
        ? 'warn'
        : parsed.total >= JSONL_WARN_LINES
          ? 'lines'
          : null

  const toggleSelect = useCallback((line: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(line)) next.delete(line)
      else next.add(line)
      return next
    })
  }, [])

  const selectFilteredValid = () => {
    const next = new Set<number>()
    for (const r of filtered) {
      if (r.kind === 'valid') next.add(r.line)
    }
    setSelected(next)
  }

  const clearSelection = () => setSelected(new Set())

  const handlePickFile = () => fileInputRef.current?.click()

  const applyText = (next: string, meta: { name: string; size: number } | null) => {
    setText(next)
    setFileMeta(meta)
    setSelected(new Set())
    setForceOpen(null)
    setStatusMsg(
      meta
        ? t('jsonl.status.loadedFile', {
            name: meta.name,
            size: formatBytes(meta.size),
          })
        : t('jsonl.status.loadedPaste'),
    )
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const lower = file.name.toLowerCase()
    if (
      !lower.endsWith('.jsonl') &&
      !lower.endsWith('.json') &&
      !lower.endsWith('.ndjson') &&
      file.type &&
      !file.type.includes('json') &&
      !file.type.startsWith('text/')
    ) {
      setStatusMsg(t('jsonl.status.badType'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      applyText(result, { name: file.name, size: file.size })
    }
    reader.onerror = () => {
      setStatusMsg(t('jsonl.status.readFailed'))
    }
    reader.readAsText(file)
  }

  const selectionOrAll = selected.size > 0 ? selected : undefined

  const doExportJsonl = () => {
    const out = exportNormalizedJsonl(parsed.records, selectionOrAll)
    if (!out.trim()) {
      setStatusMsg(t('jsonl.status.nothingExport'))
      return
    }
    downloadText('export.jsonl', out)
    setStatusMsg(
      t('jsonl.status.exportedJsonl', {
        n: out.trim().split('\n').filter(Boolean).length,
      }),
    )
  }

  const doExportPretty = () => {
    const out = exportPrettyDump(parsed.records, selectionOrAll)
    if (!out.trim()) {
      setStatusMsg(t('jsonl.status.nothingExport'))
      return
    }
    downloadText('export.pretty.txt', out, 'text/plain')
    setStatusMsg(t('jsonl.status.exportedPretty'))
  }

  const tableAvailable = autoKeys.length > 0 || allKeyNames.length > 0

  return (
    <Layout title={t('jsonl.title')} wide>
      <p className="text-sm text-retro-muted">
        {t('jsonl.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          JSON.parse
        </PixelBadge>
        {t('jsonl.introTail')}
      </p>

      <Section title={t('jsonl.open.title')} tag={t('jsonl.open.tag')}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json,.ndjson,application/jsonl,application/x-ndjson,application/json,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <PixelButton type="button" tone="cyan" size="sm" onClick={handlePickFile}>
            {t('jsonl.open.pick')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={() => applyText(SAMPLE, null)}
          >
            {t('jsonl.open.sample')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            onClick={() => applyText('', null)}
          >
            {t('jsonl.open.clear')}
          </PixelButton>
        </div>
        <PixelTextarea
          label={t('jsonl.open.paste')}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setFileMeta(null)
          }}
          rows={8}
          tone="cyan"
          spellCheck={false}
          className="font-mono text-xs"
          placeholder={t('jsonl.open.placeholder')}
        />
        {fileMeta ? (
          <p className="m-0 font-mono text-xs text-retro-muted">
            {t('jsonl.open.fileMeta', {
              name: fileMeta.name,
              size: formatBytes(fileMeta.size),
            })}
          </p>
        ) : null}
        {sizeWarn === 'softMax' ? (
          <PixelAlert
            tone="gold"
            label={t('jsonl.warn.largeLabel')}
            message={t('jsonl.warn.softMax', { size: formatBytes(byteLen) })}
          />
        ) : null}
        {sizeWarn === 'warn' ? (
          <PixelAlert
            tone="gold"
            label={t('jsonl.warn.largeLabel')}
            message={t('jsonl.warn.bytes', { size: formatBytes(byteLen) })}
          />
        ) : null}
        {sizeWarn === 'lines' ? (
          <PixelAlert
            tone="gold"
            label={t('jsonl.warn.largeLabel')}
            message={t('jsonl.warn.lines', { n: parsed.total })}
          />
        ) : null}
        {statusMsg ? (
          <p className="m-0 font-mono text-xs text-retro-cyan">{statusMsg}</p>
        ) : null}
      </Section>

      <StatsBar
        result={parsed}
        filteredCount={filtered.length}
        fileLabel={
          fileMeta
            ? `${fileMeta.name} · ${formatBytes(fileMeta.size)}`
            : formatBytes(byteLen)
        }
      />

      <Section title={t('jsonl.validate.title')} tag={t('jsonl.validate.tag')}>
        {parsed.invalid === 0 ? (
          <PixelAlert
            tone="green"
            label={t('jsonl.validate.allValid')}
            message={t('jsonl.validate.allValidMsg', {
              valid: parsed.valid,
              blank: parsed.blank,
            })}
          />
        ) : (
          <div className="space-y-2">
            <PixelAlert
              tone="red"
              label={t('jsonl.validate.hasInvalid')}
              message={t('jsonl.validate.hasInvalidMsg', {
                n: parsed.invalid,
              })}
            />
            <ul className="m-0 list-none space-y-1 p-0">
              {parsed.records
                .filter((r) => r.kind === 'invalid')
                .slice(0, 50)
                .map((r) =>
                  r.kind === 'invalid' ? (
                    <li key={r.line} className="font-mono text-xs text-retro-muted">
                      <PixelBadge tone="pink" size="sm">
                        {t('jsonl.record.line', { n: r.line })}
                      </PixelBadge>{' '}
                      {r.errorText}
                    </li>
                  ) : null,
                )}
            </ul>
            {parsed.invalid > 50 ? (
              <p className="m-0 text-xs text-retro-muted">
                {t('jsonl.validate.moreErrors', { n: parsed.invalid - 50 })}
              </p>
            ) : null}
          </div>
        )}
      </Section>

      <Section title={t('jsonl.browse.title')} tag={t('jsonl.browse.tag')}>
        <SearchBar
          query={query}
          keyFilter={keyFilter}
          onQueryChange={setQuery}
          onKeyFilterChange={setKeyFilter}
          matchCount={filtered.length}
          totalCount={parsed.total}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <PixelCheckbox
            label={t('jsonl.browse.hideBlank')}
            checked={hideBlank}
            onChange={setHideBlank}
            tone="cyan"
          />
          <PixelCheckbox
            label={t('jsonl.browse.onlyInvalid')}
            checked={onlyInvalid}
            onChange={setOnlyInvalid}
            tone="cyan"
          />
        </div>
        <PixelSegmented
          aria-label={t('jsonl.browse.viewMode')}
          value={view}
          onChange={(v) => {
            const next = v as 'cards' | 'table'
            if (next === 'table' && !tableAvailable) {
              setStatusMsg(t('jsonl.table.unavailable'))
              return
            }
            setView(next)
          }}
          tone="cyan"
          options={[
            { value: 'cards', label: t('jsonl.browse.cards') },
            { value: 'table', label: t('jsonl.browse.table') },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <PixelButton
            type="button"
            size="sm"
            tone="cyan"
            variant="outline"
            onClick={selectFilteredValid}
          >
            {t('jsonl.browse.selectValid')}
          </PixelButton>
          <PixelButton
            type="button"
            size="sm"
            tone="neutral"
            variant="ghost"
            onClick={clearSelection}
          >
            {t('jsonl.browse.clearSelect')}
          </PixelButton>
          {view === 'cards' ? (
            <>
              <PixelButton
                type="button"
                size="sm"
                tone="neutral"
                variant="ghost"
                onClick={() => setForceOpen((prev) => ({ open: true, nonce: (prev?.nonce ?? 0) + 1 }))}
              >
                {t('jsonl.browse.expandPage')}
              </PixelButton>
              <PixelButton
                type="button"
                size="sm"
                tone="neutral"
                variant="ghost"
                onClick={() => setForceOpen((prev) => ({ open: false, nonce: (prev?.nonce ?? 0) + 1 }))}
              >
                {t('jsonl.browse.collapsePage')}
              </PixelButton>
            </>
          ) : null}
        </div>
        <p className="m-0 font-mono text-xs text-retro-muted">
          {t('jsonl.browse.selected', { n: selected.size })}
          {filtered.length > JSONL_PAGE_SIZE
            ? ` · ${t('jsonl.browse.pageHint', {
                size: JSONL_PAGE_SIZE,
                page: safePage + 1,
                pages: pageCount,
              })}`
            : ''}
        </p>

        {view === 'table' ? (
          <TableView
            records={pageSlice}
            columns={columns}
            availableKeys={allKeyNames.length ? allKeyNames : autoKeys}
            onColumnsChange={setColumns}
            selected={selected}
            onToggleSelect={toggleSelect}
          />
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {pageSlice.length === 0 ? (
              <li>
                <p className="m-0 text-sm text-retro-muted">{t('jsonl.browse.empty')}</p>
              </li>
            ) : (
              pageSlice.map((r) => (
                <li key={r.line}>
                  <RecordCard
                    record={r}
                    selected={selected.has(r.line)}
                    onToggle={() => toggleSelect(r.line)}
                    forceOpen={forceOpen}
                  />
                </li>
              ))
            )}
          </ul>
        )}

        {pageCount > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <PixelButton
              type="button"
              size="sm"
              tone="cyan"
              variant="outline"
              disabled={safePage <= 0}
              onClick={() => {
                setForceOpen(null)
                setPage((p) => Math.max(0, p - 1))
              }}
            >
              {t('jsonl.browse.prev')}
            </PixelButton>
            <span className="font-mono text-xs text-retro-muted">
              {t('jsonl.browse.page', {
                page: safePage + 1,
                pages: pageCount,
              })}
            </span>
            <PixelButton
              type="button"
              size="sm"
              tone="cyan"
              variant="outline"
              disabled={safePage >= pageCount - 1}
              onClick={() => {
                setForceOpen(null)
                setPage((p) => Math.min(pageCount - 1, p + 1))
              }}
            >
              {t('jsonl.browse.next')}
            </PixelButton>
          </div>
        ) : null}
      </Section>

      <Section title={t('jsonl.format.title')} tag={t('jsonl.format.tag')}>
        <p className="m-0 text-xs text-retro-muted">{t('jsonl.format.hint')}</p>
        <div className="flex flex-wrap gap-2">
          <PixelButton type="button" tone="cyan" size="sm" onClick={doExportJsonl}>
            {t('jsonl.format.exportJsonl')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            onClick={doExportPretty}
          >
            {t('jsonl.format.exportPretty')}
          </PixelButton>
        </div>
      </Section>

      <PixelDivider spacing="sm" />
      <p className="text-xs text-retro-muted">{t('jsonl.caveats')}</p>
    </Layout>
  )
}
