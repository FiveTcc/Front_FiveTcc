
import api from "./api";

const componenteService = {

    // Listar todos os componentes
    async listarComponente() {
        try {
            const response = await api.get("/componentes/listarComponente");
            return response.data;
        } catch (error) {
            console.error("Erro ao listar componentes:", error);
            throw error;
        }
    },

    // Buscar componente por ID
    async listarComponenteId(id) {
        try {
            const response = await api.get(`/componentes/listarComponenteId/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar componente por ID:", error);
            throw error;
        }
    },

    // Cadastrar componente
    async cadastrarComponente(dados) {
        try {
            const response = await api.post(
                "/componentes/cadastrarComponente",
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao cadastrar componente:", error);
            throw error;
        }
    },

    // Atualizar componente
    async atualizarComponente(id, dados) {
        try {
            const response = await api.patch(
                `/componentes/atualizarComponente/${id}`,
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar componente:", error);
            throw error;
        }
    },

    // Excluir componente
    async excluirComponente(id) {
        try {
            const response = await api.delete(
                `/componentes/excluirComponente/${id}`
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao excluir componente:", error);
            throw error;
        }
    },

    // Atualizar status do componente
    async atualizarStatusComponente(id) {
        try {
            const response = await api.patch(
                `/componentes/atualizarStatusComponente/${id}`
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar status do componente:", error);
            throw error;
        }
    },

    // Associar componente ao ambiente
    async associarComponenteAmbiente(id, id_amb) {
        try {
            const response = await api.patch(
                `/componentes/${id}/associarComponenteAmbiente`,
                { id_amb }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao associar componente ao ambiente:", error);
            throw error;
        }
    },

    // Alterar tipo do componente
    async alterarTipoComponente(id, compo_tipo_id) {
        try {
            const response = await api.patch(
                `/componentes/${id}/alterarTipoComponente`,
                { compo_tipo_id }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao alterar tipo do componente:", error);
            throw error;
        }
    },

    // Filtrar componentes por ambiente
    async buscarPorAmbiente(nomeAmb) {
        try {
            const response = await api.get(
                "/componentes/buscarPorAmbiente",
                { params: { nomeAmb } }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao filtrar componentes por ambiente:", error);
            throw error;
        }
    },

    // Filtrar componentes por tipo
    async buscarPorTipo(tipo) {
        try {
            const response = await api.get(
                "/componentes/buscarPorTipo",
                { params: { tipo } }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao filtrar componentes por tipo:", error);
            throw error;
        }
    },

    // Filtrar componentes por nome
    async buscarPorNome(nome) {
        try {
            const response = await api.get(
                `/componentes/buscarPorNome/${encodeURIComponent(nome)}`
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao filtrar componentes por nome:", error);
            throw error;
        }
    },
};

export default componenteService;
