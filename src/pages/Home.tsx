import {
  PixelBadge,
  PixelBadgeGroup,
  PixelCard,
  PixelDivider,
  PixelSectionHeader,
} from '@pxlkit/ui-kit'
import { PxlKitIcon } from '@pxlkit/core'
import { Calendar, Pencil } from '@pxlkit/ui'

const tools = [
  {
    href: './date.html',
    title: '日期工具',
    description: '格式化、相对时间、日期差值计算',
    ready: true,
    icon: Calendar,
    iconColor: '#22d3ee',
  },
  {
    href: './pdf.html',
    title: 'PDF 工具',
    description: '预览、涂抹遮盖、导出',
    ready: true,
    icon: Pencil,
    iconColor: '#f472b6',
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
        {tools.map((tool) => {
          // Status labels must not use PixelCard's corner `badge` ribbon:
          // that path sets overflow-hidden on the card and clips absolute
          // PixelRibbon text (same issue as DateTools section tags). Keep
          // 「可用」/「即将推出」in-flow with PixelBadge so they show fully.
          const statusLabel = tool.ready ? '可用' : '即将推出'
          const statusTone = tool.ready ? 'green' : 'neutral'

          return (
            <li key={tool.title}>
              <PixelCard
                href={tool.ready ? tool.href : undefined}
                tone={tool.ready ? 'cyan' : 'neutral'}
                interactive={tool.ready || undefined}
              >
                <div className="mb-2 flex items-start justify-between gap-3 border-b border-retro-border/30 pb-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {tool.ready ? (
                      <PxlKitIcon
                        icon={tool.icon}
                        size={20}
                        appearance="solid"
                        color={tool.iconColor}
                        decorative
                      />
                    ) : null}
                    <h4 className="min-w-0 text-sm font-semibold text-retro-text">
                      {tool.title}
                    </h4>
                  </div>
                  <PixelBadge
                    tone={statusTone}
                    size="sm"
                    className="max-w-[min(100%,14rem)] shrink-0 whitespace-normal break-words text-left leading-snug"
                  >
                    {statusLabel}
                  </PixelBadge>
                </div>
                <p className="text-sm text-retro-muted">{tool.description}</p>
              </PixelCard>
            </li>
          )
        })}
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
