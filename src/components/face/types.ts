export type CameraPhase =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'denied'
  | 'unavailable'
  | 'error'

export type ModelPhase = 'idle' | 'loading' | 'ready' | 'error'

export type DetectPhase = 'idle' | 'running' | 'no-face'
