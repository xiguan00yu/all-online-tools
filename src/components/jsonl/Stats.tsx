import { PixelBadge, PixelBadgeGroup, PixelCard } from '@pxlkit/ui-kit'
import { useI18n } from '../../i18n'
import type { JsonlParseResult } from './parseLines'

type StatsBarProps = {
  result: JsonlParseResult
  filteredCount: number
  fileLabel?: string | null
}

export function StatsBar({ result, filteredCount, fileLabel }: StatsBarProps) {
  const { t } = useI18n()
  const topKeys = Object.entries(result.keyFrequency)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)

  return (
    <PixelCard tone="neutral" padding="sm" bordered>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PixelBadgeGroup aria-label={t('jsonl.stats.aria')}>
          <PixelBadge tone="cyan" size="sm">
            {t('jsonl.stats.total', { n: result.total })}
          </PixelBadge>
          <PixelBadge tone="green" size="sm">
            {t('jsonl.stats.valid', { n: result.valid })}
          </PixelBadge>
          <PixelBadge tone={result.invalid ? 'red' : 'neutral'} size="sm">
            {t('jsonl.stats.invalid', { n: result.invalid })}
          </PixelBadge>
          {result.blank > 0 ? (
            <PixelBadge tone="neutral" size="sm">
              {t('jsonl.stats.blank', { n: result.blank })}
            </PixelBadge>
          ) : null}
          <PixelBadge tone="gold" size="sm">
            {t('jsonl.stats.filtered', { n: filteredCount })}
          </PixelBadge>
        </PixelBadgeGroup>
        {fileLabel ? (
          <span className="font-mono text-xs text-retro-muted">{fileLabel}</span>
        ) : null}
      </div>
      {topKeys.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-mono text-retro-muted">
            {t('jsonl.stats.topKeys')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topKeys.map(([key, count]) => (
              <PixelBadge key={key} tone="cyan" size="sm">
                {key} · {count}
              </PixelBadge>
            ))}
          </div>
        </div>
      ) : null}
    </PixelCard>
  )
}
