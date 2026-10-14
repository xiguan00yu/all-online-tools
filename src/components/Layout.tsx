import type { ReactNode } from 'react'
import { Button, Divider, Footer, Title } from 'animal-island-ui'

type LayoutProps = {
  title: string
  children: ReactNode
}

export function Layout({ title, children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <Button
          type="link"
          onClick={() => {
            window.location.assign('./index.html')
          }}
        >
          ← 返回首页
        </Button>
        <div className="mt-3">
          <Title size="large" color="app-blue" variant="ribbon">
            {title}
          </Title>
        </div>
        <Divider type="thin" className="mt-4" />
      </header>
      <main className="space-y-8">{children}</main>
      <div className="mt-12">
        <Footer text="All Online Tools" />
      </div>
    </div>
  )
}
