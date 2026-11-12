import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-700.css'
import '@fontsource/noto-naskh-arabic/latin-400.css'
import '@fontsource/noto-naskh-arabic/latin-700.css'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
