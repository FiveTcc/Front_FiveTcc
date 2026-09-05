import api from "./api";

const authService = {
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

  async refresh(refreshToken) {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Erro ao fazer logout:", error);
    }
  },
};

export default authService;