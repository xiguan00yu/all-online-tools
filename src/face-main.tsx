import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { FaceTools } from './pages/FaceTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <FaceTools />
    </Providers>
  </StrictMode>,
)
