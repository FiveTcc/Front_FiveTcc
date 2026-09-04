import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import authService from "../services/authService";
import { authStorage } from "../strorage/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const autenticado = !!usuario;

  async function login(email, senha) {
    try {
      const responseData = await authService.login(email, senha);
      const data = responseData?.data ?? responseData;

      const accessToken =
        data?.accessToken ??
        data?.token ??
        data?.access_token ??
        data?.data?.accessToken ??
        data?.data?.token ??
        null;

      const refreshToken =
        data?.refreshToken ??
        data?.refresh_token ??
        data?.refreshTokenValue ??
        data?.data?.refreshToken ??
        data?.data?.refresh_token ??
        null;

      const usuarioLogado =
        data?.usuario ??
        data?.user ??
        data?.userData ??
        data?.data?.usuario ??
        data?.data?.user ??
        { email };

      if (accessToken || refreshToken || usuarioLogado) {
        authStorage.salvar(
          {
            accessToken: accessToken || "",
            refreshToken: refreshToken || "",
          },
          usuarioLogado
        );

        setUsuario(usuarioLogado);

        return {
          sucesso: true,
          usuario: usuarioLogado,
        };
      }

      return {
        sucesso: false,
        mensagem: "Resposta de login inválida da API.",
      };
    } catch (error) {
      console.error("[AuthContext] Erro no login:", error.response?.data || error);

      return {
        sucesso: false,
        mensagem:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "E-mail ou senha inválidos.",
      };
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("[AuthContext] Falha no logout da API:", error);
    } finally {
      authStorage.limpar();
      setUsuario(null);
    }
  }

  useEffect(() => {
    try {
      const token = authStorage.getAccessToken();
      const usuarioSalvo = authStorage.getUsuario();

      if (token && usuarioSalvo) {
        setUsuario(usuarioSalvo);
      }
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      authStorage.limpar();
    } finally {
      setCarregando(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      autenticado,
      carregando,
      login,
      logout,
    }),
    [usuario, carregando]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}