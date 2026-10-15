import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { BoardTools } from './pages/BoardTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BoardTools />
    </Providers>
  </StrictMode>,
)
