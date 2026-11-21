import { Navigate, Outlet } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ allowedRoles }) {
  const { autenticado, carregando, usuario } = useAuth();

  if (carregando) {
    return <LoadingScreen />;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

   if (allowedRoles) {
    const rolesUsuario = [
      usuario?.role,
      usuario?.user_tipo,
    ].filter(Boolean);

    const temPermissao = allowedRoles.some(role =>
      rolesUsuario.includes(role)
    );

    if (!temPermissao) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}