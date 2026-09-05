import api from "./api";

const userService = {
 
    // funçao para buscar o perfil do usuário
   async buscarperfil(){
        try{
            const response = await api.get("/usuarios/perfilUser");
            return response.data;
        }catch (error) {
            console.error("Erro ao buscar perfil:", error);
            throw error;
        }
    }

    
    
}

export default userService;