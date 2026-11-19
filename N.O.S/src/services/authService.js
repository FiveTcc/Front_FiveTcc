import api from "./api";

const authService = {
  // Função para fazer login
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

  // Função para registrar um novo usuário'
  async refresh(refreshToken) {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  // Função para fazer logout
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Erro ao fazer logout:", error);
    }
  },
};

export default authService;