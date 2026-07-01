import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import LDRoot from './ld/LDRoot.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LDRoot>
      <App />
    </LDRoot>
  </React.StrictMode>
)
