import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraPhase } from './types'

function stopStream(stream: MediaStream | null) {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

function mapGetUserMediaError(err: unknown): CameraPhase {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name: string }).name)
      : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'denied'
  }
  if (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    name === 'OverconstrainedError'
  ) {
    return 'unavailable'
  }
  return 'error'
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<CameraPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current
    if (!video) {
      stopStream(stream)
      return
    }
    video.srcObject = stream
    streamRef.current = stream
    try {
      await video.play()
      setPhase('streaming')
      setErrorMessage(null)
    } catch (err) {
      stopStream(stream)
      streamRef.current = null
      video.srcObject = null
      setPhase('error')
      setErrorMessage(
        err instanceof Error ? err.message : '无法播放摄像头画面',
      )
    }
  }, [])

  const start = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setPhase('unavailable')
      setErrorMessage('当前浏览器不支持摄像头（需要 HTTPS 或 localhost）')
      return
    }

    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setPhase('requesting')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      await attachStream(stream)
    } catch (err) {
      const next = mapGetUserMediaError(err)
      setPhase(next)
      if (next === 'denied') {
        setErrorMessage(
          '摄像头权限被拒绝。请在浏览器设置中允许本站使用摄像头后重试。',
        )
      } else if (next === 'unavailable') {
        setErrorMessage('未找到可用摄像头，或前置摄像头不可用。')
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : '无法打开摄像头',
        )
      }
    }
  }, [attachStream])

  const stop = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setPhase('idle')
    setErrorMessage(null)
  }, [])

  useEffect(() => {
    return () => {
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [])

  return {
    videoRef,
    phase,
    errorMessage,
    start,
    stop,
    isStreaming: phase === 'streaming',
  }
}
