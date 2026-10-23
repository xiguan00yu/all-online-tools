import { PixelBadge, PixelButton, PixelCard, PixelCheckbox } from '@pxlkit/ui-kit'
import { useI18n } from '../../i18n'
import { previewScalar, type JsonlRecord } from './parseLines'

type TableViewProps = {
  records: JsonlRecord[]
  columns: string[]
  availableKeys: string[]
  onColumnsChange: (cols: string[]) => void
  selected: Set<number>
  onToggleSelect: (line: number) => void
}

export function TableView({
  records,
  columns,
  availableKeys,
  onColumnsChange,
  selected,
  onToggleSelect,
}: TableViewProps) {
  const { t } = useI18n()
  const objectRows = records.filter(
    (r): r is Extract<JsonlRecord, { kind: 'valid' }> =>
      r.kind === 'valid' &&
      r.value !== null &&
      typeof r.value === 'object' &&
      !Array.isArray(r.value),
  )

  const toggleCol = (key: string, on: boolean) => {
    if (on) {
      if (columns.includes(key)) return
      onColumnsChange([...columns, key])
    } else {
      onColumnsChange(columns.filter((c) => c !== key))
    }
  }

  if (objectRows.length === 0) {
    return (
      <PixelCard tone="neutral" padding="sm" bordered>
        <p className="m-0 text-sm text-retro-muted">{t('jsonl.table.empty')}</p>
      </PixelCard>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-mono text-retro-muted">
          {t('jsonl.table.columns')}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {availableKeys.map((key) => (
            <PixelCheckbox
              key={key}
              label={key}
              checked={columns.includes(key)}
              onChange={(on) => toggleCol(key, on)}
              tone="cyan"
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <PixelButton
            type="button"
            size="sm"
            tone="neutral"
            variant="ghost"
            onClick={() => onColumnsChange(availableKeys.slice(0, 8))}
          >
            {t('jsonl.table.autoColumns')}
          </PixelButton>
          <PixelButton
            type="button"
            size="sm"
            tone="neutral"
            variant="ghost"
            onClick={() => onColumnsChange([])}
          >
            {t('jsonl.table.clearColumns')}
          </PixelButton>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="m-0 text-sm text-retro-muted">{t('jsonl.table.pickColumns')}</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-retro-border/40">
          <table className="w-full min-w-[28rem] border-collapse text-left font-mono text-xs">
            <thead>
              <tr className="bg-retro-border/20 text-retro-muted">
                <th className="whitespace-nowrap px-2 py-2 font-semibold">
                  {t('jsonl.table.line')}
                </th>
                {columns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-2 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectRows.map((row) => {
                const obj = row.value as Record<string, unknown>
                const isSel = selected.has(row.line)
                return (
                  <tr
                    key={row.line}
                    className={`border-t border-retro-border/30 ${
                      isSel ? 'bg-retro-cyan/10' : ''
                    }`}
                    onClick={() => onToggleSelect(row.line)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 align-top">
                      <PixelBadge tone={isSel ? 'cyan' : 'neutral'} size="sm">
                        {row.line}
                      </PixelBadge>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="max-w-[14rem] truncate px-2 py-1.5 align-top text-retro-text"
                        title={
                          Object.prototype.hasOwnProperty.call(obj, col)
                            ? previewScalar(obj[col], 200)
                            : ''
                        }
                      >
                        {Object.prototype.hasOwnProperty.call(obj, col)
                          ? previewScalar(obj[col], 60)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 font-mono text-xs text-retro-muted">
        {t('jsonl.table.rowHint')}
      </p>
    </div>
  )
}
