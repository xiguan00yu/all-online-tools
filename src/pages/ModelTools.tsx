import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import * as THREE from 'three'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import { ModelStage } from '../components/model/ModelStage'
import {
  formatBytes,
  isLargeModelFile,
  isModelFile,
  loadGltfFromFile,
} from '../components/model/loadGltf'
import { useI18n, type TranslateFn } from '../i18n'

type Status = {
  kind: 'idle' | 'loading' | 'ready' | 'error' | 'warn'
  text: string
}

function loadErrorMessage(
  result: Extract<Awaited<ReturnType<typeof loadGltfFromFile>>, { ok: false }>,
  t: TranslateFn,
): string {
  if (result.code === 'invalid_type') return t('model.pickPlease')
  const detail = result.detail ?? t('model.unknownError')
  let message = t('model.cannotLoad', { detail })
  if (result.isGltf) message += t('model.gltfHint')
  return message
}

export function ModelTools() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [model, setModel] = useState<THREE.Object3D | null>(null)
  const [fitKey, setFitKey] = useState(0)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null,
  )
  const [status, setStatus] = useState<Status>({
    kind: 'idle',
    text: '',
  })
  const [warn, setWarn] = useState<string | null>(null)

  useEffect(() => {
    document.title = t('model.documentTitle')
  }, [t])

  // Keep idle / empty status strings in sync with locale.
  useEffect(() => {
    setStatus((prev) =>
      prev.kind === 'idle' ? { kind: 'idle', text: t('model.idle') } : prev,
    )
  }, [t])

  const clearLoaded = useCallback(() => {
    setModel(null)
    setFileMeta(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!isModelFile(file)) {
      clearLoaded()
      setWarn(null)
      setStatus({
        kind: 'error',
        text: t('model.badType'),
      })
      return
    }

    clearLoaded()
    setWarn(
      isLargeModelFile(file)
        ? t('model.largeWarn', { size: formatBytes(file.size) })
        : null,
    )
    setStatus({ kind: 'loading', text: t('model.loading', { name: file.name }) })
    setFileMeta({ name: file.name, size: file.size })

    const result = await loadGltfFromFile(file)
    if (result.objectUrl) {
      objectUrlRef.current = result.objectUrl
    }

    if (!result.ok) {
      setModel(null)
      setStatus({ kind: 'error', text: loadErrorMessage(result, t) })
      return
    }

    setModel(result.gltf.scene)
    setFitKey((k) => k + 1)
    setStatus({
      kind: 'ready',
      text: t('model.ready', {
        name: file.name,
        size: formatBytes(file.size),
      }),
    })
  }

  const handleResetView = () => {
    if (!model) return
    setFitKey((k) => k + 1)
    setStatus({
      kind: 'ready',
      text: fileMeta
        ? t('model.resetDone', { name: fileMeta.name })
        : t('model.resetDoneNoName'),
    })
  }

  const handleClear = () => {
    clearLoaded()
    setWarn(null)
    setStatus({
      kind: 'idle',
      text: t('model.idle'),
    })
  }

  return (
    <Layout title={t('model.title')} wide>
      <p className="text-sm text-retro-muted">
        {t('model.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          .glb
        </PixelBadge>{' '}
        {t('model.introTail')}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e)
        }}
      />

      <PixelCard tone="neutral">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
            {t('model.viewer')}
          </h4>
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            three + OrbitControls
          </PixelBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          <PixelButton
            type="button"
            tone="cyan"
            size="sm"
            loading={status.kind === 'loading'}
            onClick={handlePickFile}
          >
            {t('model.open')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            disabled={!model || status.kind === 'loading'}
            onClick={handleResetView}
          >
            {t('model.resetView')}
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            disabled={!model && status.kind !== 'error'}
            onClick={handleClear}
          >
            {t('model.clear')}
          </PixelButton>
        </div>

        {fileMeta ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <PixelBadge tone="green" size="sm">
              {fileMeta.name}
            </PixelBadge>
            <PixelBadge tone="neutral" size="sm">
              {formatBytes(fileMeta.size)}
            </PixelBadge>
          </div>
        ) : null}

        <p className="mt-3 font-mono text-xs text-retro-muted">
          {status.text || t('model.idle')}
        </p>
      </PixelCard>

      {warn ? (
        <PixelAlert
          tone="gold"
          label={t('model.largeWarnLabel')}
          message={warn}
        />
      ) : null}

      {status.kind === 'error' ? (
        <PixelAlert
          tone="red"
          label={t('model.loadFailed')}
          message={status.text}
        />
      ) : null}

      {model ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              {t('model.controls')}
            </PixelBadge>
          </div>
          <ModelStage model={model} fitKey={fitKey} />
        </div>
      ) : (
        status.kind !== 'loading' && (
          <PixelCard tone="neutral" padding="md">
            <p className="text-center text-sm text-retro-muted">
              {t('model.empty')}
            </p>
          </PixelCard>
        )
      )}
    </Layout>
  )
}
