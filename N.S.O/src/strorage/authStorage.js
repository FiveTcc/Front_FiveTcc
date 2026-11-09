const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "usuario";

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUsuario() {
    const usuario = localStorage.getItem(USER_KEY);

    return usuario ? JSON.parse(usuario) : null;
  },

  setUsuario(usuario) {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },

  salvar(tokens, usuario) {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
    this.setUsuario(usuario);
  },

  limpar() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};