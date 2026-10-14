import { useEffect, useMemo, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import {
  PixelBadge,
  PixelCard,
  PixelCodeInline,
  PixelDatePicker,
  PixelDivider,
  PixelInput,
  PixelSelect,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import { useI18n, type TranslateFn } from '../i18n'

dayjs.extend(relativeTime)
dayjs.extend(duration)

function formatPresets(t: TranslateFn) {
  return [
    { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
    { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
    { value: 'YYYY年MM月DD日', label: 'YYYY年MM月DD日' },
    { value: 'YYYY-MM-DDTHH:mm:ssZ', label: 'ISO 8601' },
    { value: 'X', label: t('date.format.unixSec') },
    { value: 'x', label: t('date.format.unixMs') },
  ]
}

/** Split / join helpers: PixelDatePicker is date-only; time uses PixelInput type=time. */
function splitDatetime(value: string): { date: Date; time: string } {
  const d = dayjs(value)
  if (!d.isValid()) {
    const now = dayjs()
    return { date: now.startOf('day').toDate(), time: '00:00:00' }
  }
  return { date: d.startOf('day').toDate(), time: d.format('HH:mm:ss') }
}

function joinDatetime(date: Date | null, time: string | null): string {
  const d = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : '00:00:00'
  const normalized = t.length === 5 ? `${t}:00` : t
  return `${d}T${normalized}`
}

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <PixelCard tone="cyan" padding="sm" bordered>
      <PixelCodeInline tone="cyan">{children}</PixelCodeInline>
    </PixelCard>
  )
}

function Section({
  title,
  tag,
  children,
}: {
  title: string
  tag?: string
  children: ReactNode
}) {
  // Long tags (e.g. "dayjs.diff") must not use PixelCard's corner `badge`
  // ribbon: that path sets overflow-hidden on the card and clips absolute
  // PixelRibbon labels. Keep the tag in-flow with PixelBadge so it can wrap.
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

/** Date + time row: PixelDatePicker (day) + PixelInput type=time (HH:mm:ss). */
function DatetimeFields({
  value,
  onChange,
  dateLabel,
  timeLabel,
}: {
  value: string
  onChange: (next: string) => void
  dateLabel: string
  timeLabel: string
}) {
  const { t } = useI18n()
  const { date, time } = splitDatetime(value)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PixelDatePicker
        label={dateLabel}
        value={date}
        onChange={(next) => {
          onChange(joinDatetime(next, time))
        }}
        clearable={false}
        format={(d) => dayjs(d).format('YYYY-MM-DD')}
        presets={[{ label: t('date.today'), value: dayjs().startOf('day').toDate() }]}
      />
      <PixelInput
        type="time"
        step={1}
        label={timeLabel}
        value={time}
        onChange={(e) => {
          onChange(joinDatetime(date, e.target.value))
        }}
        aria-label={timeLabel}
      />
    </div>
  )
}

function FormatTool() {
  const { t } = useI18n()
  const presets = useMemo(() => formatPresets(t), [t])
  const [datetime, setDatetime] = useState(() =>
    dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  )
  const [preset, setPreset] = useState(presets[0].value)
  const [customFormat, setCustomFormat] = useState('')
  const format = customFormat.trim() || preset

  const output = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return t('date.invalidDate')
    return d.format(format)
  }, [datetime, format, t])

  return (
    <Section title={t('date.format.title')} tag="dayjs.format">
      <DatetimeFields
        value={datetime}
        onChange={setDatetime}
        dateLabel={t('date.date')}
        timeLabel={t('date.time')}
      />
      <PixelSelect
        label={t('date.format.preset')}
        options={presets}
        value={preset}
        onChange={(key) => {
          setPreset(key)
          setCustomFormat('')
        }}
        placeholder={t('date.format.presetPlaceholder')}
      />
      <PixelInput
        type="text"
        label={t('date.format.custom')}
        placeholder={t('date.format.customPlaceholder')}
        value={customFormat}
        onChange={(e) => setCustomFormat(e.target.value)}
        clearable
        onClear={() => setCustomFormat('')}
      />
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">
          {t('common.output')}
        </p>
        <ResultBox>{output}</ResultBox>
      </div>
    </Section>
  )
}

function FromNowTool() {
  const { t, locale } = useI18n()
  const [datetime, setDatetime] = useState(() =>
    dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss'),
  )

  const fromNow = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return t('date.invalidDate')
    return d.fromNow()
    // locale in deps so relative strings refresh when language changes
  }, [datetime, t, locale])

  const toNow = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return t('date.invalidDate')
    return d.toNow()
  }, [datetime, t, locale])

  return (
    <Section title={t('date.relative.title')} tag="fromNow / toNow">
      <DatetimeFields
        value={datetime}
        onChange={setDatetime}
        dateLabel={t('date.relative.targetDate')}
        timeLabel={t('date.relative.targetTime')}
      />
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">
          {t('date.relative.fromNow')}
        </p>
        <ResultBox>{fromNow}</ResultBox>
      </div>
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">
          {t('date.relative.toNow')}
        </p>
        <ResultBox>{toNow}</ResultBox>
      </div>
    </Section>
  )
}

function DiffTool() {
  const { t, locale } = useI18n()
  const [start, setStart] = useState(() =>
    dayjs().subtract(2, 'day').format('YYYY-MM-DDTHH:mm:ss'),
  )
  const [end, setEnd] = useState(() =>
    dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  )

  const diff = useMemo(() => {
    const a = dayjs(start)
    const b = dayjs(end)
    if (!a.isValid() || !b.isValid()) {
      return { ok: false as const, message: t('date.invalidDate') }
    }
    const ms = b.diff(a)
    const abs = Math.abs(ms)
    const dur = dayjs.duration(abs)
    const sign = ms < 0 ? '-' : ''
    return {
      ok: true as const,
      days: `${sign}${b.diff(a, 'day')}`,
      hours: `${sign}${b.diff(a, 'hour')}`,
      minutes: `${sign}${b.diff(a, 'minute')}`,
      seconds: `${sign}${b.diff(a, 'second')}`,
      humanized: `${sign}${dur.humanize()}`,
    }
  }, [start, end, t, locale])

  return (
    <Section title={t('date.diff.title')} tag="dayjs.diff">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-mono text-retro-muted">
            {t('date.diff.start')}
          </p>
          <DatetimeFields
            value={start}
            onChange={setStart}
            dateLabel={t('date.diff.startDate')}
            timeLabel={t('date.diff.startTime')}
          />
        </div>
        <PixelDivider spacing="sm" />
        <div>
          <p className="mb-2 text-xs font-mono text-retro-muted">
            {t('date.diff.end')}
          </p>
          <DatetimeFields
            value={end}
            onChange={setEnd}
            dateLabel={t('date.diff.endDate')}
            timeLabel={t('date.diff.endTime')}
          />
        </div>
      </div>
      {!diff.ok ? (
        <ResultBox>{diff.message}</ResultBox>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">
              {t('date.diff.days')}
            </p>
            <ResultBox>{t('date.diff.dayUnit', { n: diff.days })}</ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">
              {t('date.diff.hours')}
            </p>
            <ResultBox>{t('date.diff.hourUnit', { n: diff.hours })}</ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">
              {t('date.diff.minutes')}
            </p>
            <ResultBox>
              {t('date.diff.minuteUnit', { n: diff.minutes })}
            </ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">
              {t('date.diff.seconds')}
            </p>
            <ResultBox>
              {t('date.diff.secondUnit', { n: diff.seconds })}
            </ResultBox>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-mono text-retro-muted">
              {t('date.diff.humanized')}
            </p>
            <ResultBox>{diff.humanized}</ResultBox>
          </div>
        </div>
      )}
    </Section>
  )
}

export function DateTools() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t('date.documentTitle')
  }, [t])

  return (
    <Layout title={t('date.title')}>
      <p className="text-sm text-retro-muted">
        {t('date.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          PixelDatePicker
        </PixelBadge>
        {t('date.introMid')}{' '}
        <PixelBadge tone="cyan" size="sm">
          PixelInput type=&quot;time&quot;
        </PixelBadge>{' '}
        {t('date.introTail')}
      </p>
      <FormatTool />
      <FromNowTool />
      <DiffTool />
    </Layout>
  )
}
