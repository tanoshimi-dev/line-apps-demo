import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeLiff } from './services/liff'

const liffId = import.meta.env.VITE_LIFF_ID

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

initializeLiff(liffId)
  .then(() => {
    renderApp()
  })
  .catch((error) => {
    console.error('LIFF initialization failed:', error)
    renderApp()
  })
