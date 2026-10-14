import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './components/Providers'
import { DateTools } from './pages/DateTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <DateTools />
    </Providers>
  </StrictMode>,
)
