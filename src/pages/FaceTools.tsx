import { useCallback, useEffect, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelSegmented,
  PixelSwitch,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import {
  OVERLAY_MODE_OPTIONS,
  type OverlayMode,
} from '../components/face/constants'
import { getFaceLandmarker } from '../components/face/createFaceLandmarker'
import { FaceStage } from '../components/face/FaceStage'
import type { DetectPhase, ModelPhase } from '../components/face/types'
import { useCamera } from '../components/face/useCamera'

function cameraStatusText(
  phase: ReturnType<typeof useCamera>['phase'],
  detect: DetectPhase,
): string {
  switch (phase) {
    case 'idle':
      return '尚未开启摄像头'
    case 'requesting':
      return '正在请求摄像头权限…'
    case 'denied':
      return '摄像头权限被拒绝'
    case 'unavailable':
      return '摄像头不可用'
    case 'error':
      return '摄像头出错'
    case 'streaming':
      if (detect === 'no-face') return '未检测到人脸 · 请正对镜头'
      if (detect === 'running') return '实时检测中'
      return '摄像头已开启 · 等待检测'
    default:
      return ''
  }
}

export function FaceTools() {
  const camera = useCamera()
  const [mode, setMode] = useState<OverlayMode>('box')
  const [mirror, setMirror] = useState(true)
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null)
  const [modelPhase, setModelPhase] = useState<ModelPhase>('idle')
  const [modelError, setModelError] = useState<string | null>(null)
  const [detectPhase, setDetectPhase] = useState<DetectPhase>('idle')

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
        err instanceof Error
          ? err.message
          : '模型加载失败（需联网下载 WASM / 模型）',
      )
      return null
    }
  }, [landmarker, modelPhase])

  const handleStart = async () => {
    const lm = await ensureModel()
    if (!lm) return
    await camera.start()
  }

  const handleStop = () => {
    camera.stop()
    setDetectPhase('idle')
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
    <Layout title="人脸识别" wide>
      <p className="text-sm text-retro-muted">
        浏览器本地实时人脸检测：开启前置摄像头后，用 MediaPipe Face Landmarker
        在画面上叠加{' '}
        <PixelBadge tone="cyan" size="sm">
          人脸框
        </PixelBadge>{' '}
        或{' '}
        <PixelBadge tone="green" size="sm">
          点线标记
        </PixelBadge>
        。画面与模型均在本机处理，不会上传。
      </p>

      <PixelCard tone="neutral">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
            实时预览
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
              开启摄像头
            </PixelButton>
          ) : (
            <PixelButton
              type="button"
              tone="neutral"
              variant="outline"
              size="sm"
              onClick={handleStop}
            >
              关闭摄像头
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
              重试加载模型
            </PixelButton>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <PixelSegmented
            label="叠加模式"
            aria-label="叠加模式"
            tone="cyan"
            value={mode}
            options={OVERLAY_MODE_OPTIONS}
            onChange={(next) => {
              if (next === 'box' || next === 'mesh') setMode(next)
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <PixelSwitch
              checked={mirror}
              onChange={setMirror}
              label="镜像预览（自拍）"
            />
            <PixelBadge tone="neutral" size="sm">
              {mirror ? '已镜像 · 符合自拍习惯' : '原始画面 · 未镜像'}
            </PixelBadge>
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
            摄像头 · {camera.phase}
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
            模型 · {modelPhase}
          </PixelBadge>
          {detectionActive ? (
            <PixelBadge
              tone={detectPhase === 'running' ? 'cyan' : 'gold'}
              size="sm"
            >
              {detectPhase === 'running'
                ? '检测到人脸'
                : detectPhase === 'no-face'
                  ? '未检测到人脸'
                  : '检测中'}
            </PixelBadge>
          ) : null}
        </div>

        <p className="mt-3 font-mono text-xs text-retro-muted">
          {cameraStatusText(camera.phase, detectPhase)}
          {modelPhase === 'loading' ? ' · 正在下载 WASM / 模型…' : ''}
        </p>
      </PixelCard>

      {camera.phase === 'denied' ? (
        <PixelAlert
          tone="red"
          label="权限被拒绝"
          message={
            camera.errorMessage ??
            '请在浏览器地址栏允许摄像头，并用 HTTPS 或 localhost 访问。'
          }
        />
      ) : null}

      {camera.phase === 'unavailable' || camera.phase === 'error' ? (
        <PixelAlert
          tone="red"
          label="摄像头不可用"
          message={
            camera.errorMessage ??
            '无法访问摄像头。非安全上下文（非 HTTPS / localhost）也会失败。'
          }
        />
      ) : null}

      {modelPhase === 'error' ? (
        <PixelAlert
          tone="red"
          label="模型加载失败"
          message={
            modelError ??
            '无法加载 MediaPipe WASM 或 face_landmarker 模型，请检查网络后重试。'
          }
        />
      ) : null}

      <FaceStage
        videoRef={camera.videoRef}
        landmarker={landmarker}
        mode={mode}
        mirror={mirror}
        active={detectionActive}
        onDetectPhase={setDetectPhase}
      />

      <PixelCard tone="neutral" padding="md">
        <p className="text-xs leading-relaxed text-retro-muted">
          提示：摄像头需要{' '}
          <span className="text-retro-cyan">HTTPS</span> 或{' '}
          <span className="text-retro-cyan">localhost</span>
          。首次加载会从 CDN 拉取 WASM 与约 3–4 MB 的模型；之后浏览器可能缓存。关闭本页或点「关闭摄像头」会停止轨道。
        </p>
      </PixelCard>
    </Layout>
  )
}
