import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { JsonTools } from './pages/JsonTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <JsonTools />
    </Providers>
  </StrictMode>,
)
