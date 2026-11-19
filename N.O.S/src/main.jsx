import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'
import './styles/AjustesFinais.css'
import './styles/Ambientes.css'
import './styles/Base.css'
import './styles/Botoes.css'
import './styles/Carregamento.css'
import './styles/Chamados.css'
import './styles/Componentes.css'
import './styles/CustomSelect.css'
import './styles/FiltrosFinal.css'
import './styles/Formularios.css'
import './styles/Layout.css'
import './styles/Login.css'
import './styles/Paginas.css'
import './styles/Perfil.css'
import './styles/Relatorios.css'
import './styles/Responsivo.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
