import { useState, type ReactNode } from 'react'
import { PixelBadge, PixelButton, PixelCodeInline } from '@pxlkit/ui-kit'
import { previewScalar } from './parseLines'

type JsonTreeProps = {
  value: unknown
  /** Root label, e.g. line number. */
  label?: string
  /** Expand first level by default. */
  defaultOpen?: boolean
}

export function JsonTree({ value, label = 'root', defaultOpen = true }: JsonTreeProps) {
  return (
    <div className="font-mono text-xs text-retro-text">
      <TreeNode name={label} value={value} depth={0} defaultOpen={defaultOpen} />
    </div>
  )
}

function TreeNode({
  name,
  value,
  depth,
  defaultOpen,
}: {
  name: string
  value: unknown
  depth: number
  defaultOpen: boolean
}) {
  const isExpandable =
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value)
      ? value.length > 0
      : Object.keys(value as object).length > 0)

  const [open, setOpen] = useState(defaultOpen && depth < 2)

  if (!isExpandable) {
    return (
      <div className="flex flex-wrap items-baseline gap-1 py-0.5">
        <span className="text-retro-cyan">{name}</span>
        <span className="text-retro-muted">:</span>
        <ValueLeaf value={value} />
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>)

  const summary = isArray
    ? `Array(${entries.length})`
    : `Object(${entries.length})`

  return (
    <div className="py-0.5">
      <button
        type="button"
        className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-sm text-left hover:bg-retro-border/20"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="inline-block w-3 shrink-0 text-retro-muted" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className="text-retro-cyan">{name}</span>
        <span className="text-retro-muted">:</span>
        <PixelBadge tone="neutral" size="sm">
          {summary}
        </PixelBadge>
      </button>
      {open ? (
        <div className="ml-3 border-l border-retro-border/40 pl-2">
          {entries.map(([k, v]) => (
            <TreeNode
              key={`${depth}:${k}`}
              name={k}
              value={v}
              depth={depth + 1}
              defaultOpen={depth + 1 < 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ValueLeaf({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-retro-muted">null</span>
  }
  if (typeof value === 'string') {
    return (
      <PixelCodeInline tone="green">{previewScalar(value, 120)}</PixelCodeInline>
    )
  }
  if (typeof value === 'number') {
    return <span className="text-retro-gold">{String(value)}</span>
  }
  if (typeof value === 'boolean') {
    return (
      <span className="text-retro-pink">{value ? 'true' : 'false'}</span>
    )
  }
  if (Array.isArray(value) && value.length === 0) {
    return <span className="text-retro-muted">[]</span>
  }
  if (typeof value === 'object' && Object.keys(value as object).length === 0) {
    return <span className="text-retro-muted">{'{}'}</span>
  }
  return <span>{previewScalar(value)}</span>
}

export function ExpandControls({
  onExpandAll,
  onCollapseAll,
  expandLabel,
  collapseLabel,
}: {
  onExpandAll: () => void
  onCollapseAll: () => void
  expandLabel: string
  collapseLabel: string
}): ReactNode {
  return (
    <div className="flex flex-wrap gap-2">
      <PixelButton type="button" size="sm" tone="neutral" variant="ghost" onClick={onExpandAll}>
        {expandLabel}
      </PixelButton>
      <PixelButton type="button" size="sm" tone="neutral" variant="ghost" onClick={onCollapseAll}>
        {collapseLabel}
      </PixelButton>
    </div>
  )
}
