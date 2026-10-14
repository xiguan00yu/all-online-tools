import { useMemo, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
import {
  Card,
  DatePicker,
  Divider,
  Input,
  Select,
  Tag,
  TimePicker,
  Title,
} from 'animal-island-ui'
import { Layout } from '../components/Layout'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('zh-cn')

const FORMAT_PRESETS = [
  { key: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
  { key: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  { key: 'YYYY年MM月DD日', label: 'YYYY年MM月DD日' },
  { key: 'YYYY-MM-DDTHH:mm:ssZ', label: 'ISO 8601' },
  { key: 'X', label: 'Unix 秒' },
  { key: 'x', label: 'Unix 毫秒' },
]

/** Split / join helpers: DatePicker is date-only; TimePicker is HH:mm:ss. */
function splitDatetime(value: string): { date: string; time: string } {
  const d = dayjs(value)
  if (!d.isValid()) {
    return { date: dayjs().format('YYYY-MM-DD'), time: '00:00:00' }
  }
  return { date: d.format('YYYY-MM-DD'), time: d.format('HH:mm:ss') }
}

function joinDatetime(date: string | null, time: string | null): string {
  const d = date && /^\d{4}-\d{2}-\d{2}/.test(date) ? date : dayjs().format('YYYY-MM-DD')
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : '00:00:00'
  const normalized = t.length === 5 ? `${t}:00` : t
  return `${d}T${normalized}`
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 text-sm font-medium text-slate-600">{children}</div>
  )
}

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <Card color="app-blue" className="!p-3">
      <code className="break-all text-sm text-sky-900">{children}</code>
    </Card>
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
  return (
    <Card color="default">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Title size="middle" color="app-blue" variant="tab">
          {title}
        </Title>
        {tag ? (
          <Tag color="app-teal" variant="soft" size="small">
            {tag}
          </Tag>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

/** Date + time row using animal-island-ui DatePicker + TimePicker. */
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
      <div>
        <FieldLabel>{dateLabel}</FieldLabel>
        <DatePicker
          value={date}
          onChange={(v) => {
            const nextDate = typeof v === 'string' ? v : date
            onChange(joinDatetime(nextDate, time))
          }}
          allowClear={false}
          showToday
          aria-label={dateLabel}
        />
      </div>
      <div>
        <FieldLabel>{timeLabel}</FieldLabel>
        <TimePicker
          value={time}
          onChange={(v) => {
            onChange(joinDatetime(date, v))
          }}
          allowClear={false}
          format="HH:mm:ss"
          aria-label={timeLabel}
        />
      </div>
    </div>
  )
}

function FormatTool() {
  const [datetime, setDatetime] = useState(() =>
    dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  )
  const [preset, setPreset] = useState(FORMAT_PRESETS[0].key)
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
      <div>
        <FieldLabel>格式预设</FieldLabel>
        <Select
          options={FORMAT_PRESETS}
          value={preset}
          onChange={(key) => {
            setPreset(key)
            setCustomFormat('')
          }}
          placeholder="选择格式"
          aria-label="格式预设"
        />
      </div>
      <div>
        <FieldLabel>自定义格式（可选，覆盖预设）</FieldLabel>
        <Input
          type="text"
          placeholder="例如 YYYY-MM-DD HH:mm"
          value={customFormat}
          onChange={(e) => setCustomFormat(e.target.value)}
          allowClear
          onClear={() => setCustomFormat('')}
        />
      </div>
      <div>
        <FieldLabel>输出</FieldLabel>
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
        <FieldLabel>距现在（fromNow）</FieldLabel>
        <ResultBox>{fromNow}</ResultBox>
      </div>
      <div>
        <FieldLabel>到现在（toNow）</FieldLabel>
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
          <FieldLabel>开始</FieldLabel>
          <DatetimeFields
            value={start}
            onChange={setStart}
            dateLabel="开始日期"
            timeLabel="开始时间"
          />
        </div>
        <Divider type="hairline" />
        <div>
          <FieldLabel>结束</FieldLabel>
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
            <FieldLabel>天数</FieldLabel>
            <ResultBox>{diff.days} 天</ResultBox>
          </div>
          <div>
            <FieldLabel>小时</FieldLabel>
            <ResultBox>{diff.hours} 小时</ResultBox>
          </div>
          <div>
            <FieldLabel>分钟</FieldLabel>
            <ResultBox>{diff.minutes} 分钟</ResultBox>
          </div>
          <div>
            <FieldLabel>秒</FieldLabel>
            <ResultBox>{diff.seconds} 秒</ResultBox>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>人性化</FieldLabel>
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
      <p className="text-sm text-slate-500">
        基于 dayjs：格式化、相对时间、日期差值。所有计算在浏览器本地完成。
        日期与时间分别使用 animal-island-ui 的 DatePicker / TimePicker（库无单一
        datetime 控件）。
      </p>
      <FormatTool />
      <FromNowTool />
      <DiffTool />
    </Layout>
  )
}
