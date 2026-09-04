import api from "./api";

const authService = {
  async login(email, senha) {
    const response = await api.post("/auth/login", {
      user_email: email,
      user_senha: senha,
    });

    return response.data;
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