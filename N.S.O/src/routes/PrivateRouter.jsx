import { Navigate, Outlet } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../contexts/AuthContext";

// Protege as rotas privadas e mostra o estado de carregamento da sessão.
export default function PrivateRoute() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    // Aguarda a restauração da sessão antes de decidir o redirecionamento.
    return <LoadingScreen />;
  }

  if (!autenticado) {
    // Envia usuários sem sessão para a tela de login.
    return <Navigate to="/login" replace />;
  }

  // Renderiza as rotas filhas quando o usuário está autenticado.
  return <Outlet />;
}