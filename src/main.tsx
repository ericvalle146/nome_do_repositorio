import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/theme-context.tsx'
import { FontSizeProvider } from './context/font-size-context.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontSizeProvider>
        <App />
      </FontSizeProvider>
    </ThemeProvider>
  </React.StrictMode>,
)


