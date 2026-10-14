import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { useI18n, type TranslateFn } from '../i18n'

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

function describeType(value: unknown, t: TranslateFn): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return t('json.validate.arrayItems', { n: value.length })
  }
  if (typeof value === 'object') {
    return t('json.validate.objectKeys', {
      n: Object.keys(value as object).length,
    })
  }
  return typeof value
}

function FormatTool() {
  const { t } = useI18n()
  const [input, setInput] = useState(SAMPLE_A)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (mode: 'pretty' | 'minify') => {
    const parsed = parseJson(input)
    if (!parsed.ok) {
      setError(formatParseError(parsed.error, t))
      setOutput('')
      return
    }
    setError(null)
    setOutput(mode === 'pretty' ? formatJson(parsed.value, 2) : minifyJson(parsed.value))
  }

  return (
    <Section title={t('json.format.title')} tag="JSON.stringify">
      <PixelTextarea
        label={t('json.input')}
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
          {t('json.format.pretty')}
        </PixelButton>
        <PixelButton
          type="button"
          tone="cyan"
          variant="outline"
          size="sm"
          onClick={() => run('minify')}
        >
          {t('json.format.minify')}
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
          {t('json.format.sample')}
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
            {t('json.format.copy')}
          </PixelButton>
        ) : null}
      </div>
      {error ? (
        <PixelAlert
          tone="red"
          label={t('json.format.cannotFormat')}
          message={error}
        />
      ) : null}
      {output ? (
        <div>
          <p className="mb-1 text-xs font-mono text-retro-muted">
            {t('json.output')}
          </p>
          <ResultBox>{output}</ResultBox>
        </div>
      ) : null}
    </Section>
  )
}

function ValidateTool() {
  const { t } = useI18n()
  const [input, setInput] = useState(SAMPLE_A)
  const result = useMemo(() => parseJson(input), [input])

  return (
    <Section title={t('json.validate.title')} tag="JSON.parse">
      <PixelTextarea
        label={t('json.input')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        tone="cyan"
        spellCheck={false}
        className="font-mono text-xs"
        placeholder={t('json.validate.placeholder')}
      />
      <div className="flex flex-wrap gap-2">
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => setInput(SAMPLE_A)}
        >
          {t('json.validate.validSample')}
        </PixelButton>
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => setInput('{"broken": true,}')}
        >
          {t('json.validate.invalidSample')}
        </PixelButton>
      </div>
      {result.ok ? (
        <PixelAlert
          tone="green"
          label={t('json.validate.valid')}
          message={t('json.validate.type', {
            type: describeType(result.value, t),
          })}
        />
      ) : (
        <div className="space-y-2">
          <PixelAlert
            tone="red"
            label={t('json.validate.invalid')}
            message={formatParseError(result.error, t)}
          />
          <div className="flex flex-wrap gap-2">
            {result.error.line != null ? (
              <PixelBadge tone="pink" size="sm">
                {t('json.validate.line', { n: result.error.line })}
              </PixelBadge>
            ) : null}
            {result.error.column != null ? (
              <PixelBadge tone="pink" size="sm">
                {t('json.validate.column', { n: result.error.column })}
              </PixelBadge>
            ) : null}
            {result.error.position != null ? (
              <PixelBadge tone="pink" size="sm">
                {t('json.validate.position', { n: result.error.position })}
              </PixelBadge>
            ) : null}
          </div>
        </div>
      )}
    </Section>
  )
}

function DiffKindBadge({ kind }: { kind: DiffEntry['kind'] }) {
  const { t } = useI18n()
  const map = {
    added: { tone: 'green' as const, label: t('json.diff.added') },
    removed: { tone: 'red' as const, label: t('json.diff.removed') },
    changed: { tone: 'gold' as const, label: t('json.diff.changed') },
  }
  const m = map[kind]
  return (
    <PixelBadge tone={m.tone} size="sm">
      {m.label}
    </PixelBadge>
  )
}

function DiffTool() {
  const { t } = useI18n()
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)

  const result = useMemo(() => {
    const a = parseJson(left)
    const b = parseJson(right)
    if (!a.ok || !b.ok) {
      return {
        ok: false as const,
        leftError: a.ok ? undefined : formatParseError(a.error, t),
        rightError: b.ok ? undefined : formatParseError(b.error, t),
      }
    }
    const entries = diffJsonValues(a.value, b.value)
    return { ok: true as const, entries, identical: entries.length === 0 }
  }, [left, right, t])

  return (
    <Section title={t('json.diff.title')} tag="structural">
      <p className="text-xs text-retro-muted">
        {t('json.diff.blurbLead')}{' '}
        <PixelCodeInline tone="cyan">JSON.parse</PixelCodeInline>{' '}
        {t('json.diff.blurbTail')}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <PixelTextarea
          label={t('json.diff.left')}
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          rows={10}
          tone="cyan"
          spellCheck={false}
          className="font-mono text-xs"
        />
        <PixelTextarea
          label={t('json.diff.right')}
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
          {t('json.diff.fillSample')}
        </PixelButton>
        <PixelButton
          type="button"
          tone="neutral"
          variant="ghost"
          size="sm"
          onClick={() => {
            setRight(left)
          }}
        >
          {t('json.diff.copyLeftToRight')}
        </PixelButton>
      </div>

      {!result.ok ? (
        <div className="space-y-2">
          {result.leftError ? (
            <PixelAlert
              tone="red"
              label={t('json.diff.leftInvalid')}
              message={result.leftError}
            />
          ) : null}
          {result.rightError ? (
            <PixelAlert
              tone="red"
              label={t('json.diff.rightInvalid')}
              message={result.rightError}
            />
          ) : null}
        </div>
      ) : result.identical ? (
        <PixelAlert
          tone="green"
          label={t('json.diff.identical')}
          message={t('json.diff.identicalMsg')}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {t('json.diff.diffCount', { n: result.entries.length })}
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
  const { t } = useI18n()

  useEffect(() => {
    document.title = t('json.documentTitle')
  }, [t])

  return (
    <Layout title={t('json.title')}>
      <p className="text-sm text-retro-muted">
        {t('json.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          JSON.parse / JSON.stringify
        </PixelBadge>
        {t('json.introTail')}
      </p>
      <FormatTool />
      <PixelDivider spacing="sm" />
      <ValidateTool />
      <PixelDivider spacing="sm" />
      <DiffTool />
    </Layout>
  )
}
