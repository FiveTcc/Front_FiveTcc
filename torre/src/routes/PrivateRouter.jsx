import { Navigate, Outlet } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return <LoadingScreen />;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}