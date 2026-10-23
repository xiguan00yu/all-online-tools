import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { JsonlTools } from './pages/JsonlTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <JsonlTools />
    </Providers>
  </StrictMode>,
)
