import type { ReactNode } from 'react'
import { PxlKitSurfaceProvider } from '@pxlkit/ui-kit'

/** Wrap every MPA page so Pixel* components inherit the retro pixel surface. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PxlKitSurfaceProvider surface="pixel">{children}</PxlKitSurfaceProvider>
  )
}
