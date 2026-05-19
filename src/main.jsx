import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Appliquer le thème immédiatement depuis localStorage (avant le premier rendu)
const savedTheme = localStorage.getItem('agriclean-theme')
if (savedTheme === 'dark') document.documentElement.classList.add('dark')

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
