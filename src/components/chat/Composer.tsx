import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { PixelButton, PixelTextarea } from '@pxlkit/ui-kit'

type ComposerProps = {
  disabled?: boolean
  generating?: boolean
  placeholder: string
  sendLabel: string
  stopLabel: string
  onSend: (text: string) => void
  onStop: () => void
}

export function Composer({
  disabled,
  generating,
  placeholder,
  sendLabel,
  stopLabel,
  onSend,
  onStop,
}: ComposerProps) {
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || generating) return
    onSend(trimmed)
    setText('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-retro-border/40 bg-retro-bg/80 p-3 sm:flex-row sm:items-end sm:p-4"
    >
      <div className="min-w-0 flex-1">
        <PixelTextarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || generating}
          autosize
          minRows={2}
          maxRows={6}
          tone="cyan"
        />
      </div>
      <div className="flex shrink-0 gap-2">
        {generating ? (
          <PixelButton
            type="button"
            tone="neutral"
            variant="outline"
            size="sm"
            onClick={onStop}
          >
            {stopLabel}
          </PixelButton>
        ) : (
          <PixelButton
            type="submit"
            tone="cyan"
            size="sm"
            disabled={disabled || !text.trim()}
          >
            {sendLabel}
          </PixelButton>
        )}
      </div>
    </form>
  )
}
