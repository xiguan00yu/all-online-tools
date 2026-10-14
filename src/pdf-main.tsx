import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { PdfTools } from './pages/PdfTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <PdfTools />
    </Providers>
  </StrictMode>,
)
