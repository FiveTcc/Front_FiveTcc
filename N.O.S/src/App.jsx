import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import NovaSenha from './pages/NovaSenha'
import RecuperarSenha from './pages/RecuperarSenha'
import Dashboard from './pages/Dashboard'
import Ocorrencias from './pages/Ocorrencias'
import ChamadoDetalhe from './pages/ChamadoDetalhe'
import NovoChamado from './pages/NovoChamado'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'
import Relatorios from './pages/Relatorios'


import PrivateRoute from "./routes/privateRouter";
import Ambientes from './pages/Ambientes';
import AmbientesDetalhe from './pages/AmbientesDetalhe';




export default function App() {
  return (
    <Routes>

      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route
        path="/recuperar-senha"
        element={<RecuperarSenha />}
      />

      {/* Rotas protegidas */}
      <Route element={<PrivateRoute />}>

        <Route path="/" element={<Layout />}>

          <Route
            index
            element={<Navigate to="/painel" replace />}
          />

          <Route
            path="painel"
            element={<Dashboard />}
          />
          <Route path="relatorios" 
          element={<Relatorios />} />

          <Route
            path="perfil"
            element={<Perfil />}
          />

          <Route
            path="ocorrencias"
            element={<Ocorrencias />}
          />

          <Route
            path="novochamado"
            element={<NovoChamado />}
          />

          <Route
            path="ocorrencias/:id"
            element={<ChamadoDetalhe />}
          />

          <Route
            path="usuarios"
            element={<Usuarios />}
          />

          <Route
            path="ambientes"
            element={<Ambientes />}
          />
          <Route
            path="ambientes/:id"
            element={<AmbientesDetalhe />}
          />
        
        </Route>

      </Route>

      {/* Rota inexistente */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  )
}
