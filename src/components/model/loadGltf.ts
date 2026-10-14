import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type LoadGltfResult =
  | { ok: true; gltf: GLTF; objectUrl: string }
  | { ok: false; message: string; objectUrl?: string }

const WARN_BYTES = 64 * 1024 * 1024

export function isModelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.glb') || name.endsWith('.gltf')
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function largeFileWarning(file: File): string | null {
  if (file.size >= WARN_BYTES) {
    return `文件较大（${formatBytes(file.size)}），加载可能占用较多内存，请耐心等待`
  }
  return null
}

/**
 * Load a local .glb / .gltf via object URL.
 * Self-contained .glb is preferred; .gltf that references sibling .bin/.png
 * will fail because the browser cannot resolve those relative paths from a blob URL.
 */
export function loadGltfFromFile(file: File): Promise<LoadGltfResult> {
  if (!isModelFile(file)) {
    return Promise.resolve({
      ok: false,
      message: '请选择 .glb 或 .gltf 文件',
    })
  }

  const objectUrl = URL.createObjectURL(file)
  const loader = new GLTFLoader()

  return new Promise((resolve) => {
    loader.load(
      objectUrl,
      (gltf) => {
        resolve({ ok: true, gltf, objectUrl })
      },
      undefined,
      (err) => {
        const detail =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : '未知错误'
        let message = `无法加载模型：${detail}`
        if (file.name.toLowerCase().endsWith('.gltf')) {
          message +=
            '。.gltf 若依赖同目录的 .bin / 贴图，请改用打包好的 .glb，或自行嵌入 buffer。'
        }
        resolve({ ok: false, message, objectUrl })
      },
    )
  })
}

/** Dispose GPU resources for a loaded scene graph. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : []
      for (const m of mats) {
        const mat = m as THREE.Material & {
          map?: THREE.Texture | null
          normalMap?: THREE.Texture | null
          roughnessMap?: THREE.Texture | null
          metalnessMap?: THREE.Texture | null
          aoMap?: THREE.Texture | null
          emissiveMap?: THREE.Texture | null
        }
        mat.map?.dispose()
        mat.normalMap?.dispose()
        mat.roughnessMap?.dispose()
        mat.metalnessMap?.dispose()
        mat.aoMap?.dispose()
        mat.emissiveMap?.dispose()
        mat.dispose()
      }
    }
  })
}
