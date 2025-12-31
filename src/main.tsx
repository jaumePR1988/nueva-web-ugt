import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigErrorBoundary } from './components/ConfigErrorBoundary.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigErrorBoundary>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConfigErrorBoundary>
  </StrictMode>,
)
