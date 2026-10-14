import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { ModelTools } from './pages/ModelTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <ModelTools />
    </Providers>
  </StrictMode>,
)
