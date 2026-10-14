import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import * as THREE from 'three'
import {
  PixelAlert,
  PixelBadge,
  PixelButton,
  PixelCard,
} from '@pxlkit/ui-kit'
import { Layout } from '../components/Layout'
import { ModelStage } from '../components/model/ModelStage'
import {
  formatBytes,
  isModelFile,
  largeFileWarning,
  loadGltfFromFile,
} from '../components/model/loadGltf'

type Status = {
  kind: 'idle' | 'loading' | 'ready' | 'error' | 'warn'
  text: string
}

export function ModelTools() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [model, setModel] = useState<THREE.Object3D | null>(null)
  const [fitKey, setFitKey] = useState(0)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null,
  )
  const [status, setStatus] = useState<Status>({
    kind: 'idle',
    text: '选择本地 .glb / .gltf 开始查看',
  })
  const [warn, setWarn] = useState<string | null>(null)

  const clearLoaded = useCallback(() => {
    setModel(null)
    setFileMeta(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!isModelFile(file)) {
      clearLoaded()
      setWarn(null)
      setStatus({
        kind: 'error',
        text: '请选择 .glb 或 .gltf 文件（推荐自包含的 .glb）',
      })
      return
    }

    clearLoaded()
    setWarn(largeFileWarning(file))
    setStatus({ kind: 'loading', text: `正在加载 ${file.name}…` })
    setFileMeta({ name: file.name, size: file.size })

    const result = await loadGltfFromFile(file)
    if (result.objectUrl) {
      objectUrlRef.current = result.objectUrl
    }

    if (!result.ok) {
      setModel(null)
      setStatus({ kind: 'error', text: result.message })
      return
    }

    setModel(result.gltf.scene)
    setFitKey((k) => k + 1)
    setStatus({
      kind: 'ready',
      text: `已加载 ${file.name}（${formatBytes(file.size)}）· 拖曳旋转 · 滚轮/双指缩放`,
    })
  }

  const handleResetView = () => {
    if (!model) return
    setFitKey((k) => k + 1)
    setStatus({
      kind: 'ready',
      text: fileMeta
        ? `已重置视角 · ${fileMeta.name}`
        : '已重置视角',
    })
  }

  const handleClear = () => {
    clearLoaded()
    setWarn(null)
    setStatus({
      kind: 'idle',
      text: '选择本地 .glb / .gltf 开始查看',
    })
  }

  return (
    <Layout title="3D 模型" wide>
      <p className="text-sm text-retro-muted">
        打开本地 glTF / GLB，在浏览器里 orbit 查看。全部本地完成，不会上传。推荐{' '}
        <PixelBadge tone="cyan" size="sm">
          .glb
        </PixelBadge>{' '}
        （自包含）；纯 .gltf 若依赖同目录 .bin / 贴图将无法从单文件加载。
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e)
        }}
      />

      <PixelCard tone="neutral">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-retro-text">
            模型查看器
          </h4>
          <PixelBadge
            tone="cyan"
            size="sm"
            className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
          >
            three + OrbitControls
          </PixelBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          <PixelButton
            type="button"
            tone="cyan"
            size="sm"
            loading={status.kind === 'loading'}
            onClick={handlePickFile}
          >
            打开模型
          </PixelButton>
          <PixelButton
            type="button"
            tone="cyan"
            variant="outline"
            size="sm"
            disabled={!model || status.kind === 'loading'}
            onClick={handleResetView}
          >
            重置视角
          </PixelButton>
          <PixelButton
            type="button"
            tone="neutral"
            variant="ghost"
            size="sm"
            disabled={!model && status.kind !== 'error'}
            onClick={handleClear}
          >
            清除
          </PixelButton>
        </div>

        {fileMeta ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <PixelBadge tone="green" size="sm">
              {fileMeta.name}
            </PixelBadge>
            <PixelBadge tone="neutral" size="sm">
              {formatBytes(fileMeta.size)}
            </PixelBadge>
          </div>
        ) : null}

        <p className="mt-3 font-mono text-xs text-retro-muted">{status.text}</p>
      </PixelCard>

      {warn ? (
        <PixelAlert tone="gold" label="大文件提醒" message={warn} />
      ) : null}

      {status.kind === 'error' ? (
        <PixelAlert tone="red" label="加载失败" message={status.text} />
      ) : null}

      {model ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PixelBadge tone="cyan" size="sm">
              拖曳旋转 · 滚轮/双指缩放 · 右键/双指平移
            </PixelBadge>
          </div>
          <ModelStage model={model} fitKey={fitKey} />
        </div>
      ) : (
        status.kind !== 'loading' && (
          <PixelCard tone="neutral" padding="md">
            <p className="text-center text-sm text-retro-muted">
              选择一个 .glb / .gltf 开始预览。手机上可用单指旋转、双指缩放。
            </p>
          </PixelCard>
        )
      )}
    </Layout>
  )
}
