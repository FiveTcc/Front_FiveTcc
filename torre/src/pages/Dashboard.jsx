import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/storage";
import { STATUS_LABEL, tempoRelativo } from "../services/utils";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  } catch {
    return "light";
  }
}

const CORES_STATUS = {
  aberto: "#E8862E",
  em_andamento: "#2563EB",
  aguardando: "#B9860B",
  resolvido: "#16A870",
  fechado: "#93A2B3",
};

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
  const [theme, setTheme] = useState(getInitialTheme);
  const [busca, setBusca] = useState("");
  const chamados = useMemo(() => db.listarChamados(), []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const contagem = useMemo(() => {
    const base = {
      aberto: 0,
      em_andamento: 0,
      aguardando: 0,
      resolvido: 0,
      fechado: 0,
    };
    chamados.forEach((c) => {
      base[c.status] = (base[c.status] || 0) + 1;
    });
    return base;
  }, [chamados]);

  const abertos = contagem.aberto + contagem.em_andamento + contagem.aguardando;
  const criticos = chamados.filter(
    (c) =>
      c.prioridade === "critica" &&
      c.status !== "resolvido" &&
      c.status !== "fechado",
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
            <h1>Olá, {usuario?.nome?.split(" ")[0]}</h1>
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
            placeholder="Pesquisar meus chamados..."
            aria-label="Pesquisar chamados"
          />
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="topbar__icon-button"
            aria-label="Notificações"
          >
            🔔
          </button>

          <button
            type="button"
            className="topbar__icon-button"
            aria-label={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "dark" ? "light" : "dark",
              )
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
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

          <span className="stat-card__value">{abertos}</span>

          <span className="stat-card__hint">aguardando ação</span>
        </div>

        <div className="stat-card stat-card--alert">
          <span className="stat-card__label">Críticos ativos</span>

          <span className="stat-card__value">{criticos}</span>

          <span className="stat-card__hint">prioridade máxima</span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Resolvidos</span>

          <span className="stat-card__value">{contagem.resolvido}</span>

          <span className="stat-card__hint">este período</span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Total no sistema</span>

          <span className="stat-card__value">{chamados.length}</span>

          <span className="stat-card__hint">desde o início</span>
        </div>
      </section>

      {/* Conteúdo principal */}
      <section className="grid-2">
        {/* Distribuição por status */}
        <div className="card">
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

                  {STATUS_LABEL[status]}

                  <strong>{qtd}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="card">
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
                    {tempoRelativo(c.atualizadoEm)}
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
