import { PixelInput } from '@pxlkit/ui-kit'
import { useI18n } from '../../i18n'

type SearchBarProps = {
  query: string
  keyFilter: string
  onQueryChange: (v: string) => void
  onKeyFilterChange: (v: string) => void
  matchCount: number
  totalCount: number
}

export function SearchBar({
  query,
  keyFilter,
  onQueryChange,
  onKeyFilterChange,
  matchCount,
  totalCount,
}: SearchBarProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PixelInput
          label={t('jsonl.search.label')}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('jsonl.search.placeholder')}
          tone="cyan"
          size="sm"
        />
        <PixelInput
          label={t('jsonl.search.keyLabel')}
          value={keyFilter}
          onChange={(e) => onKeyFilterChange(e.target.value)}
          placeholder={t('jsonl.search.keyPlaceholder')}
          tone="cyan"
          size="sm"
          hint={t('jsonl.search.keyHint')}
        />
      </div>
      <p className="m-0 font-mono text-xs text-retro-muted">
        {t('jsonl.search.matches', { n: matchCount, total: totalCount })}
      </p>
    </div>
  )
}
