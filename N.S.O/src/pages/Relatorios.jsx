import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  formatarData,
} from "../services/utils";
import CustomSelect from "../components/CustomSelect";
import relatorioService from "../services/relatorioService";

const PERFIL_LABEL = {
  admin: "Administrador",
  administrador: "Administrador",
  tecnico: "Técnico",
};

function rotuloStatus(status) {
  return STATUS_LABEL?.[status] || status || "Não informado";
}

function rotuloPrioridade(prioridade) {
  return PRIORIDADE_LABEL?.[prioridade] || prioridade || "Não informada";
}

function formatarTempoMedio(horas) {
  if (horas === null || horas === undefined || !Number.isFinite(Number(horas))) {
    return "—";
  }

  const valor = Number(horas);
  if (valor < 24) return `${valor.toFixed(1)}h`;
  return `${(valor / 24).toFixed(1)}d`;
}

function dataOrdenacao(valor) {
  if (!valor) return 0;
  const timestamp = new Date(valor).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default function Relatorios() {
  const { usuario } = useAuth();
  const perfil = usuario?.role || usuario?.perfil || usuario?.user_tipo || "tecnico";
  const ehAdmin = ["admin", "administrador"].includes(perfil);

  const [dadosRelatorio, setDadosRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensagemExportacao, setMensagemExportacao] = useState("");
  const [filtros, setFiltros] = useState({
    data_inicial: "",
    data_final: "",
    status: "",
    prioridade: "",
    ambiente: "",
    tecnico: "",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarRelatorios() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await relatorioService.gerarRelatorio();
        if (ativo) setDadosRelatorio(resposta);
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
        if (ativo) setErro("Não foi possível carregar os relatórios.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarRelatorios();
    return () => {
      ativo = false;
    };
  }, []);

  async function pesquisarComFiltros(event) {
    event?.preventDefault();

    const filtrosAplicados = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== ""),
    );

    try {
      setCarregando(true);
      setErro("");
      const resposta = await relatorioService.gerarRelatorio(filtrosAplicados);
      setFiltrosAplicados(filtrosAplicados);
      setDadosRelatorio(resposta);
    } catch (error) {
      console.error("Erro ao aplicar filtros do relatório:", error);
      setErro("Não foi possível pesquisar com os filtros informados.");
    } finally {
      setCarregando(false);
    }
  }

  async function limparFiltros() {
    setFiltros({
      data_inicial: "",
      data_final: "",
      status: "",
      prioridade: "",
      ambiente: "",
      tecnico: "",
    });
    setFiltrosAplicados({});

    try {
      setCarregando(true);
      setErro("");
      const resposta = await relatorioService.gerarRelatorio();
      setDadosRelatorio(resposta);
    } catch (error) {
      console.error("Erro ao limpar filtros do relatório:", error);
      setErro("Não foi possível atualizar o relatório.");
    } finally {
      setCarregando(false);
    }
  }

  // A API já entrega as ocorrências filtradas conforme o perfil autenticado.
  const linhas = dadosRelatorio?.linhas || [];
  const resumo = dadosRelatorio?.resumo || {
    total: 0,
    abertas: 0,
    emAndamento: 0,
    concluidas: 0,
    canceladas: 0,
    tempoMedioHoras: null,
  };

  const opcoesFiltros = dadosRelatorio?.opcoesFiltros || {
    ambientes: [],
    tecnicos: [],
  };

  // =========================================================
  // DADOS PREPARADOS PARA OS INDICADORES
  // =========================================================

  // Padroniza os dados recebidos da API.
  const chamadosVisiveis = useMemo(() => {
    return linhas.map((linha) => ({
      id: linha.id,
      categoria: linha.ambiente || "Não informado",
      componente: linha.componente || "Não informado",
      responsavelNome: linha.tecnico_responsavel || "Não atribuído",
    }));
  }, [linhas]);

  // Agrupa as ocorrências por técnico responsável.

  const tecnicos = useMemo(() => {
    const agrupados = {};

    chamadosVisiveis.forEach((chamado) => {
      const responsaveis = chamado.responsavelNome
        .split(",")
        .map((nome) => nome.trim())
        .filter(
          (nome) => nome && nome !== "Não atribuído"
        );

      responsaveis.forEach((nome) => {
        agrupados[nome] = (agrupados[nome] || 0) + 1;
      });
    });

    return Object.entries(agrupados)
      .map(([nome, atendidos]) => ({
        nome,
        atendidos,
      }))
      .sort((a, b) => b.atendidos - a.atendidos);
  }, [chamadosVisiveis]);


  // Ocorrências agrupadas por ambiente.
  const ocorrenciasPorAmbiente = useMemo(() => {
    const agrupados = {};

    chamadosVisiveis.forEach((chamado) => {
      const nome = chamado.categoria || "Não informado";
      agrupados[nome] = (agrupados[nome] || 0) + 1;
    });

    return Object.entries(agrupados)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [chamadosVisiveis]);

  // Componentes que apresentam mais ocorrências.
  const componentesComFalha = useMemo(() => {
    const agrupados = {};

    chamadosVisiveis.forEach((chamado) => {
      const nome = chamado.componente || "Não informado";
      agrupados[nome] = (agrupados[nome] || 0) + 1;
    });

    return Object.entries(agrupados)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [chamadosVisiveis]);

  // Técnicos com maior quantidade de ocorrências atribuídas.
  const tecnicosComMaisOcorrencias = useMemo(() => {
    return tecnicos.slice(0, 5).map((tecnico) => ({
      nome: tecnico.nome,
      total: tecnico.atendidos,
    }));
  }, [tecnicos]);

  // O frontend não reaplica regras de acesso nem filtra ocorrências por usuário.
  // Apenas prepara os registros recebidos para apresentação.
  const historico = useMemo(
    () =>
      [...linhas].sort(
        (a, b) => Number(b.id) - Number(a.id)
      ),
    [linhas]
  );


  const historicoExibido = mostrarHistoricoCompleto
    ? historico
    : historico.slice(0, 5);

  const chamadosPorPrioridade = useMemo(() => {
    const totais = new Map();

    linhas.forEach((linha) => {
      const prioridade = linha.prioridade || "Não informada";
      totais.set(prioridade, (totais.get(prioridade) || 0) + 1);
    });

    return Array.from(totais, ([valor, total]) => ({
      label: rotuloPrioridade(valor),
      total,
    })).sort((a, b) => b.total - a.total);
  }, [linhas]);

  const agrupamento = dadosRelatorio?.agrupamento;

  async function exportarRelatorio(formato) {
    try {
      setExportando(true);
      setMensagemExportacao("");

      // O backend aplica novamente as restrições do usuário autenticado.
      await relatorioService.exportarRelatorio(filtrosAplicados, formato);
      setMensagemExportacao("Relatório exportado com sucesso!");
      setMenuExportarAberto(false);
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      setMensagemExportacao("Erro ao exportar relatório.");
    } finally {
      setExportando(false);
      window.setTimeout(() => setMensagemExportacao(""), 3000);
    }
  }

  const metricas = [
    { label: "Total de ocorrências", valor: resumo.total ?? 0, destaque: true },
    { label: "Abertas", valor: resumo.abertas ?? 0 },
    { label: "Em andamento", valor: resumo.emAndamento ?? 0 },
    { label: "Concluídas", valor: resumo.concluidas ?? 0 },
    { label: "Canceladas", valor: resumo.canceladas ?? 0 },
    {
      label: "Tempo médio de atendimento",
      valor: formatarTempoMedio(resumo.tempoMedioHoras),
    },
  ];

  return (
    <div className="page page--reports">
      <header className="page__header">
        <div>
          <h1>{PERFIL_LABEL[perfil] || "Relatórios"}</h1>
          <p className="muted">
            {ehAdmin
              ? "Visão consolidada das ocorrências do sistema."
              : "Visão das ocorrências disponibilizadas para seu perfil."}
          </p>
        </div>

        <div className="report-export__actions">
          {mensagemExportacao && (
            <div className="report-export__status" role="status">
              {mensagemExportacao}
            </div>
          )}

          <div className="report-export">
            <button
              type="button"
              className="btn btn--primary"
              disabled={exportando}
              onClick={() => setMenuExportarAberto((aberto) => !aberto)}
            >
              {exportando ? "Exportando..." : "Exportar"}
            </button>

            {menuExportarAberto && (
              <div className="report-export__menu">
                <button
                  type="button"
                  disabled={exportando}
                  onClick={() => exportarRelatorio("xlsx")}
                >
                  Excel
                </button>
                <button
                  type="button"
                  disabled={exportando}
                  onClick={() => exportarRelatorio("pdf")}
                >
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {carregando && <p className="muted">Carregando relatórios...</p>}
      {erro && <p className="muted" role="alert">{erro}</p>}

      {!carregando && !erro && (
        <>
          <section className="report-container">
            <section className="report-summary">
              {metricas.map((item) => (
                <div
                  key={item.label}
                  className={`report-summary__card ${item.destaque ? "is-featured" : ""}`}
                >
                  <span>{item.label}</span>
                  <strong>{item.valor}</strong>
                </div>
              ))}
            </section>

            <div className="report-content">
              {ehAdmin && agrupamento && (
                <div className="card">
                  <div className="card__header">
                    <h2>Ocorrências agrupadas</h2>
                  </div>
                  <div className="report-list">
                    {agrupamento.map((item, indice) => {
                      const nome =
                        item.tecnico ||
                        item.ambiente ||
                        item.status ||
                        item.prioridade ||
                        item.data ||
                        `Grupo ${indice + 1}`;
                      return (
                        <div key={`${nome}-${indice}`} className="report-row">
                          <span>{rotuloStatus(nome)}</span>
                          <strong>{Number(item.total) || 0}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <section className="card report-filters">
                <div className="card__header">
                  <div>
                    <h2>Filtrar relatório</h2>
                    <p className="muted">Refine os resultados pelos filtros disponíveis.</p>
                  </div>
                </div>

                <form onSubmit={pesquisarComFiltros}>
                  <div className="report-filters__grid">
                    <label className="report-filters__field">
                      <span>Data inicial</span>
                      <input
                        type="date"
                        value={filtros.data_inicial}
                        onChange={(event) => setFiltros((atual) => ({ ...atual, data_inicial: event.target.value }))}
                      />
                    </label>

                    <label className="report-filters__field">
                      <span>Data final</span>
                      <input
                        type="date"
                        value={filtros.data_final}
                        min={filtros.data_inicial || undefined}
                        onChange={(event) => setFiltros((atual) => ({ ...atual, data_final: event.target.value }))}
                      />
                    </label>

                    <label className="report-filters__field">
                      <span>Status</span>
                      <CustomSelect
                        id="report-status"
                        label="Status"
                        value={filtros.status}
                        options={[
                          { value: "", label: "Todos os status" },
                          { value: "aberta", label: "Aberta" },
                          { value: "em andamento", label: "Em andamento" },
                          { value: "concluida", label: "Concluída" },
                          { value: "cancelada", label: "Cancelada" },
                        ]}
                        onChange={(value) => setFiltros((atual) => ({ ...atual, status: value }))}
                      />
                    </label>

                    <label className="report-filters__field">
                      <span>Prioridade</span>
                      <CustomSelect
                        id="report-priority"
                        label="Prioridade"
                        value={filtros.prioridade}
                        options={[
                          { value: "", label: "Todas as prioridades" },
                          { value: "baixa", label: "Baixa" },
                          { value: "media", label: "Média" },
                          { value: "alta", label: "Alta" },
                          { value: "critica", label: "Crítica" },
                        ]}
                        onChange={(value) => setFiltros((atual) => ({ ...atual, prioridade: value }))}
                      />
                    </label>

                    <label className="report-filters__field">
                      <span>Ambiente</span>
                      <CustomSelect
                        id="report-environment"
                        label="Ambiente"
                        value={filtros.ambiente}
                        options={[
                          { value: "", label: "Todos os ambientes" },
                          ...(opcoesFiltros.ambientes || []).map((ambiente) => ({
                            value: String(ambiente.id),
                            label: ambiente.nome,
                          })),
                        ]}
                        onChange={(value) => setFiltros((atual) => ({ ...atual, ambiente: value }))}
                      />
                    </label>

                    {ehAdmin && (
                      <label className="report-filters__field">
                        <span>Técnico</span>
                        <CustomSelect
                          id="report-technician"
                          label="Técnico"
                          value={filtros.tecnico}
                          options={[
                            { value: "", label: "Todos os técnicos" },
                            ...(opcoesFiltros.tecnicos || []).map((tecnico) => ({
                              value: String(tecnico.id),
                              label: tecnico.nome,
                            })),
                          ]}
                          onChange={(value) => setFiltros((atual) => ({ ...atual, tecnico: value }))}
                        />
                      </label>
                    )}
                  </div>

                  <div className="report-filters__actions">
                    <button type="button" className="btn btn--secondary" onClick={limparFiltros} disabled={carregando}>
                      Limpar filtros
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={carregando}>
                      {carregando ? "Pesquisando..." : "Pesquisar"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Indicadores adicionais dos relatórios */}
              <section className="report-extra-grid">

                {/* Ocorrências por ambiente */}
                <div className="report-extra-card">
                  <div className="report-extra-card__header">
                    <span className="report-extra-card__icon report-extra-card__icon--blue">
                      <i className="bi bi-building"></i>
                    </span>
                    <h3>Ambientes com mais ocorrências</h3>
                  </div>

                  {ocorrenciasPorAmbiente.map((item) => (
                    <div className="report-extra-row" key={item.nome}>
                      <span>{item.nome}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>

                {/* Componentes com mais falhas */}
                <div className="report-extra-card">
                  <div className="report-extra-card__header">
                    <span className="report-extra-card__icon report-extra-card__icon--purple">
                      <i className="bi bi-puzzle"></i>
                    </span>
                    <h3>Componentes com mais falhas</h3>
                  </div>

                  {componentesComFalha.map((item) => (
                    <div className="report-extra-row" key={item.nome}>
                      <span>{item.nome}</span>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>

                {/* Técnicos com mais ocorrências - somente administrador */}
                {ehAdmin && (
                  <div className="report-extra-card">
                    <div className="report-extra-card__header">
                      <span className="report-extra-card__icon report-extra-card__icon--green">
                        <i className="bi bi-people"></i>
                      </span>

                      <h3>Técnicos com mais ocorrências</h3>
                    </div>

                    {tecnicosComMaisOcorrencias.length > 0 ? (
                      tecnicosComMaisOcorrencias.map((item) => (
                        <div className="report-extra-row" key={item.nome}>
                          <span>{item.nome}</span>
                          <strong>{item.total}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="muted">Nenhuma ocorrência atribuída.</p>
                    )}
                  </div>
                )}

              </section>
            </div>
          </section>

          <div className="card_historico">
            <div className="card__header">
              <h2>Histórico de ocorrências</h2>
            </div>

            {historicoExibido.length > 0 ? (
              <>
                <div className="report-history">
                  {historicoExibido.map((linha) => (
                    <div key={linha.id} className="report-history__item">
                      <div>
                        <strong>#{linha.id}</strong>
                        <span>{linha.nome || "Sem descrição"}</span>
                      </div>

                      <div>
                        <small>Solicitante: {linha.criado_por || "—"}</small>
                        <small>
                          Responsável:{" "}
                          {linha.tecnico_responsavel || "Não atribuído"}
                        </small>
                      </div>

                      <div>
                        <small>{rotuloStatus(linha.status)}</small>
                        <small>{linha.ambiente || "Sem ambiente"}</small>
                      </div>

                      <time>
                        {linha.criado_em
                          ? formatarData(dataOrdenacao(linha.criado_em))
                          : "—"}
                      </time>
                    </div>
                  ))}
                </div>

                {historico.length > 5 && (
                  <div className="report-history__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() =>
                        setMostrarHistoricoCompleto((atual) => !atual)
                      }
                    >
                      {mostrarHistoricoCompleto ? "Ver menos" : "Ver mais"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">Nenhuma ocorrência encontrada.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}