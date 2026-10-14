import type { ReactNode } from 'react'
import { PxlKitSurfaceProvider } from '@pxlkit/ui-kit'
import { I18nProvider } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

/** Wrap every MPA page so Pixel* components inherit the retro pixel surface + i18n. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PxlKitSurfaceProvider surface="pixel">
      <I18nProvider>
        <LanguageSwitcher />
        {children}
      </I18nProvider>
    </PxlKitSurfaceProvider>
  )
}
