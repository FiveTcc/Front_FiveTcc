import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ocorrenciaService from "../services/ocorrenciaService";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

const STATUS_LABELS = {
  todos: "Todos os status",
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const PRIORIDADE_LABELS = {
  todas: "Todas as prioridades",
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const STATUS_LEGEND = Object.entries(STATUS_LABELS).filter(
  ([value]) => value !== "todos",
);

function normalizarValor(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ");
}

function normalizarOcorrencia(item) {
  const ocorrencia = item?.ocorrencia || item || {};
  const componente = item?.componente || {};
  const ambiente = item?.ambiente || {};

  return {
    ...item,
    id: ocorrencia.id_ocor ?? ocorrencia.id,
    numero: ocorrencia.id_ocor ?? ocorrencia.numero,
    titulo: ocorrencia.ocor_nome ?? ocorrencia.titulo,
    status: normalizarValor(ocorrencia.ocor_status ?? ocorrencia.status),
    prioridade: normalizarValor(
      ocorrencia.ocor_prioridade ?? ocorrencia.prioridade,
    ),
    observacao: ocorrencia.ocor_obs ?? ocorrencia.descricao,
    criadoEm: ocorrencia.criado_em ?? ocorrencia.criadoEm,
    atualizadoEm: ocorrencia.atualizado_em ?? ocorrencia.atualizadoEm,
    componente,
    ambiente,
    categoria:
      componente.compo_nome || ambiente.amb_nome || ocorrencia.categoria || "",
  };
}

function mostrarAtualizacao(valor) {
  if (!valor) return "—";

  if (typeof valor === "string") {
    const correspondencia = valor.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

    if (correspondencia) {
      const [, ano, mes, dia, hora, minuto] = correspondencia;
      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }
  }

  const timestamp = typeof valor === "number" ? valor : new Date(valor).getTime();

  return Number.isNaN(timestamp)
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
}

export default function Chamados() {
  const [chamados, setChamados] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);
  const notificacoes = [];

  useEffect(() => {
    let montado = true;

    async function carregarChamados() {
      try {
        const resposta = await ocorrenciaService.listarOcorrencias();
        const dadosBrutos = Array.isArray(resposta)
          ? resposta
          : Array.isArray(resposta?.ocorrencias)
            ? resposta.ocorrencias
            : Array.isArray(resposta?.data)
              ? resposta.data
              : resposta?.ocorrencia
                ? [resposta]
                : [];
        const dados = dadosBrutos.map(normalizarOcorrencia);

        if (montado) setChamados(dados);
      } catch (error) {
        if (montado) {
          setErro("Não foi possível carregar as ocorrências.");
          console.error("Erro ao carregar ocorrências:", error);
        }
      } finally {
        if (montado) setCarregando(false);
      }
    }

    carregarChamados();

    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return chamados.filter((ocorrencia) => {
      const titulo = ocorrencia.titulo || ocorrencia.nome || "";
      const codigo = ocorrencia.numero || ocorrencia.id || "";
      const correspondeBusca =
        !termo ||
        `${titulo} ${codigo} ${ocorrencia.categoria || ""} ${ocorrencia.ambiente?.amb_nome || ""}`
          .toLowerCase()
          .includes(termo);
      const correspondeStatus =
        filtroStatus === "todos" || ocorrencia.status === filtroStatus;
      const correspondePrioridade =
        filtroPrioridade === "todas" ||
        ocorrencia.prioridade === filtroPrioridade;

      return correspondeBusca && correspondeStatus && correspondePrioridade;
    });
  }, [busca, chamados, filtroPrioridade, filtroStatus]);

  return (
    <div className="page page--tickets">
      <header className="page__header">
        <div>
          <h1>Ocorrências</h1>
          <p className="muted">
            Acompanhe, filtre e priorize as ocorrências abertas.
          </p>
        </div>
      </header>

      <div className="topbar">
        <div className="topbar__search">
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar ocorrências..."
            aria-label="Pesquisar ocorrências"
          />
        </div>

        <div className="topbar__actions">
        <div className="topbar__notifications-wrap" ref={notificacoesRef}>
          <button
            type="button"
            className="topbar__icon-button"
            aria-label="Notificações"
            aria-expanded={mostrarNotificacoes}
            onClick={() => setMostrarNotificacoes((valor) => !valor)}
          >
            🕭
          </button>

          {mostrarNotificacoes && (
            <div
              className="topbar__notifications"
              role="menu"
              aria-label="Notificações"
            >
              <div className="topbar__notifications-header">
                <strong>Notificações</strong>
                <span>{notificacoes.length}</span>
              </div>

              {notificacoes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="topbar__notification-item"
                >
                  <span>{item.titulo}</span>
                  <small>{item.tempo}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="filters">
        <div className="status-legend-container">
          <h2 className="status-legend__title">Legenda de status</h2>
          <ul className="status-legend" aria-label="Legenda de status">
            {STATUS_LEGEND.map(([value, label]) => (
              <li key={value} className="status-legend__item">
                <StatusBeacon status={value} comLabel={false} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="custom-select">
          <span className="custom-select__label">Status</span>
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
            aria-label="Filtrar por status"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="custom-select">
          <span className="custom-select__label">Prioridade</span>
          <select
            value={filtroPrioridade}
            onChange={(event) => setFiltroPrioridade(event.target.value)}
            aria-label="Filtrar por prioridade"
          >
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <Link to="/chamados/novo" className="btn btn--primary">
          + Nova ocorrência
        </Link>
      </div>

      <div className="card__chamados card--table">
        {carregando ? (
          <div className="empty">Carregando ocorrências...</div>
        ) : erro ? (
          <div className="empty">
            <strong>{erro}</strong>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <strong>Nenhuma ocorrência encontrada</strong>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Código</th>
                <th>Título</th>
                <th>Componente</th>
                <th>Prioridade</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((ocorrencia) => (
                <tr key={ocorrencia.id}>
                  <td>
                    <StatusBeacon status={ocorrencia.status} comLabel={false} />
                    {" "}
                    <span className="beacon__label">
                      {STATUS_LABELS[ocorrencia.status] || ocorrencia.status || "—"}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/chamados/${ocorrencia.id}`}
                      className="table__code"
                    >
                      {ocorrencia.numero || ocorrencia.id}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/chamados/${ocorrencia.id}`}
                      className="table__title"
                    >
                      {ocorrencia.titulo || ocorrencia.nome}
                    </Link>
                  </td>
                  <td className="muted">{ocorrencia.categoria || "—"}</td>
                  <td>
                    <PriorityBadge prioridade={ocorrencia.prioridade} />
                  </td>
                  <td className="muted">
                    {mostrarAtualizacao(
                      ocorrencia.atualizadoEm || ocorrencia.updatedAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
