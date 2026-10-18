import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import dashboardService from "../services/dashboardService";
import ocorrenciaService from "../services/ocorrenciaService";
import userService from "../services/userServices";

import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";


const CORES_STATUS = {
  aberta: "#E8862E",
  "em andamento": "#2563EB",
  concluida: "#16A870",
  cancelada: "#D42424",
};

const STATUS_LABELS = {
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function normalizarStatus(valor) {
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
    status: normalizarStatus(ocorrencia.ocor_status ?? ocorrencia.status),
    prioridade: ocorrencia.ocor_prioridade ?? ocorrencia.prioridade,
    atualizadoEm: ocorrencia.atualizado_em ?? ocorrencia.atualizadoEm,
    categoria:
      componente.compo_nome || ambiente.amb_nome || ocorrencia.categoria || "",
  };
}

function mostrarTempoAtualizacao(valor) {
  if (!valor) return "—";

  if (typeof valor === "string") {
    const correspondencia = valor.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );

    if (correspondencia) {
      const [, , , , hora, minuto] = correspondencia;
      return `${hora}:${minuto}`;
    }
  }

  const timestamp = typeof valor === "number" ? valor : new Date(valor).getTime();
  return Number.isNaN(timestamp)
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(timestamp);
}

function Donut({ dados, total }) {
  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  let acumulado = 0;

  return (
    <svg viewBox="0 0 140 140" className="donut">
      <circle
        cx="70"
        cy="70"
        r={raio}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth="16"
      />
      {dados.map(([status, qtd]) => {
        if (!qtd) return null;
        const fracao = qtd / total;
        const comprimento = fracao * circunferencia;
        const dashoffset = circunferencia - acumulado;
        acumulado += comprimento;
        return (
          <circle
            key={status}
            cx="70"
            cy="70"
            r={raio}
            fill="none"
            stroke={CORES_STATUS[status]}
            strokeWidth="16"
            strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 70 70)"
            strokeLinecap="butt"
          />
        );
      })}
      <text x="70" y="66" textAnchor="middle" className="donut__total">
        {total}
      </text>
      <text x="70" y="84" textAnchor="middle" className="donut__legenda">
        chamados
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [dadosDashboard, setDadosDashboard] = useState(null);
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);




  useEffect(() => {

    // Buscar nome do usuário
    async function buscarNome() {
      try {
        const response = await userService.buscarperfil();
        setNome(response.nome || response.user_nome || "");
        
      } catch (err) {
        console.error(err);
      }

    }

    // Carregar dados do dashboard
    async function carregar() {
      try {
        const dados = await dashboardService.buscarDashboard();
        setDadosDashboard(dados);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setCarregandoDashboard(false);
      }
    }

    async function carregarOcorrencias() {
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
        setChamados(dadosBrutos.map(normalizarOcorrencia));
      } catch (error) {
        console.error("Erro ao carregar ocorrências recentes:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
    buscarNome();
    carregarOcorrencias();
  }, [usuario]);


  const notificacoes = [];

  const contagem = useMemo(() => {
    const base = {
      aberta: 0,
      "em andamento": 0,
      concluida: 0,
      cancelada: 0,
    };
    chamados.forEach((c) => {
      base[c.status] = (base[c.status] || 0) + 1;
    });
    return base;
  }, [chamados]);

  const abertos = contagem.aberta + contagem["em andamento"];
  const criticos = chamados.filter(
    (c) =>
      c.prioridade === "critica" &&
      c.status !== "concluida" &&
      c.status !== "cancelada",
  ).length;
  const recentes = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return chamados
      .filter(
        (c) =>
          !termo ||
          `${c.titulo || ""} ${c.numero || ""} ${c.categoria || ""}`
            .toLowerCase()
            .includes(termo),
      )
      .slice(0, 5);
  }, [chamados, busca]);

  return (
    <div className="page page--dashboard">
      <div className="page__top">
        {/* Barra superior */}
        <header className="page__header">
          <div>
            <h1>Olá, {(nome || usuario.nome)?.toLowerCase()} </h1>
            <p className="muted">
              Visão geral dos chamados sob monitoramento agora.
            </p>
          </div>
        </header>

        <div className="topbar">
          <div className="topbar__search">
            <span className="topbar__icon" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar chamados..."
              aria-label="Pesquisar chamados"
            />
          </div>

          <div className="topbar__actions">
            <div className="topbar__notifications-wrap">
              <button
                type="button"
                className="topbar__icon-button"
                aria-label="Notificações"
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
      </div>

      <div className="dashboard__actions">
        <Link to="/chamados/novo" className="btn btn--primary">
          + Novo chamado
        </Link>
      </div>

      {/* Estatísticas */}
      <section className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Em aberto</span>
          <span className="stat-card__value">
            {dadosDashboard?.ocorrenciasAbertas ?? 0}
          </span>
          <span className="stat-card__hint">aguardando ação</span>
        </div>

        <div className="stat-card stat-card--alert">
          <span className="stat-card__label">Críticos ativos</span>
          <span className="stat-card__value">
            {dadosDashboard?.ocorrenciasCriticas ?? 0}
          </span>
          <span className="stat-card__hint">prioridade máxima</span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Resolvidos</span>
          <span className="stat-card__value">
            {dadosDashboard?.ocorrenciasResolvidas ?? 0}
          </span>
          <span className="stat-card__hint">este período</span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Total no sistema</span>
          <span className="stat-card__value">
            {dadosDashboard?.ocorrenciasTotal ?? 0}
          </span>
          <span className="stat-card__hint">desde o início</span>
        </div>
      </section>


      {/* Conteúdo principal */}
      <section className="grid-2">
        {/* Distribuição por status */}
        <div className="card__status">
          <h2>Distribuição por status</h2>

          <div className="donut-row">
            <Donut
              dados={Object.entries(contagem)}
              total={chamados.length || 1}
            />

            <ul className="donut-legend">
              {Object.entries(contagem).map(([status, qtd]) => (
                <li key={status}>
                  <span
                    className="donut-legend__dot"
                    style={{
                      background: CORES_STATUS[status],
                    }}
                  />

                  {STATUS_LABELS[status] || status}

                  <strong>{qtd}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="card__atividade">
          <div className="card__header">
            <h2>Atividade recente</h2>

            <Link to="/chamados" className="link">
              ver todos
            </Link>
          </div>

          <ul className="recent-list">
            {recentes.map((c) => (
              <li key={c.id}>
                <Link to={`/chamados/${c.id}`} className="recent-item">
                  <StatusBeacon status={c.status} comLabel={false} />

                  <div className="recent-item__body">
                    <span className="recent-item__code">{c.numero}</span>

                    <span className="recent-item__title">{c.titulo}</span>
                  </div>

                  <PriorityBadge prioridade={c.prioridade} />

                  <span className="recent-item__time">
                    {mostrarTempoAtualizacao(c.atualizadoEm)}
                  </span>
                </Link>
              </li>
            ))}

            {!recentes.length && (
              <li className="muted">Nenhum chamado encontrado.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
