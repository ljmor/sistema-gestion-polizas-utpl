import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './index.css'
import { setupMockAdapter } from './infrastructure/api/mockAdapter';

if (import.meta.env.VITE_USE_MOCK === 'true') {
  setupMockAdapter();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
