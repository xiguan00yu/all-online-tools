import type { ReactNode } from 'react'

type LayoutProps = {
  title: string
  children: ReactNode
}

export function Layout({ title, children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <a
          href="./index.html"
          className="text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ← 返回首页
        </a>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
      </header>
      <main className="space-y-8">{children}</main>
      <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        All Online Tools
      </footer>
    </div>
  )
}
