import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelDivider,
  PixelSectionHeader,
} from '@pxlkit/ui-kit'
import { Composer } from '../components/chat/Composer'
import { CHAT_HISTORY_KEY, CHAT_MODEL_KEY } from '../components/chat/constants'
import { MessageList } from '../components/chat/MessageList'
import { ModelPicker } from '../components/chat/ModelPicker'
import { ProgressPanel } from '../components/chat/ProgressPanel'
import {
  DEFAULT_CHAT_MODEL_ID,
  findChatModel,
  isKnownChatModel,
} from '../components/chat/models'
import {
  useWebLLM,
  type ChatMessage,
} from '../components/chat/useWebLLM'
import { useI18n } from '../i18n'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function loadStoredModel(): string {
  try {
    const raw = localStorage.getItem(CHAT_MODEL_KEY)
    if (raw && isKnownChatModel(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_CHAT_MODEL_ID
}

function loadStoredHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === 'object' &&
          typeof (m as ChatMessage).id === 'string' &&
          ((m as ChatMessage).role === 'user' ||
            (m as ChatMessage).role === 'assistant') &&
          typeof (m as ChatMessage).content === 'string',
      )
      .slice(-100)
  } catch {
    return []
  }
}

export function ChatTools() {
  const { t } = useI18n()
  const {
    webgpuOk,
    phase,
    progress,
    error,
    loadedModelId,
    generating,
    loadModel,
    stop,
    chat,
  } = useWebLLM()

  const [modelId, setModelId] = useState(loadStoredModel)
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredHistory)

  useEffect(() => {
    document.title = t('chat.documentTitle')
  }, [t])

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_MODEL_KEY, modelId)
    } catch {
      /* ignore */
    }
  }, [modelId])

  useEffect(() => {
    // Persist finished turns only (skip while streaming empty assistant stub).
    if (generating) return
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-100)))
    } catch {
      /* ignore */
    }
  }, [messages, generating])

  const selectedModel = useMemo(() => findChatModel(modelId), [modelId])

  const phaseBadge = useMemo(() => {
    if (!webgpuOk) return { tone: 'red' as const, text: t('chat.phaseUnsupported') }
    if (phase === 'loading') return { tone: 'cyan' as const, text: t('chat.phaseLoading') }
    if (phase === 'ready') return { tone: 'green' as const, text: t('chat.phaseReady') }
    if (phase === 'error') return { tone: 'red' as const, text: t('chat.phaseError') }
    return { tone: 'neutral' as const, text: t('chat.phaseIdle') }
  }, [webgpuOk, phase, t])

  const handleLoad = useCallback(() => {
    if (!webgpuOk || generating) return
    const model = findChatModel(modelId)
    const sizeHint = model?.sizeHint ?? 'hundreds of MB–GB'
    if (
      !window.confirm(
        t('chat.loadConfirm', { model: model?.label ?? modelId, size: sizeHint }),
      )
    ) {
      return
    }
    void loadModel(modelId)
  }, [webgpuOk, generating, modelId, loadModel, t])

  const handleClear = useCallback(() => {
    if (generating) return
    if (messages.length === 0) return
    if (!window.confirm(t('chat.clearConfirm'))) return
    setMessages([])
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY)
    } catch {
      /* ignore */
    }
  }, [generating, messages.length, t])

  const handleSend = useCallback(
    async (text: string) => {
      if (phase !== 'ready' || generating) return

      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: text,
      }
      const assistantId = newId()
      const assistantStub: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
      }

      const nextHistory = [...messages, userMsg]
      setMessages([...nextHistory, assistantStub])

      try {
        const full = await chat(nextHistory, (partial) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: partial } : m,
            ),
          )
        })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: full || m.content || t('chat.stoppedEmpty') }
              : m,
          ),
        )
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : String(err ?? t('chat.unknownError'))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: m.content || t('chat.generateFailed', { detail }),
                }
              : m,
          ),
        )
      }
    },
    [phase, generating, messages, chat, t],
  )

  const canChat = phase === 'ready' && !generating && loadedModelId === modelId
  const loadDisabled = !webgpuOk || generating || phase === 'loading'

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-retro-border/40 px-3 pb-3 pt-3 pr-28 sm:px-4 sm:pr-36">
        <div className="flex flex-wrap items-center gap-2">
          <PixelButton
            type="button"
            variant="ghost"
            tone="cyan"
            size="sm"
            onClick={() => {
              window.location.assign('./index.html')
            }}
          >
            {t('common.backHome')}
          </PixelButton>
          <PixelSectionHeader
            title={t('chat.title')}
            titleTone="cyan"
            size="md"
            as="h1"
            className="!mb-0 min-w-0 flex-1"
          />
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            WebLLM
          </PixelBadge>
        </div>

        <p className="mt-2 text-xs text-retro-muted sm:text-sm">{t('chat.intro')}</p>

        {!webgpuOk ? (
          <div className="mt-3">
            <PixelAlert
              tone="red"
              label={t('chat.webgpuRequired')}
              message={t('chat.webgpuMessage')}
              live="polite"
            />
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <ModelPicker
            label={t('chat.modelLabel')}
            value={modelId}
            onChange={setModelId}
            disabled={generating || phase === 'loading'}
            placeholder={t('chat.modelPlaceholder')}
          />
          <div className="flex flex-wrap gap-2">
            <PixelButton
              type="button"
              tone="cyan"
              size="sm"
              disabled={loadDisabled}
              onClick={handleLoad}
            >
              {phase === 'loading'
                ? t('chat.loading')
                : loadedModelId === modelId && phase === 'ready'
                  ? t('chat.reloadModel')
                  : t('chat.loadModel')}
            </PixelButton>
            <PixelButton
              type="button"
              tone="neutral"
              variant="outline"
              size="sm"
              disabled={generating || messages.length === 0}
              onClick={handleClear}
            >
              {t('chat.clear')}
            </PixelButton>
          </div>
        </div>

        {phase === 'loading' ? (
          <div className="mt-3">
            <ProgressPanel report={progress} label={t('chat.downloadProgress')} />
          </div>
        ) : null}

        {phase === 'error' && error ? (
          <div className="mt-3">
            <PixelAlert
              tone="red"
              label={t('common.loadFailed')}
              message={error}
              live="assertive"
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PixelBadge tone={phaseBadge.tone} size="sm">
            {phaseBadge.text}
          </PixelBadge>
          {loadedModelId ? (
            <PixelBadge tone="green" size="sm" className="max-w-full whitespace-normal break-all">
              {t('chat.loadedModel', {
                model: findChatModel(loadedModelId)?.label ?? loadedModelId,
              })}
            </PixelBadge>
          ) : null}
          {selectedModel ? (
            <span className="font-mono text-[10px] text-retro-muted sm:text-xs">
              {t('chat.sizeHint', { size: selectedModel.sizeHint })}
            </span>
          ) : null}
        </div>

        <PixelDivider spacing="sm" className="mt-2" />
        <p className="font-mono text-[10px] text-retro-muted/80 sm:text-xs">
          {t('chat.caveats')}
        </p>
      </header>

      <main className="relative min-h-0 flex-1 overflow-y-auto bg-retro-bg">
        <MessageList
          messages={messages}
          emptyText={
            phase === 'ready' ? t('chat.emptyReady') : t('chat.emptyIdle')
          }
          userLabel={t('chat.roleUser')}
          assistantLabel={t('chat.roleAssistant')}
          streaming={generating}
        />
      </main>

      <Composer
        disabled={!canChat}
        generating={generating}
        placeholder={
          canChat || generating
            ? t('chat.inputPlaceholder')
            : t('chat.inputDisabled')
        }
        sendLabel={t('chat.send')}
        stopLabel={t('chat.stop')}
        onSend={(text) => {
          void handleSend(text)
        }}
        onStop={stop}
      />
    </div>
  )
}
