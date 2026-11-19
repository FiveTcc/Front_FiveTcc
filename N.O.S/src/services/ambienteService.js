
import api from "./api";

const ambienteService = {
  // Listar todos os ambientes
  async listarAmbientes() {
    try {
      const response = await api.get("/ambientes/listarAmbiente");
      return response.data;
    } catch (error) {
      console.error("Erro ao listar ambientes:", error);
      throw error;
    }
  },

  async listarAmbienteId(id) {
    try {
      const response = await api.get(`/ambientes/listarAmbienteId/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar ambiente por ID:", error);
      throw error;
    }
  },

  // Cadastrar ambiente
  async cadastrarAmbiente(dados) {
    try {
      const response = await api.post(
        "/ambientes/cadastrarAmbiente",
        dados
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao cadastrar ambiente:", error);
      throw error;
    }
  },

  // Editar ambiente
  async editarAmbiente(id, dados) {
    try {
      const response = await api.patch(
        `/ambientes/editarAmbiente/${id}`,
        dados
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao editar ambiente:", error);
      throw error;
    }
  },

  // Atualizar status do ambiente
  async atualizarStatusAmbiente(id) {
    try {
      const response = await api.patch(
        `/ambientes/atualizarStatusAmbiente/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar status do ambiente:", error);
      throw error;
    }
  },

  // Buscar ambientes por bloco
  async buscarPorBloco(bloco) {
    try {
      const response = await api.get(
        "/ambientes/buscarPorBloco",
        {
          params: { bloco }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar ambientes por bloco:", error);
      throw error;
    }
  },

  // Buscar ambientes por tipo
  async buscarPorTipo(tipo) {
    try {
      const response = await api.get(
        "/ambientes/buscarPorTipo",
        {
          params: { tipo }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar ambientes por tipo:", error);
      throw error;
    }
  }
};

export default ambienteService;
