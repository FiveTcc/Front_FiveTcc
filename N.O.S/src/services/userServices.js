import api from "./api";

const userService = {
    // Listar todos os usuários
    async listarUsuarios() {
        try {
            const response = await api.get("/usuarios/listarUser");
            return response.data;
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            throw error;
        }
    },

    // Buscar usuário por ID
    async buscarUsuarioPorId(id) {
        try {
            const response = await api.get(`/usuarios/listarUserId/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar usuário por ID:", error);
            throw error;
        }
    },

    // Cadastrar usuário
    async cadastrarUsuario(dados) {
        try {
            const response = await api.post("/usuarios/cadastrarUser", dados);
            return response.data;
        } catch (error) {
            console.error("Erro ao cadastrar usuário:", error);
            throw error;
        }
    },

    // Atualizar usuário por ID
    async atualizarUsuario(id, dados) {
        try {
            const response = await api.put(
                `/usuarios/atualizarUser/${id}`,
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            throw error;
        }
    },

    // Inativar usuário
    async inativarUsuario(id) {
        try {
            const response = await api.patch(`/usuarios/inativarUser/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao inativar usuário:", error);
            throw error;
        }
    },

    // Listar status dos usuários
    async listarStatusUsuarios() {
        try {
            const response = await api.get("/usuarios/listarStatusUser");
            return response.data;
        } catch (error) {
            console.error("Erro ao listar status dos usuários:", error);
            throw error;
        }
    },

    // Buscar perfil do usuário autenticado
    async buscarperfil() {
        try {
            const response = await api.get("/usuarios/perfilUser");
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            throw error;
        }
    },

    // Atualizar meu perfil
    async atualizarPerfil(dados) {
        try {
            const response = await api.patch(
                "/usuarios/perfilUpdate",
                dados
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            throw error;
        }
    },

    // Adicionar ou atualizar foto de perfil
    async adicionarFoto(arquivo) {
        try {
            if (!arquivo) {
                throw new Error("Arquivo obrigatório.");
            }

            const formData = new FormData();
            const nomeArquivo = arquivo.name || "perfil.jpg";
            formData.append("foto", arquivo, nomeArquivo);

            const response = await api.post("/usuarios/Pefilfoto", formData, {
                headers: {
                    "Content-Type": undefined,
                },
            });

            return response.data;
        } catch (error) {
            const detalhe =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data;

            console.error("Erro ao enviar foto de perfil:", {
                status: error?.response?.status,
                detalhe,
            });

            if (typeof detalhe === "string") {
                error.message = detalhe;
            }

            throw error;
        }
    },
};

export default userService;
