import axios from "axios";
import { authStorage } from "../strorage/authStorage";

const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Adiciona o accessToken automaticamente
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let atualizandoToken = false;
let filaRefresh = [];

function processarFila(error, token = null) {
  filaRefresh.forEach((promessa) => {
    if (error) {
      promessa.reject(error);
    } else {
      promessa.resolve(token);
    }
  });

  filaRefresh = [];
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const requisicaoOriginal = error.config;

    if (
      error.response?.status !== 401 ||
      requisicaoOriginal._retry
    ) {
      return Promise.reject(error);
    }

    // Não tenta refresh na própria rota de refresh
    if (requisicaoOriginal.url?.includes("/auth/refresh")) {
      authStorage.limpar();

      window.location.href = "/login";

      return Promise.reject(error);
    }

    if (atualizandoToken) {
      return new Promise((resolve, reject) => {
        filaRefresh.push({
          resolve,
          reject,
        });
      }).then((novoToken) => {
        requisicaoOriginal.headers.Authorization =
          `Bearer ${novoToken}`;

        return api(requisicaoOriginal);
      });
    }

    requisicaoOriginal._retry = true;
    atualizandoToken = true;

    try {
      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error("Refresh token não encontrado.");
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {
          refreshToken,
        }
      );

      const novoAccessToken = response.data.accessToken;

      authStorage.setAccessToken(novoAccessToken);

      processarFila(null, novoAccessToken);

      requisicaoOriginal.headers.Authorization =
        `Bearer ${novoAccessToken}`;

      return api(requisicaoOriginal);
    } catch (refreshError) {
      processarFila(refreshError);

      authStorage.limpar();

      window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      atualizandoToken = false;
    }
  }
);

export default api;