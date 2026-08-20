import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chamados from './pages/Chamados'
import ChamadoDetalhe from './pages/ChamadoDetalhe'
import NovoChamado from './pages/NovoChamado'
import Usuarios from './pages/Usuarios'

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<Navigate to="/painel" replace />} />
        <Route path="painel" element={<Dashboard />} />
        <Route path="chamados" element={<Chamados />} />
        <Route path="chamados/novo" element={<NovoChamado />} />
        <Route path="chamados/:id" element={<ChamadoDetalhe />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
