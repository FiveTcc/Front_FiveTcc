
import api from './api'

const atribuicaoTecnicoService = {
  // Listar todos os vínculos
  async listarVinculos() {
    try {
      const response = await api.get('/atribuicaoTecnicos/listarVinculos')
      return response.data
    } catch (error) {
      console.error('Erro ao listar vínculos:', error)
      throw error
    }
  },

  // Vincular técnico a uma ocorrência
  async vincularTecnico(idOcor, id_user) {
    try {
      const response = await api.post(
        `/atribuicaoTecnicos/ocorrencia/${idOcor}/vincularTecnico`,
        { id_user }
      )
      return response.data
    } catch (error) {
      console.error('Erro ao vincular técnico:', error)
      throw error
    }
  },

  // Listar técnicos vinculados a uma ocorrência
  async listarTecnicosDaOcorrencia(idOcor) {
    try {
      const response = await api.get(
        `/atribuicaoTecnicos/ocorrencia/${idOcor}/tecnicos`
      )
      return response.data
    } catch (error) {
      console.error('Erro ao listar técnicos da ocorrência:', error)
      throw error
    }
  },

  // Listar ocorrências de um técnico
  async listarOcorrenciasDoTecnico(id_user) {
    try {
      const response = await api.get(
        `/atribuicaoTecnicos/tecnico/${id_user}/ocorrencias`
      )
      return response.data
    } catch (error) {
      console.error('Erro ao listar ocorrências do técnico:', error)
      throw error
    }
  },

  // Desvincular técnico
  async desvincularTecnico(idVinculo) {
    try {
      const response = await api.delete(
        `/atribuicaoTecnicos/${idVinculo}/desvincular`
      )
      return response.data
    } catch (error) {
      console.error('Erro ao desvincular técnico:', error)
      throw error
    }
  },
}

export default atribuicaoTecnicoService
