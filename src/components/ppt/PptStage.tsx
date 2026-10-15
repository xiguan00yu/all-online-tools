import { useEffect, useRef } from 'react'
import { renderSlideToElement, type Presentation } from 'pptx-viewer'

type PptStageProps = {
  presentation: Presentation
  slideIndex: number
}

/**
 * Renders one PPTX slide via pptx-viewer SVG into a responsive container.
 * Width follows the container; height keeps the original slide aspect ratio.
 */
export function PptStage({ presentation, slideIndex }: PptStageProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const paint = () => {
      const width = Math.max(280, Math.floor(host.clientWidth))
      renderSlideToElement(presentation, slideIndex, host, { width })
      // Keep SVG fluid for mobile resize.
      const svg = host.querySelector('svg')
      if (svg) {
        svg.style.width = '100%'
        svg.style.height = 'auto'
        svg.style.display = 'block'
        svg.removeAttribute('width')
        // Preserve aspect via viewBox already set by the library.
      }
    }

    paint()

    const ro = new ResizeObserver(() => {
      paint()
    })
    ro.observe(host)
    return () => {
      ro.disconnect()
      host.replaceChildren()
    }
  }, [presentation, slideIndex])

  return (
    <div
      ref={hostRef}
      className="w-full overflow-hidden rounded border border-retro-border/40 bg-white"
      aria-label={`Slide ${slideIndex + 1}`}
    />
  )
}
