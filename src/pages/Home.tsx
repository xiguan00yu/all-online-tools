import { useEffect } from 'react'
import {
  PixelBadge,
  PixelBadgeGroup,
  PixelCard,
  PixelDivider,
  PixelSectionHeader,
} from '@pxlkit/ui-kit'
import { PxlKitIcon } from '@pxlkit/core'
import { Calendar, List, Package, Pencil } from '@pxlkit/ui'
import { Target } from '@pxlkit/gamification'
import { useI18n } from '../i18n'

const toolDefs = [
  {
    id: 'date' as const,
    href: './date.html',
    ready: true,
    icon: Calendar,
    iconColor: '#22d3ee',
  },
  {
    id: 'pdf' as const,
    href: './pdf.html',
    ready: true,
    icon: Pencil,
    iconColor: '#f472b6',
  },
  {
    id: 'json' as const,
    href: './json.html',
    ready: true,
    icon: List,
    iconColor: '#a3e635',
  },
  {
    id: 'model' as const,
    href: './model.html',
    ready: true,
    icon: Package,
    iconColor: '#c4b5fd',
  },
  {
    id: 'face' as const,
    href: './face.html',
    ready: true,
    icon: Target,
    iconColor: '#fbbf24',
  },
]

export function Home() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t('home.documentTitle')
  }, [t])

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center pr-28 sm:pr-36">
        <PixelSectionHeader
          eyebrow={t('home.eyebrow')}
          title={t('home.title')}
          description={t('home.description')}
          titleTone="cyan"
          align="center"
          size="lg"
          as="h1"
        />
        <div className="mt-4 flex justify-center">
          <PixelBadgeGroup aria-label={t('common.techStack')}>
            <PixelBadge tone="cyan" size="sm">
              pxlkit
            </PixelBadge>
            <PixelBadge tone="green" size="sm">
              React + Vite MPA
            </PixelBadge>
          </PixelBadgeGroup>
        </div>
      </header>

      <PixelDivider label={t('home.toolsDivider')} tone="cyan" spacing="md" />

      <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
        {toolDefs.map((tool) => {
          // Status labels must not use PixelCard's corner `badge` ribbon:
          // that path sets overflow-hidden on the card and clips absolute
          // PixelRibbon text (same issue as DateTools section tags). Keep
          // ready / coming-soon in-flow with PixelBadge so they show fully.
          const title = t(`home.tools.${tool.id}.title`)
          const description = t(`home.tools.${tool.id}.description`)
          const statusLabel = tool.ready ? t('home.ready') : t('home.comingSoon')
          const statusTone = tool.ready ? 'green' : 'neutral'

          return (
            <li key={tool.id}>
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
                      {title}
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
                <p className="text-sm text-retro-muted">{description}</p>
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
