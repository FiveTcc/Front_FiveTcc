import api from "./api";

// Rotas do RelatorioController (@Controller('relatorios'))
const ROTA = "/relatorios";
const ROTA_EXPORTAR = "/relatorios/exportar";

// Remove filtros vazios para não enviar "status=" na query
const limparFiltros = (filtros = {}) =>
    Object.fromEntries(
        Object.entries(filtros).filter(([, valor]) => valor !== "" && valor != null)
    );

const relatorioService = {

    // Gerar relatório (dados em JSON)
    async gerarRelatorio(filtros) {
        try {
            const response = await api.get(ROTA, {
                params: limparFiltros(filtros),
            });
            return response.data;

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            throw error;
        }
    },

    // Exportar relatório (pdf ou xlsx) e baixar o arquivo
    async exportarRelatorio(filtros, formato) {
        try {
            const response = await api.get(ROTA_EXPORTAR, {
                params: limparFiltros({ ...filtros, formato }),
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = `relatorio.${formato}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Erro ao exportar relatório:", error);
            throw error;
        }
    },

}

export default relatorioService;