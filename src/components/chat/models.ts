/**
 * Curated WebLLM model ids from `@mlc-ai/web-llm` `prebuiltAppConfig.model_list`.
 * Prefer small instruct / q4 variants that fit browsers; sizes are approximate VRAM.
 */
export type ChatModelOption = {
  id: string
  /** Short label for the picker. */
  label: string
  /** Rough VRAM hint shown in UI (MB). */
  vramMB: number
  /** Human size hint for first-download warning. */
  sizeHint: string
}

/** Default: smallest reasonable instruct model without shader-f16 requirement. */
export const DEFAULT_CHAT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'

export const CHAT_MODELS: ChatModelOption[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 1B (q4f32)',
    vramMB: 1129,
    sizeHint: '~0.7–1.2 GB',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B (q4f16)',
    vramMB: 879,
    sizeHint: '~0.6–1.0 GB',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    label: 'Qwen2.5 0.5B (q4f32)',
    vramMB: 1060,
    sizeHint: '~0.5–1.0 GB',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
    label: 'SmolLM2 360M (q4f32)',
    vramMB: 580,
    sizeHint: '~0.3–0.6 GB',
  },
  {
    id: 'Qwen3-0.6B-q4f32_1-MLC',
    label: 'Qwen3 0.6B (q4f32)',
    vramMB: 1925,
    sizeHint: '~0.6–1.2 GB',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B (q4f16)',
    vramMB: 2264,
    sizeHint: '~1.5–2.5 GB',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
    label: 'Phi-3.5 mini (q4f16, 1k ctx)',
    vramMB: 2520,
    sizeHint: '~2–3 GB',
  },
]

export function findChatModel(id: string): ChatModelOption | undefined {
  return CHAT_MODELS.find((m) => m.id === id)
}

export function isKnownChatModel(id: string): boolean {
  return CHAT_MODELS.some((m) => m.id === id)
}
