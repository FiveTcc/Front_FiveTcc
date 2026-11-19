import api from './api';

const ocorrenciaService = {

    // Listar todas as ocorrências
  async listarOcorrencias() {
    try {
      const response = await api.get("/ocorrencias/listarOcorrencia");
      return response.data;
    } catch (error) {
      console.error("Erro ao listar ocorrências:", error);
      throw error;
    }
  },

  // Buscar ocorrência por ID
  async buscarOcorrenciaPorId(id) {
    try {
      const response = await api.get(
        `/ocorrencias/listarOcorrenciaId/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar ocorrência:", error);
      throw error;
    }
  },

  // Abrir ocorrência
  async abrirOcorrencia(dados) {
    try {
      const response = await api.post(
        "/ocorrencias/abrirOcorrencia",
        dados
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao abrir ocorrência:", error);
      throw error;
    }
  },

  // Editar ocorrência
  async editarOcorrencia(id, dados) {
    try {
      const response = await api.patch(
        `/ocorrencias/editarOcorrencia/${id}`,
        dados
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao editar ocorrência:", error);
      throw error;
    }
  },

  // Encerrar ocorrência
  async encerrarOcorrencia(id) {
    try {
      const response = await api.patch(
        `/ocorrencias/encerrarOcorrencia/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao encerrar ocorrência:", error);
      throw error;
    }
  },

  // Cancelar ocorrência
  async cancelarOcorrencia(id) {
    try {
      const response = await api.patch(
        `/ocorrencias/cancelarOcorrencia/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao cancelar ocorrência:", error);
      throw error;
    }
  },

  // Alterar status
  async alterarStatus(id, novoStatus) {
    try {
      const response = await api.patch(
        `/ocorrencias/alterarStatus/${id}`,
        { novoStatus }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      throw error;
    }
  },

  // Adicionar observação
  async adicionarObservacao(id, ocor_obs) {
    try {
      const response = await api.patch(
        `/ocorrencias/${id}/adicionarObservacao`,
        { ocor_obs }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      throw error;
    }
  },

  // Associar componente
  async associarComponente(id, id_comp) {
    try {
      const response = await api.patch(
        `/ocorrencias/${id}/associarComponente`,
        { id_comp }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao associar componente:", error);
      throw error;
    }
  },

  // Associar ambiente
  async associarAmbiente(id, id_amb) {
    try {
      const response = await api.patch(
        `/ocorrencias/${id}/associarAmbiente`,
        { id_amb }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao associar ambiente:", error);
      throw error;
    }
  },

  // Filtrar por ambiente
  async buscarPorAmbiente(nomeAmb) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorAmbiente",
        { params: { nomeAmb } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por ambiente:", error);
      throw error;
    }
  },

  // Filtrar por componente
  async buscarPorComponente(nomeComp) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorComponente",
        { params: { nomeComp } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por componente:", error);
      throw error;
    }
  },

  // Filtrar por nome
  async buscarPorNome(nomeOcor) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorNome",
        { params: { nomeOcor } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por nome:", error);
      throw error;
    }
  },

  // Filtrar por status
  async buscarPorStatus(status) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorStatus",
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por status:", error);
      throw error;
    }
  },

  // Filtrar por prioridade
  async buscarPorPrioridade(prioridade) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorPrioridade",
        { params: { prioridade } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por prioridade:", error);
      throw error;
    }
  },

  // Filtrar por período
  async buscarPorPeriodo(dataInicio, dataFim) {
    try {
      const response = await api.get(
        "/ocorrencias/buscarPorPeriodo",
        {
          params: { dataInicio, dataFim }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao filtrar por período:", error);
      throw error;
    }
  }
}

export default ocorrenciaService;
