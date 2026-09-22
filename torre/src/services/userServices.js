import api from "./api";

const userService = {

    // funçao para buscar o perfil do usuário
    async buscarperfil() {
        try {
            const response = await api.get("/usuarios/perfilUser");
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            throw error;
        }
    },

    async adicionarFoto(arquivo) {
        try {
            if (!arquivo) throw new Error("Arquivo obrigatório.");

            const formData = new FormData();
            formData.append("foto", arquivo);

            const response = await api.post("/usuarios/Pefilfoto", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data;
        } catch (erro) {
            console.error("Erro ao enviar foto de perfil:", erro);
            throw erro;
        }
    }



}

export default userService;