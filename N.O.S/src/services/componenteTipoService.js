
import api from "./api";

const componenteTipoService = {

    // Função para listar todos os tipos de componentes
    async listarComponenteTipo() {
        try {
            const response = await api.get("/componentes-tipo/listarComponenteTipo");
            return response.data;
        } catch (error) {
            console.error("Erro ao listar tipos de componentes:", error);
            throw error;
        }
    },

    // Função para buscar tipo de componente por ID
    async listarComponenteTipoId(id) {
        try {
            const response = await api.get(`/componentes-tipo/listarComponenteTipoId/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar tipo de componente por ID:", error);
            throw error;
        }
    },

    // Função para cadastrar tipo de componente
    async cadastrarComponenteTipo(dados) {
        try {
            const response = await api.post(
                "/componentes-tipo/cadastrarComponenteTipo",
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao cadastrar tipo de componente:", error);
            throw error;
        }
    },

    // Função para atualizar tipo de componente
    async atualizarComponenteTipo(id, dados) {
        try {
            const response = await api.patch(
                `/componentes-tipo/atualizarComponenteTipo/${id}`,
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar tipo de componente:", error);
            throw error;
        }
    },

    // Função para excluir tipo de componente
    async excluirComponenteTipo(id) {
        try {
            const response = await api.delete(
                `/componentes-tipo/excluirComponenteTipo/${id}`
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao excluir tipo de componente:", error);
            throw error;
        }
    },
};

export default componenteTipoService;
