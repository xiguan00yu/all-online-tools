import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  InitProgressReport,
  MLCEngineInterface,
} from '@mlc-ai/web-llm'

export type EnginePhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'unsupported'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

function detectWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function useWebLLM() {
  const engineRef = useRef<MLCEngineInterface | null>(null)
  const loadedModelRef = useRef<string | null>(null)
  const abortingRef = useRef(false)

  const [webgpuOk] = useState(() => detectWebGPU())
  const [phase, setPhase] = useState<EnginePhase>(() =>
    detectWebGPU() ? 'idle' : 'unsupported',
  )
  const [progress, setProgress] = useState<InitProgressReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const unload = useCallback(async () => {
    const eng = engineRef.current
    engineRef.current = null
    loadedModelRef.current = null
    setLoadedModelId(null)
    if (eng) {
      try {
        await eng.unload()
      } catch {
        /* ignore unload errors */
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      const eng = engineRef.current
      engineRef.current = null
      if (eng) {
        void eng.unload().catch(() => undefined)
      }
    }
  }, [])

  const loadModel = useCallback(async (modelId: string) => {
    if (!detectWebGPU()) {
      setPhase('unsupported')
      return
    }

    setError(null)
    setProgress(null)
    setPhase('loading')

    try {
      if (engineRef.current && loadedModelRef.current === modelId) {
        setPhase('ready')
        setLoadedModelId(modelId)
        return
      }

      if (engineRef.current) {
        try {
          await engineRef.current.unload()
        } catch {
          /* ignore */
        }
        engineRef.current = null
        loadedModelRef.current = null
        setLoadedModelId(null)
      }

      // Lazy-load the heavy WebLLM runtime only when the user loads a model.
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          setProgress(report)
        },
      })

      engineRef.current = engine
      loadedModelRef.current = modelId
      setLoadedModelId(modelId)
      setPhase('ready')
      setProgress(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? 'Unknown error')
      setError(message)
      setPhase('error')
      engineRef.current = null
      loadedModelRef.current = null
      setLoadedModelId(null)
    }
  }, [])

  const stop = useCallback(() => {
    abortingRef.current = true
    try {
      engineRef.current?.interruptGenerate()
    } catch {
      /* ignore */
    }
  }, [])

  const chat = useCallback(
    async (
      messages: ChatMessage[],
      onDelta: (text: string) => void,
    ): Promise<string> => {
      const engine = engineRef.current
      if (!engine || phase !== 'ready') {
        throw new Error('Engine not ready')
      }

      abortingRef.current = false
      setGenerating(true)

      const apiMessages = messages
        .filter(
          (m) =>
            m.role === 'user' || m.role === 'assistant' || m.role === 'system',
        )
        .map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }))

      let full = ''
      try {
        const chunks = await engine.chat.completions.create({
          messages: apiMessages,
          stream: true,
          stream_options: { include_usage: false },
        })

        for await (const chunk of chunks) {
          if (abortingRef.current) break
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            full += delta
            onDelta(full)
          }
        }
      } finally {
        setGenerating(false)
        abortingRef.current = false
      }

      return full
    },
    [phase],
  )

  return {
    webgpuOk,
    phase,
    progress,
    error,
    loadedModelId,
    generating,
    loadModel,
    unload,
    stop,
    chat,
  }
}
