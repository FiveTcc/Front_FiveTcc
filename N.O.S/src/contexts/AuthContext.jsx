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

      const usuarioResposta =
        data?.usuario ??
        data?.user ??
        data?.userData ??
        null;

      // Lê os dados do payload do JWT
      let dadosToken = {};

      if (accessToken) {
        try {
          const payload = accessToken.split(".")[1];
          const payloadBase64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

          dadosToken = JSON.parse(atob(payloadBase64));
        } catch (error) {
          console.error("Erro ao interpretar token:", error);
        }
      }

      const usuarioLogado = {
        ...dadosToken,
        ...(usuarioResposta ?? {}),
        email: usuarioResposta?.email ?? dadosToken.email ?? email,
        id_user: usuarioResposta?.id_user ?? dadosToken.sub,
        role: usuarioResposta?.role ?? dadosToken.role,
        user_tipo:
          usuarioResposta?.user_tipo ??
          usuarioResposta?.role ??
          dadosToken.role,
      };

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
        const payload = token.split(".")[1];
        const dadosToken = JSON.parse(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );

        const usuarioAtualizado = {
          ...dadosToken,
          ...usuarioSalvo,
          id_user: usuarioSalvo.id_user ?? dadosToken.sub,
          role: usuarioSalvo.role ?? dadosToken.role,
          user_tipo:
            usuarioSalvo.user_tipo ??
            usuarioSalvo.role ??
            dadosToken.role,
        };

        setUsuario(usuarioAtualizado);
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