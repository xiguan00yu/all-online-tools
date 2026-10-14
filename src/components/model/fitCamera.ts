import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/** Soft clamp for absurd skinned-mesh bounds (mirrors Dress fitModel). */
const MAX_DIM_SOFT = 50
const MIN_DIM_SOFT = 0.01

/**
 * Measure world AABB from mesh geometries (more reliable for skinned meshes
 * than Box3.setFromObject alone).
 */
export function measureBox(object: THREE.Object3D): THREE.Box3 {
  object.updateMatrixWorld(true)
  const box = new THREE.Box3()
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return
    const geoBox = mesh.geometry.boundingBox.clone()
    geoBox.applyMatrix4(mesh.matrixWorld)
    box.union(geoBox)
  })
  if (box.isEmpty()) box.setFromObject(object)
  return box
}

/**
 * Fit PerspectiveCamera + OrbitControls so the model fills the view.
 * FOV ~42° matches the Dress scene camera.
 */
export function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
  padding = 1.35,
): THREE.Box3 {
  const box = measureBox(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  let maxDim = Math.max(size.x, size.y, size.z, 0.1)
  if (maxDim > MAX_DIM_SOFT || maxDim < MIN_DIM_SOFT) {
    maxDim = Math.max(Math.min(maxDim, 2), 0.5)
  }

  const fov = (camera.fov * Math.PI) / 180
  let dist = maxDim / 2 / Math.tan(fov / 2)
  dist *= padding
  dist = Math.max(dist, maxDim * 1.2)

  camera.near = Math.max(dist / 100, 0.01)
  camera.far = Math.max(dist * 100, 200)
  camera.updateProjectionMatrix()

  camera.position.set(
    center.x + dist * 0.35,
    center.y + dist * 0.2,
    center.z + dist,
  )
  controls.target.copy(center)
  controls.minDistance = Math.max(maxDim * 0.15, 0.05)
  controls.maxDistance = Math.max(dist * 8, maxDim * 10)
  controls.update()

  return box
}
