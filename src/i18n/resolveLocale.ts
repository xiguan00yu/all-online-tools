import type { Locale } from './types'

export const LOCALE_STORAGE_KEY = 'all-online-tools.locale'

const LOCALES: readonly Locale[] = ['zh', 'en']

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Resolve initial locale:
 * 1. Saved preference in localStorage (wins)
 * 2. Browser language if it starts with `zh` → `zh`
 * 3. Otherwise `en`
 *
 * UI copy was originally zh-CN-heavy, but first-visit default follows the
 * browser so English users land on English without a prior preference.
 */
export function resolveInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* private mode / blocked storage */
  }

  const nav =
    typeof navigator !== 'undefined'
      ? navigator.language ||
        (Array.isArray(navigator.languages) ? navigator.languages[0] : '') ||
        ''
      : ''
  if (nav.toLowerCase().startsWith('zh')) return 'zh'
  return 'en'
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en'
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}
