import { useEffect, useRef } from 'react'
import { PixelBadge, PixelCard } from '@pxlkit/ui-kit'
import type { ChatMessage } from './useWebLLM'

type MessageListProps = {
  messages: ChatMessage[]
  emptyText: string
  userLabel: string
  assistantLabel: string
  streaming?: boolean
}

export function MessageList({
  messages,
  emptyText,
  userLabel,
  assistantLabel,
  streaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, streaming])

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center px-4">
        <p className="max-w-md text-center text-sm text-retro-muted">{emptyText}</p>
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-3 p-3 sm:p-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user'
        const isLast = index === messages.length - 1
        const showCursor =
          streaming && isLast && msg.role === 'assistant' && msg.content.length > 0

        return (
          <li
            key={msg.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <PixelCard
              tone={isUser ? 'cyan' : 'neutral'}
              padding="sm"
              className="max-w-[min(100%,36rem)]"
            >
              <div className="mb-1.5">
                <PixelBadge
                  tone={isUser ? 'cyan' : 'green'}
                  size="sm"
                >
                  {isUser ? userLabel : assistantLabel}
                </PixelBadge>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-retro-text">
                {msg.content || (streaming && isLast ? '…' : '')}
                {showCursor ? (
                  <span className="ml-0.5 inline-block animate-pulse text-retro-cyan">
                    ▍
                  </span>
                ) : null}
              </p>
            </PixelCard>
          </li>
        )
      })}
      <div ref={bottomRef} />
    </ul>
  )
}
