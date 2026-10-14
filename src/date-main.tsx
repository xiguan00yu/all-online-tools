import './bootstrap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DateTools } from './pages/DateTools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DateTools />
  </StrictMode>,
)
