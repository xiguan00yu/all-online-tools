import { PixelProgress } from '@pxlkit/ui-kit'
import type { InitProgressReport } from '@mlc-ai/web-llm'

type ProgressPanelProps = {
  report: InitProgressReport | null
  label: string
}

export function ProgressPanel({ report, label }: ProgressPanelProps) {
  const pct = report
    ? Math.max(0, Math.min(100, Math.round(report.progress * 100)))
    : 0
  const indeterminate = !report || report.progress <= 0 || report.progress >= 1

  return (
    <div className="space-y-1">
      <PixelProgress
        value={pct}
        label={label}
        tone="cyan"
        showValue={!indeterminate || (report?.progress ?? 0) > 0}
        indeterminate={indeterminate && (report?.progress ?? 0) < 1}
      />
      {report?.text ? (
        <p className="font-mono text-[10px] leading-snug text-retro-muted sm:text-xs">
          {report.text}
        </p>
      ) : null}
    </div>
  )
}
