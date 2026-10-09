import api from "./api";



const dashboardService = {

    async buscarDashboard(){

        try{
            const response = await api.get("/dashboard");
            return response.data;
            
        }catch (error) {
            console.error("Erro ao buscar dashboard:", error);
            throw error;
        }

    }

}


export default dashboardService;