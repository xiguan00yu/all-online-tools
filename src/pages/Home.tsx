import {
  PixelBadge,
  PixelBadgeGroup,
  PixelCard,
  PixelDivider,
  PixelSectionHeader,
} from '@pxlkit/ui-kit'
import { PxlKitIcon } from '@pxlkit/core'
import { Calendar } from '@pxlkit/ui'

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
        <PixelSectionHeader
          eyebrow="ALL ONLINE TOOLS"
          title="在线工具集"
          description="简单实用的浏览器小工具，无需安装"
          titleTone="cyan"
          align="center"
          size="lg"
          as="h1"
        />
        <div className="mt-4 flex justify-center">
          <PixelBadgeGroup aria-label="技术栈">
            <PixelBadge tone="cyan" size="sm">
              pxlkit
            </PixelBadge>
            <PixelBadge tone="green" size="sm">
              React + Vite MPA
            </PixelBadge>
          </PixelBadgeGroup>
        </div>
      </header>

      <PixelDivider label="TOOLS" tone="cyan" spacing="md" />

      <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.title}>
            {tool.ready ? (
              <PixelCard
                href={tool.href}
                title={tool.title}
                description={tool.description}
                tone="cyan"
                interactive
                icon={
                  <PxlKitIcon
                    icon={Calendar}
                    size={20}
                    appearance="solid"
                    color="#22d3ee"
                    decorative
                  />
                }
                badge={{ label: '可用', tone: 'green' }}
              />
            ) : (
              <PixelCard
                title={tool.title}
                description={tool.description}
                tone="neutral"
                badge={{ label: '即将推出', tone: 'neutral' }}
              />
            )}
          </li>
        ))}
      </ul>

      <footer className="mt-12 text-center font-mono text-xs text-retro-muted">
        All Online Tools ·{' '}
        <a
          className="text-retro-cyan underline-offset-2 hover:underline"
          href="https://pxlkit.xyz"
          target="_blank"
          rel="noreferrer"
        >
          pxlkit
        </a>
      </footer>
    </div>
  )
}
