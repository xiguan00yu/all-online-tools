import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarker as FaceLandmarkerType,
} from '@mediapipe/tasks-vision'
import { FACE_LANDMARKER_MODEL_URL, WASM_ROOT } from './constants'

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null

/**
 * Lazily create a shared FaceLandmarker in VIDEO mode.
 * WASM + model load from CDN on first call (~few MB).
 */
export function getFaceLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    })().catch((err) => {
      landmarkerPromise = null
      throw err
    })
  }
  return landmarkerPromise
}

export function resetFaceLandmarkerCache(): void {
  landmarkerPromise = null
}
