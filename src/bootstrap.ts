/** Shared bootstrap for every MPA entry. Import this FIRST. */
import './index.css'
import { buildGoogleFontsUrl } from '@pxlkit/ui-kit'

/** Load Press Start 2P / Inter / JetBrains Mono (pxlkit theme fonts). */
const fontsHref = buildGoogleFontsUrl()
if (!document.querySelector(`link[href="${fontsHref}"]`)) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = fontsHref
  document.head.appendChild(link)
}
