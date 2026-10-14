const tools = [
  {
    href: './date.html',
    title: '日期工具',
    description: '格式化、相对时间、日期差值计算',
    ready: true,
  },
  {
    href: '#',
    title: '更多工具',
    description: '即将推出，敬请期待',
    ready: false,
  },
]

export function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          在线工具集
        </h1>
        <p className="mt-2 text-slate-500">
          简单实用的浏览器小工具，无需安装
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.title}>
            {tool.ready ? (
              <a
                href={tool.href}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
              </a>
            ) : (
              <div className="block rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 opacity-70">
                <h2 className="text-lg font-semibold text-slate-600">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
