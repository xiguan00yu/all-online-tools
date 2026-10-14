import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { en } from './en'
import { getMessage } from './getMessage'
import {
  localeToHtmlLang,
  persistLocale,
  resolveInitialLocale,
} from './resolveLocale'
import type { Locale, MessageTree } from './types'
import { zh } from './zh'

const dictionaries: Record<Locale, MessageTree> = { zh, en }

export type TranslateFn = (
  path: string,
  params?: Record<string, string | number>,
) => string

type I18nContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nContextValue | null>(null)

function applyDayjsLocale(locale: Locale) {
  dayjs.locale(locale === 'zh' ? 'zh-cn' : 'en')
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale())

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale)
    applyDayjsLocale(locale)
    persistLocale(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const t = useCallback<TranslateFn>(
    (path, params) => getMessage(dictionaries[locale], path, params),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
