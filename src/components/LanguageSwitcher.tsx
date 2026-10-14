import { PixelSegmented } from '@pxlkit/ui-kit'
import { useI18n, type Locale } from '../i18n'

/** Compact zh/en switcher — fixed top-right on every MPA page via Providers. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="fixed right-3 top-3 z-50 sm:right-4 sm:top-4">
      <PixelSegmented
        aria-label={t('lang.switch')}
        tone="cyan"
        value={locale}
        options={[
          { value: 'zh', label: t('lang.zh') },
          { value: 'en', label: t('lang.en') },
        ]}
        onChange={(next) => {
          if (next === 'zh' || next === 'en') setLocale(next as Locale)
        }}
      />
    </div>
  )
}
