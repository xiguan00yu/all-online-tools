import { useMemo, useState, type ReactNode } from 'react'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelCodeInline,
  PixelDivider,
  PixelTextarea,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import {
  diffJsonValues,
  previewValue,
  type DiffEntry,
} from '../components/json/diffJson'
import {
  formatJson,
  formatParseError,
  minifyJson,
  parseJson,
} from '../components/json/parseJson'

const SAMPLE_A = `{
  "name": "all-online-tools",
  "version": 1,
  "tags": ["json", "tools"],
  "meta": { "ready": true }
}`

const SAMPLE_B = `{
  "name": "all-online-tools",
  "version": 2,
  "tags": ["json", "tools", "diff"],
  "meta": { "ready": true, "author": "xiguan00yu" }
}`

function Section({
  title,
  tag,
  children,
}: {
  title: string
  tag?: string
  children: ReactNode
}) {
  // Same rule as DateTools / Home: keep status tags in-flow with PixelBadge.
  // PixelCard corner `badge` sets overflow-hidden and clips PixelRibbon text.
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

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <PixelCard tone="cyan" padding="sm" bordered>
      <pre className="m-0 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-retro-text">
        {children}
      </pre>
    </PixelCard>
  )
}

function FormatTool() {
  const [input, setInput] = useState(SAMPLE_A)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (mode: 'pretty' | 'minify') => {
    const parsed = parseJson(input)
    if (!parsed.ok) {
      setError(formatParseError(parsed.error))
      setOutput('')
      return
    }
    setError(null)
    setOutput(mode === 'pretty' ? formatJson(parsed.value, 2) : minifyJson(parsed.value))
  }

  return (
    <Section title="格式化 Format" tag="JSON.stringify">
      <PixelTextarea
        label="JSON 输入"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={10}
        tone="cyan"
        spellCheck={false}
        className="font-mono text-xs"
        placeholder='{"hello": "world"}'
      />
      <div className="flex flex-wrap gap-2">
        <PixelButton
          type="button"
          tone="cyan"
          size="sm"
          onClick={() => run('pretty')}
        >
          美化（缩进）
        </PixelButton>
        <PixelButton
          type="button"
          tone="cyan"
          variant="outline"
          size="sm"
          onClick={() => run('minify')}
        >
          压缩 Minify
        </PixelButton>
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => {
            setInput(SAMPLE_A)
            setOutput('')
            setError(null)
          }}
        >
          填入示例
        </PixelButton>
        {output ? (
          <PixelButton
            type="button"
            tone="green"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(output)
            }}
          >
            复制结果
          </PixelButton>
        ) : null}
      </div>
      {error ? (
        <PixelAlert tone="red" label="无法格式化" message={error} />
      ) : null}
      {output ? (
        <div>
          <p className="mb-1 text-xs font-mono text-retro-muted">输出</p>
          <ResultBox>{output}</ResultBox>
        </div>
      ) : null}
    </Section>
  )
}

function ValidateTool() {
  const [input, setInput] = useState(SAMPLE_A)
  const result = useMemo(() => parseJson(input), [input])

  return (
    <Section title="校验 Validate" tag="JSON.parse">
      <PixelTextarea
        label="JSON 输入"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        tone="cyan"
        spellCheck={false}
        className="font-mono text-xs"
        placeholder="粘贴要校验的 JSON"
      />
      <div className="flex flex-wrap gap-2">
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => setInput(SAMPLE_A)}
        >
          有效示例
        </PixelButton>
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => setInput('{"broken": true,}')}
        >
          无效示例
        </PixelButton>
      </div>
      {result.ok ? (
        <PixelAlert
          tone="green"
          label="有效 JSON"
          message={`类型：${describeType(result.value)}`}
        />
      ) : (
        <div className="space-y-2">
          <PixelAlert
            tone="red"
            label="无效 JSON"
            message={formatParseError(result.error)}
          />
          <div className="flex flex-wrap gap-2">
            {result.error.line != null ? (
              <PixelBadge tone="pink" size="sm">
                行 {result.error.line}
              </PixelBadge>
            ) : null}
            {result.error.column != null ? (
              <PixelBadge tone="pink" size="sm">
                列 {result.error.column}
              </PixelBadge>
            ) : null}
            {result.error.position != null ? (
              <PixelBadge tone="pink" size="sm">
                位置 {result.error.position}
              </PixelBadge>
            ) : null}
          </div>
        </div>
      )}
    </Section>
  )
}

function describeType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `array（${value.length} 项）`
  if (typeof value === 'object') {
    return `object（${Object.keys(value as object).length} 个键）`
  }
  return typeof value
}

function DiffKindBadge({ kind }: { kind: DiffEntry['kind'] }) {
  const map = {
    added: { tone: 'green' as const, label: '新增' },
    removed: { tone: 'red' as const, label: '删除' },
    changed: { tone: 'gold' as const, label: '变更' },
  }
  const m = map[kind]
  return (
    <PixelBadge tone={m.tone} size="sm">
      {m.label}
    </PixelBadge>
  )
}

function DiffTool() {
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)

  const result = useMemo(() => {
    const a = parseJson(left)
    const b = parseJson(right)
    if (!a.ok || !b.ok) {
      return {
        ok: false as const,
        leftError: a.ok ? undefined : formatParseError(a.error),
        rightError: b.ok ? undefined : formatParseError(b.error),
      }
    }
    const entries = diffJsonValues(a.value, b.value)
    return { ok: true as const, entries, identical: entries.length === 0 }
  }, [left, right])

  return (
    <Section title="对比 Diff" tag="structural">
      <p className="text-xs text-retro-muted">
        结构对比：对两侧 <PixelCodeInline tone="cyan">JSON.parse</PixelCodeInline>{' '}
        后的值做深度遍历，按路径标出新增 / 删除 / 变更（非行级文本 diff）。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <PixelTextarea
          label="左侧（旧）"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          rows={10}
          tone="cyan"
          spellCheck={false}
          className="font-mono text-xs"
        />
        <PixelTextarea
          label="右侧（新）"
          value={right}
          onChange={(e) => setRight(e.target.value)}
          rows={10}
          tone="cyan"
          spellCheck={false}
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => {
            setLeft(SAMPLE_A)
            setRight(SAMPLE_B)
          }}
        >
          填入对比示例
        </PixelButton>
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => {
            setLeft((v) => v)
            setRight(left)
          }}
        >
          右侧 ← 左侧
        </PixelButton>
      </div>

      {!result.ok ? (
        <div className="space-y-2">
          {result.leftError ? (
            <PixelAlert tone="red" label="左侧无效" message={result.leftError} />
          ) : null}
          {result.rightError ? (
            <PixelAlert tone="red" label="右侧无效" message={result.rightError} />
          ) : null}
        </div>
      ) : result.identical ? (
        <PixelAlert tone="green" label="无差异" message="两侧 JSON 结构与值完全一致" />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {result.entries.length} 处差异
            </PixelBadge>
          </div>
          <ul className="m-0 list-none space-y-2 p-0">
            {result.entries.map((entry) => (
              <li key={`${entry.kind}:${entry.path}`}>
                <PixelCard tone="neutral" padding="sm" bordered>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <DiffKindBadge kind={entry.kind} />
                    <PixelCodeInline tone="cyan">{entry.path}</PixelCodeInline>
                  </div>
                  {entry.kind === 'added' ? (
                    <p className="m-0 font-mono text-xs text-retro-muted">
                      + {previewValue(entry.right)}
                    </p>
                  ) : null}
                  {entry.kind === 'removed' ? (
                    <p className="m-0 font-mono text-xs text-retro-muted">
                      − {previewValue(entry.left)}
                    </p>
                  ) : null}
                  {entry.kind === 'changed' ? (
                    <div className="space-y-1 font-mono text-xs text-retro-muted">
                      <p className="m-0">− {previewValue(entry.left)}</p>
                      <p className="m-0">+ {previewValue(entry.right)}</p>
                    </div>
                  ) : null}
                </PixelCard>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

export function JsonTools() {
  return (
    <Layout title="JSON 工具">
      <p className="text-sm text-retro-muted">
        格式化、校验、结构对比。全部在浏览器本地完成，使用原生{' '}
        <PixelBadge tone="cyan" size="sm">
          JSON.parse / JSON.stringify
        </PixelBadge>
        ，无上传。
      </p>
      <FormatTool />
      <PixelDivider spacing="sm" />
      <ValidateTool />
      <PixelDivider spacing="sm" />
      <DiffTool />
    </Layout>
  )
}
