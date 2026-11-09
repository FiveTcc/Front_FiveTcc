import api from "./api";

const authService = {
  // Envia as credenciais e devolve os dados da sessão iniciada.
  async login(email, senha) {
    try {
      const response = await api.post("/auth/login", {
        user_email: email,
        user_senha: senha,
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  },

  // Solicita à API a renovação dos tokens da sessão.
  async refresh(refreshToken) {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  // Encerra a sessão na API e registra falhas sem interromper a saída local.
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Erro ao fazer logout:", error);
    }
  },
};

export default authService;