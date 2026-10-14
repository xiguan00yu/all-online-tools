/** Pinned to match the installed `@mediapipe/tasks-vision` version. */
export const MEDIAPIPE_VERSION = '1.1.0'

export const WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`

export const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

export type OverlayMode = 'box' | 'mesh'

export const OVERLAY_MODE_OPTIONS: { value: OverlayMode; label: string }[] = [
  { value: 'box', label: '人脸框' },
  { value: 'mesh', label: '点线标记' },
]
