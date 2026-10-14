import { Card, Divider, Footer, Tag, Title } from 'animal-island-ui'

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
      <header className="mb-8 text-center">
        <Title size="large" color="app-teal" variant="ribbon">
          在线工具集
        </Title>
        <p className="mt-3 text-slate-500">
          简单实用的浏览器小工具，无需安装
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <Tag color="app-blue" variant="soft" size="small">
            animal-island-ui
          </Tag>
          <Tag color="app-green" variant="soft" size="small">
            React + Vite MPA
          </Tag>
        </div>
      </header>

      <Divider type="wave-yellow" />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.title}>
            {tool.ready ? (
              <a href={tool.href} className="block no-underline">
                <Card color="app-blue" hoverable>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {tool.title}
                    </h2>
                    <Tag color="app-green" variant="solid" size="small">
                      可用
                    </Tag>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
                </Card>
              </a>
            ) : (
              <Card type="dashed" color="default">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-600">
                    {tool.title}
                  </h2>
                  <Tag color="default" variant="dashed" size="small">
                    即将推出
                  </Tag>
                </div>
                <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
              </Card>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <Footer text="All Online Tools" />
      </div>
    </div>
  )
}
