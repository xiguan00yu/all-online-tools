import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { PptTools } from './pages/PptTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <PptTools />
    </Providers>
  </StrictMode>,
)
