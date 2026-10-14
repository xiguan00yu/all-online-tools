import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { fitCameraToObject } from './fitCamera'
import { disposeObject } from './loadGltf'

type ModelStageProps = {
  /** Scene root to display; null clears the stage. */
  model: THREE.Object3D | null
  /** Bump to re-fit camera after load / reset. */
  fitKey: number
}

/**
 * Three.js canvas: PerspectiveCamera (~42°), hemisphere + directional lights,
 * OrbitControls (drag orbit, wheel/pinch zoom, touch).
 */
export function ModelStage({ model, fitKey }: ModelStageProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    content: THREE.Group
    raf: number
  } | null>(null)

  // Init / teardown WebGL once
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1220)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    camera.position.set(0, 1.2, 4)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'default',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = true
    controls.enablePan = true
    controls.minDistance = 0.2
    controls.maxDistance = 80
    controls.target.set(0, 0.8, 0)
    controls.update()

    const hemi = new THREE.HemisphereLight(0xb1e1ff, 0x444444, 1.1)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(3, 6, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.45)
    fill.position.set(-4, 2, -2)
    scene.add(fill)

    const grid = new THREE.GridHelper(8, 16, 0x334155, 0x1e293b)
    grid.position.y = 0
    scene.add(grid)

    const content = new THREE.Group()
    scene.add(content)

    const resize = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()

    const ro = new ResizeObserver(() => resize())
    ro.observe(host)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    apiRef.current = { scene, camera, renderer, controls, content, raf }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      disposeObject(content)
      renderer.dispose()
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement)
      }
      apiRef.current = null
    }
  }, [])

  // Swap model + fit camera
  useEffect(() => {
    const api = apiRef.current
    if (!api) return

    while (api.content.children.length > 0) {
      const child = api.content.children[0]!
      api.content.remove(child)
      disposeObject(child)
    }

    if (!model) return

    model.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.frustumCulled = false
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : []
      for (const m of mats) {
        if (m) {
          m.side = THREE.DoubleSide
          m.needsUpdate = true
        }
      }
    })

    api.content.add(model)
    fitCameraToObject(api.camera, api.controls, model)
  }, [model, fitKey])

  return (
    <div
      ref={hostRef}
      className="relative h-[min(70vh,32rem)] w-full overflow-hidden rounded-sm border border-retro-border/40 bg-[#0b1220] touch-none"
      role="img"
      aria-label="3D 模型预览画布，拖曳旋转，滚轮或双指缩放"
    />
  )
}
