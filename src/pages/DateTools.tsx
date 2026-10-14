import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
import { Layout } from '../components/Layout'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('zh-cn')

const FORMAT_PRESETS = [
  { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
  { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' },
  { label: 'ISO 8601', value: 'YYYY-MM-DDTHH:mm:ssZ' },
  { label: 'Unix 秒', value: 'X' },
  { label: 'Unix 毫秒', value: 'x' },
]

function toDatetimeLocalValue(d: dayjs.Dayjs) {
  return d.format('YYYY-MM-DDTHH:mm:ss')
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-600">{children}</label>
  )
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${props.className ?? ''}`}
    />
  )
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${props.className ?? ''}`}
    />
  )
}

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-sky-50 px-3 py-3 font-mono text-sm break-all text-sky-900">
      {children}
    </div>
  )
}

function FormatTool() {
  const [datetime, setDatetime] = useState(() =>
    toDatetimeLocalValue(dayjs()),
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
    <Section title="格式化 Format">
      <div>
        <FieldLabel>日期时间</FieldLabel>
        <TextInput
          type="datetime-local"
          step="1"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </div>
      <div>
        <FieldLabel>格式预设</FieldLabel>
        <Select
          value={preset}
          onChange={(e) => {
            setPreset(e.target.value)
            setCustomFormat('')
          }}
        >
          {FORMAT_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel>自定义格式（可选，覆盖预设）</FieldLabel>
        <TextInput
          type="text"
          placeholder="例如 YYYY-MM-DD HH:mm"
          value={customFormat}
          onChange={(e) => setCustomFormat(e.target.value)}
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
    toDatetimeLocalValue(dayjs().subtract(1, 'day')),
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
    <Section title="相对时间 Time from now">
      <div>
        <FieldLabel>目标日期</FieldLabel>
        <TextInput
          type="datetime-local"
          step="1"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </div>
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
    toDatetimeLocalValue(dayjs().subtract(2, 'day')),
  )
  const [end, setEnd] = useState(() => toDatetimeLocalValue(dayjs()))

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
    <Section title="日期差值 Difference">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>开始日期</FieldLabel>
          <TextInput
            type="datetime-local"
            step="1"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>结束日期</FieldLabel>
          <TextInput
            type="datetime-local"
            step="1"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
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
      </p>
      <FormatTool />
      <FromNowTool />
      <DiffTool />
    </Layout>
  )
}
