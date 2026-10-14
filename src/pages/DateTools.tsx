import { useMemo, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
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

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('zh-cn')

const FORMAT_PRESETS = [
  { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  { value: 'YYYY年MM月DD日', label: 'YYYY年MM月DD日' },
  { value: 'YYYY-MM-DDTHH:mm:ssZ', label: 'ISO 8601' },
  { value: 'X', label: 'Unix 秒' },
  { value: 'x', label: 'Unix 毫秒' },
]

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
  dateLabel = '日期',
  timeLabel = '时间',
}: {
  value: string
  onChange: (next: string) => void
  dateLabel?: string
  timeLabel?: string
}) {
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
        presets={[{ label: '今天', value: dayjs().startOf('day').toDate() }]}
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
  const [datetime, setDatetime] = useState(() =>
    dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  )
  const [preset, setPreset] = useState(FORMAT_PRESETS[0].value)
  const [customFormat, setCustomFormat] = useState('')
  const format = customFormat.trim() || preset

  const output = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return '无效日期'
    return d.format(format)
  }, [datetime, format])

  return (
    <Section title="格式化 Format" tag="dayjs.format">
      <DatetimeFields value={datetime} onChange={setDatetime} />
      <PixelSelect
        label="格式预设"
        options={FORMAT_PRESETS}
        value={preset}
        onChange={(key) => {
          setPreset(key)
          setCustomFormat('')
        }}
        placeholder="选择格式"
      />
      <PixelInput
        type="text"
        label="自定义格式（可选，覆盖预设）"
        placeholder="例如 YYYY-MM-DD HH:mm"
        value={customFormat}
        onChange={(e) => setCustomFormat(e.target.value)}
        clearable
        onClear={() => setCustomFormat('')}
      />
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">输出</p>
        <ResultBox>{output}</ResultBox>
      </div>
    </Section>
  )
}

function FromNowTool() {
  const [datetime, setDatetime] = useState(() =>
    dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss'),
  )

  const fromNow = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return '无效日期'
    return d.fromNow()
  }, [datetime])

  const toNow = useMemo(() => {
    const d = dayjs(datetime)
    if (!d.isValid()) return '无效日期'
    return d.toNow()
  }, [datetime])

  return (
    <Section title="相对时间 Time from now" tag="fromNow / toNow">
      <DatetimeFields
        value={datetime}
        onChange={setDatetime}
        dateLabel="目标日期"
        timeLabel="目标时间"
      />
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">距现在（fromNow）</p>
        <ResultBox>{fromNow}</ResultBox>
      </div>
      <div>
        <p className="mb-1 text-xs font-mono text-retro-muted">到现在（toNow）</p>
        <ResultBox>{toNow}</ResultBox>
      </div>
    </Section>
  )
}

function DiffTool() {
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
      return { ok: false as const, message: '无效日期' }
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
  }, [start, end])

  return (
    <Section title="日期差值 Difference" tag="dayjs.diff">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-mono text-retro-muted">开始</p>
          <DatetimeFields
            value={start}
            onChange={setStart}
            dateLabel="开始日期"
            timeLabel="开始时间"
          />
        </div>
        <PixelDivider spacing="sm" />
        <div>
          <p className="mb-2 text-xs font-mono text-retro-muted">结束</p>
          <DatetimeFields
            value={end}
            onChange={setEnd}
            dateLabel="结束日期"
            timeLabel="结束时间"
          />
        </div>
      </div>
      {!diff.ok ? (
        <ResultBox>{diff.message}</ResultBox>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">天数</p>
            <ResultBox>{diff.days} 天</ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">小时</p>
            <ResultBox>{diff.hours} 小时</ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">分钟</p>
            <ResultBox>{diff.minutes} 分钟</ResultBox>
          </div>
          <div>
            <p className="mb-1 text-xs font-mono text-retro-muted">秒</p>
            <ResultBox>{diff.seconds} 秒</ResultBox>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-mono text-retro-muted">人性化</p>
            <ResultBox>{diff.humanized}</ResultBox>
          </div>
        </div>
      )}
    </Section>
  )
}

export function DateTools() {
  return (
    <Layout title="日期工具">
      <p className="text-sm text-retro-muted">
        基于 dayjs：格式化、相对时间、日期差值。所有计算在浏览器本地完成。日期用{' '}
        <PixelBadge tone="cyan" size="sm">
          PixelDatePicker
        </PixelBadge>
        ，时间用{' '}
        <PixelBadge tone="cyan" size="sm">
          PixelInput type=&quot;time&quot;
        </PixelBadge>
        （pxlkit 无合并的 datetime 控件）。
      </p>
      <FormatTool />
      <FromNowTool />
      <DiffTool />
    </Layout>
  )
}
