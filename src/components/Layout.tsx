import type { ReactNode } from 'react'
import { PixelButton, PixelDivider, PixelSectionHeader } from '@pxlkit/ui-kit'

type LayoutProps = {
  title: string
  children: ReactNode
  /** Wider max width for tools that need a large canvas (e.g. PDF). */
  wide?: boolean
}

export function Layout({ title, children, wide }: LayoutProps) {
  return (
    <div
      className={`mx-auto min-h-screen px-4 py-8 sm:px-6 ${
        wide ? 'max-w-5xl' : 'max-w-3xl'
      }`}
    >
      <header className="mb-8">
        <PixelButton
          type="button"
          variant="ghost"
          tone="cyan"
          size="sm"
          onClick={() => {
            window.location.assign('./index.html')
          }}
        >
          ← 返回首页
        </PixelButton>
        <div className="mt-4">
          <PixelSectionHeader title={title} titleTone="cyan" size="lg" as="h1" />
        </div>
        <PixelDivider spacing="md" className="mt-2" />
      </header>
      <main className="space-y-8">{children}</main>
      <footer className="mt-12 text-center text-xs text-retro-muted font-mono">
        All Online Tools · pxlkit
      </footer>
    </div>
  )
}
