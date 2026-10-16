import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { ChatTools } from './pages/ChatTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <ChatTools />
    </Providers>
  </StrictMode>,
)
