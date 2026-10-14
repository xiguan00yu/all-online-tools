import type { MessageTree } from './types'

/** Look up a dotted path; returns the path itself if missing (dev-visible). */
export function getMessage(
  tree: MessageTree,
  path: string,
  params?: Record<string, string | number>,
): string {
  const parts = path.split('.')
  let cur: string | MessageTree | undefined = tree
  for (const part of parts) {
    if (cur == null || typeof cur === 'string') {
      cur = undefined
      break
    }
    cur = cur[part]
  }
  let text = typeof cur === 'string' ? cur : path
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return text
}
