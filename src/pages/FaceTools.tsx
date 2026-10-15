import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelCheckbox,
  PixelSegmented,
  PixelSwitch,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import {
  ACCESSORY_IDS,
  preloadAccessoryImages,
  type AccessoryId,
} from '../components/face/accessories'
import type { OverlayMode } from '../components/face/constants'
import { getFaceLandmarker } from '../components/face/createFaceLandmarker'
import { FaceStage } from '../components/face/FaceStage'
import type { DetectPhase, ModelPhase } from '../components/face/types'
import { useCamera } from '../components/face/useCamera'
import { useI18n, type TranslateFn } from '../i18n'

function cameraStatusText(
  phase: ReturnType<typeof useCamera>['phase'],
  detect: DetectPhase,
  t: TranslateFn,
): string {
  switch (phase) {
    case 'idle':
      return t('face.camIdle')
    case 'requesting':
      return t('face.camRequesting')
    case 'denied':
      return t('face.camDenied')
    case 'unavailable':
      return t('face.camUnavailable')
    case 'error':
      return t('face.camError')
    case 'streaming':
      if (detect === 'no-face') return t('face.camNoFace')
      if (detect === 'running') return t('face.camRunning')
      return t('face.camStreaming')
    default:
      return ''
  }
}

const ACCESSORY_LABEL_KEYS: Record<AccessoryId, string> = {
  'santa-hat': 'face.accSantaHat',
  sunglasses: 'face.accSunglasses',
  mustache: 'face.accMustache',
  'bunny-ears': 'face.accBunnyEars',
}

export function FaceTools() {
  const { t } = useI18n()
  const camera = useCamera()
  const [mode, setMode] = useState<OverlayMode>('box')
  const [mirror, setMirror] = useState(true)
  const [accessories, setAccessories] = useState<Set<AccessoryId>>(
    () => new Set(),
  )
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null)
  const [modelPhase, setModelPhase] = useState<ModelPhase>('idle')
  const [modelError, setModelError] = useState<string | null>(null)
  const [detectPhase, setDetectPhase] = useState<DetectPhase>('idle')

  const overlayOptions = useMemo(
    () => [
      { value: 'box' as const, label: t('face.modeBox') },
      { value: 'mesh' as const, label: t('face.modeMesh') },
    ],
    [t],
  )

  useEffect(() => {
    document.title = t('face.documentTitle')
  }, [t])

  useEffect(() => {
    void preloadAccessoryImages()
  }, [])

  const ensureModel = useCallback(async () => {
    if (landmarker && modelPhase === 'ready') return landmarker
    setModelPhase('loading')
    setModelError(null)
    try {
      const lm = await getFaceLandmarker()
      setLandmarker(lm)
      setModelPhase('ready')
      return lm
    } catch (err) {
      setLandmarker(null)
      setModelPhase('error')
      setModelError(
        err instanceof Error ? err.message : t('face.modelFailedShort'),
      )
      return null
    }
  }, [landmarker, modelPhase, t])

  const handleStart = async () => {
    const lm = await ensureModel()
    if (!lm) return
    await camera.start()
  }

  const handleStop = () => {
    camera.stop()
    setDetectPhase('idle')
  }

  const toggleAccessory = (id: AccessoryId, next: boolean) => {
    setAccessories((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  useEffect(() => {
    return () => {
      camera.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, [])

  const detectionActive =
    camera.isStreaming && modelPhase === 'ready' && !!landmarker

  return (
    <Layout title={t('face.title')} wide>
      <p className="text-sm text-retro-muted">
        {t('face.introLead')}{' '}
        <PixelBadge tone="cyan" size="sm">
          {t('face.badgeBox')}
        </PixelBadge>{' '}
        {t('face.introMid')}{' '}
        <PixelBadge tone="green" size="sm">
          {t('face.badgeMesh')}
        </PixelBadge>
        {t('face.introTail')}
      </p>

      <PixelCard tone="neutral">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
            {t('face.preview')}
          </h4>
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            MediaPipe Face Landmarker
          </PixelBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          {!camera.isStreaming ? (
            <PixelButton
              type="button"
              tone="cyan"
              size="sm"
              loading={
                camera.phase === 'requesting' || modelPhase === 'loading'
              }
              onClick={() => {
                void handleStart()
              }}
            >
              {t('face.startCamera')}
            </PixelButton>
          ) : (
            <PixelButton
              type="button"
              tone="neutral"
              variant="outline"
              size="sm"
              onClick={handleStop}
            >
              {t('face.stopCamera')}
            </PixelButton>
          )}
          {modelPhase === 'error' ? (
            <PixelButton
              type="button"
              tone="cyan"
              variant="outline"
              size="sm"
              onClick={() => {
                void ensureModel()
              }}
            >
              {t('face.retryModel')}
            </PixelButton>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <PixelSegmented
            label={t('face.overlayMode')}
            aria-label={t('face.overlayMode')}
            tone="cyan"
            value={mode}
            options={overlayOptions}
            onChange={(next) => {
              if (next === 'box' || next === 'mesh') setMode(next)
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <PixelSwitch
              checked={mirror}
              onChange={setMirror}
              label={t('face.mirror')}
            />
            <PixelBadge tone="neutral" size="sm">
              {mirror ? t('face.mirrored') : t('face.notMirrored')}
            </PixelBadge>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-retro-text">
              {t('face.accessories')}
            </p>
            <p className="text-xs text-retro-muted">{t('face.accessoriesHint')}</p>
            <div className="flex flex-wrap gap-3">
              {ACCESSORY_IDS.map((id) => (
                <PixelCheckbox
                  key={id}
                  tone="cyan"
                  label={t(ACCESSORY_LABEL_KEYS[id])}
                  checked={accessories.has(id)}
                  onChange={(next) => {
                    toggleAccessory(id, next)
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <PixelBadge
            tone={
              camera.phase === 'streaming'
                ? 'green'
                : camera.phase === 'denied' || camera.phase === 'error'
                  ? 'red'
                  : 'neutral'
            }
            size="sm"
          >
            {t('face.cameraBadge', { phase: camera.phase })}
          </PixelBadge>
          <PixelBadge
            tone={
              modelPhase === 'ready'
                ? 'green'
                : modelPhase === 'error'
                  ? 'red'
                  : modelPhase === 'loading'
                    ? 'gold'
                    : 'neutral'
            }
            size="sm"
          >
            {t('face.modelBadge', { phase: modelPhase })}
          </PixelBadge>
          {detectionActive ? (
            <PixelBadge
              tone={detectPhase === 'running' ? 'cyan' : 'gold'}
              size="sm"
            >
              {detectPhase === 'running'
                ? t('face.faceDetected')
                : detectPhase === 'no-face'
                  ? t('face.noFace')
                  : t('face.detecting')}
            </PixelBadge>
          ) : null}
          {accessories.size > 0 ? (
            <PixelBadge tone="gold" size="sm">
              {t('face.accessoriesOn', { n: String(accessories.size) })}
            </PixelBadge>
          ) : null}
        </div>

        <p className="mt-3 font-mono text-xs text-retro-muted">
          {cameraStatusText(camera.phase, detectPhase, t)}
          {modelPhase === 'loading' ? t('face.modelDownloading') : ''}
        </p>
      </PixelCard>

      {camera.phase === 'denied' ? (
        <PixelAlert
          tone="red"
          label={t('face.permDenied')}
          message={camera.errorMessage ?? t('face.permDeniedMsg')}
        />
      ) : null}

      {camera.phase === 'unavailable' || camera.phase === 'error' ? (
        <PixelAlert
          tone="red"
          label={t('face.camUnavailableLabel')}
          message={camera.errorMessage ?? t('face.camUnavailableMsg')}
        />
      ) : null}

      {modelPhase === 'error' ? (
        <PixelAlert
          tone="red"
          label={t('face.modelFailed')}
          message={modelError ?? t('face.modelFailedMsg')}
        />
      ) : null}

      <FaceStage
        videoRef={camera.videoRef}
        landmarker={landmarker}
        mode={mode}
        mirror={mirror}
        active={detectionActive}
        accessories={accessories}
        idleHint={t('face.idleHint')}
        onDetectPhase={setDetectPhase}
      />

      <PixelCard tone="neutral" padding="md">
        <p className="text-xs leading-relaxed text-retro-muted">{t('face.tip')}</p>
      </PixelCard>
    </Layout>
  )
}
