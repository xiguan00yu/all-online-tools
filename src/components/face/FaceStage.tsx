import { useEffect, useRef, useState } from 'react'
import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import type { AccessoryId } from './accessories'
import type { OverlayMode } from './constants'
import { drawFaceOverlay } from './drawOverlay'
import type { DetectPhase } from './types'

type FaceStageProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarker: FaceLandmarker | null
  mode: OverlayMode
  mirror: boolean
  active: boolean
  accessories: ReadonlySet<AccessoryId>
  idleHint: string
  onDetectPhase: (phase: DetectPhase) => void
}

export function FaceStage({
  videoRef,
  landmarker,
  mode,
  mirror,
  active,
  accessories,
  idleHint,
  onDetectPhase,
}: FaceStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const modeRef = useRef(mode)
  const landmarkerRef = useRef(landmarker)
  const accessoriesRef = useRef(accessories)
  const onDetectPhaseRef = useRef(onDetectPhase)
  const [ready, setReady] = useState(false)

  modeRef.current = mode
  landmarkerRef.current = landmarker
  accessoriesRef.current = accessories
  onDetectPhaseRef.current = onDetectPhase

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const markReady = () => {
      if (video.videoWidth > 0) setReady(true)
    }
    markReady()
    video.addEventListener('loadedmetadata', markReady)
    video.addEventListener('playing', markReady)
    return () => {
      video.removeEventListener('loadedmetadata', markReady)
      video.removeEventListener('playing', markReady)
    }
  }, [videoRef, active])

  useEffect(() => {
    if (!active || !ready) {
      onDetectPhaseRef.current('idle')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let lastVideoTime = -1
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const lm = landmarkerRef.current
      if (
        lm &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth
        }
        if (canvas.height !== video.videoHeight) {
          canvas.height = video.videoHeight
        }

        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          let result: FaceLandmarkerResult | null = null
          try {
            result = lm.detectForVideo(video, performance.now())
          } catch {
            result = null
          }
          const hasFace = drawFaceOverlay(
            ctx,
            result,
            modeRef.current,
            canvas.width,
            canvas.height,
            accessoriesRef.current,
          )
          onDetectPhaseRef.current(hasFace ? 'running' : 'no-face')
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onDetectPhaseRef.current('idle')
    }
  }, [active, ready, videoRef])

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm border border-retro-border bg-black"
      style={{ aspectRatio: '4 / 3' }}
    >
      <div
        className="absolute inset-0"
        style={mirror ? { transform: 'scaleX(-1)' } : undefined}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      </div>
      {!active ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center text-sm text-retro-muted">
          {idleHint}
        </div>
      ) : null}
    </div>
  )
}
