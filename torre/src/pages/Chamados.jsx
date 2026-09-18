import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/storage";
import { tempoRelativo } from "../services/utils";
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

export default function Chamados() {
  const { usuario } = useAuth();

  const [theme, setTheme] = useState(getInitialTheme);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [openSelect, setOpenSelect] = useState(null);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);

  const statusLabels = {
    todos: "Todos os status",
    aberto: "Aberto",
    em_andamento: "Em andamento",
    aguardando: "Aguardando",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };

  const prioridadeLabels = {
    todas: "Todas as prioridades",
    critica: "Crítica",
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };

  const todos = useMemo(() => db.listarChamados(), []);
  const usuarios = useMemo(() => db.listarUsuarios(), []);

  const notificacoes = useMemo(
    () => [
      {
        id: 1,
        titulo: "2 chamados críticos aguardam atenção",
        tempo: "há 10 min",
      },
      { id: 2, titulo: "Novo chamado de rede foi aberto", tempo: "há 25 min" },
      { id: 3, titulo: "Chamado #CH-2025-0002 foi atualizado", tempo: "há 1h" },
      { id: 4, titulo: "Relatório de manutenção está pronto", tempo: "há 2h" },
    ],
    [],
  );

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {
      // Ignora erros de localStorage
    }
  }, [theme]);

  useEffect(() => {
    function handleClickFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  // CHAMADOS DO USUÁRIO LOGADO
  const meusChamados = useMemo(() => {
    if (!usuario) return [];

    return todos.filter(
      (chamado) =>
        chamado.usuarioId === usuario.id ||
        chamado.solicitanteId === usuario.id ||
        chamado.criadoPorId === usuario.id,
    );
  }, [todos, usuario]);

  // RESUMO DOS CHAMADOS
  const total = meusChamados.length;

  const abertos = meusChamados.filter(
    (chamado) => chamado.status === "aberto",
  ).length;

  const andamento = meusChamados.filter(
    (chamado) => chamado.status === "em_andamento",
  ).length;

  const concluidos = meusChamados.filter(
    (chamado) => chamado.status === "resolvido" || chamado.status === "fechado",
  ).length;

  // ÚLTIMO CHAMADO
  const ultimoChamado = useMemo(() => {
    if (meusChamados.length === 0) return null;

    return [...meusChamados].sort(
      (a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm),
    )[0];
  }, [meusChamados]);

  // USUÁRIO POR ID
  const usuarioPorId = (id) => {
    return usuarios.find((u) => u.id === id);
  };

  // FILTROS DA TABELA
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return todos.filter((c) => {
      const buscaOk =
        !termo ||
        `${c.titulo || ""} ${c.numero || ""} ${c.categoria || ""}`
          .toLowerCase()
          .includes(termo);

      const statusOk = filtroStatus === "todos" || c.status === filtroStatus;

      const prioridadeOk =
        filtroPrioridade === "todas" || c.prioridade === filtroPrioridade;

      return buscaOk && statusOk && prioridadeOk;
    });
  }, [todos, busca, filtroStatus, filtroPrioridade]);

  return (
    <div className="page page--tickets">
      <div className="page__top">
        <header className="page__header">
          <div>
            <h1>Chamados</h1>

            <p className="muted">
              Acompanhe, filtre e priorize as solicitações abertas.
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
            <div className="topbar__notifications-wrap" ref={notificacoesRef}>
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

      {/* ==========================================
          FILTROS
      ========================================== */}
      <div className="filters">
        <div className="custom-select" style={{ minWidth: 190 }}>
          <button
            type="button"
            className={`custom-select__trigger ${openSelect === "status" ? "is-open" : ""}`}
            onClick={() =>
              setOpenSelect((current) =>
                current === "status" ? null : "status",
              )
            }
          >
            <span>{statusLabels[filtroStatus]}</span>
            <span className="custom-select__caret">▾</span>
          </button>

          {openSelect === "status" && (
            <div
              className="custom-select__menu"
              role="listbox"
              aria-label="Status"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`custom-select__option ${filtroStatus === value ? "is-selected" : ""}`}
                  onClick={() => {
                    setFiltroStatus(value);
                    setOpenSelect(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="custom-select" style={{ minWidth: 210 }}>
          <button
            type="button"
            className={`custom-select__trigger ${openSelect === "prioridade" ? "is-open" : ""}`}
            onClick={() =>
              setOpenSelect((current) =>
                current === "prioridade" ? null : "prioridade",
              )
            }
          >
            <span>{prioridadeLabels[filtroPrioridade]}</span>
            <span className="custom-select__caret">▾</span>
          </button>

          {openSelect === "prioridade" && (
            <div
              className="custom-select__menu"
              role="listbox"
              aria-label="Prioridade"
            >
              {Object.entries(prioridadeLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`custom-select__option ${filtroPrioridade === value ? "is-selected" : ""}`}
                  onClick={() => {
                    setFiltroPrioridade(value);
                    setOpenSelect(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link to="/chamados/novo" className="btn btn--primary">
          + Novo chamado
        </Link>
      </div>

      {/* ==========================================
          TABELA DE CHAMADOS
      ========================================== */}
      <div className="card card--table">
        {filtrados.length === 0 ? (
          <div className="empty">
            <strong>Nenhum chamado encontrado</strong>

            <p>Ajuste os filtros ou abra um novo chamado para começar.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Código</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Atualizado</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((c) => {
                const responsavel = usuarioPorId(c.responsavelId);

                return (
                  <tr key={c.id}>
                    <td>
                      <StatusBeacon status={c.status} comLabel={false} />
                    </td>

                    <td>
                      <Link to={`/chamados/${c.id}`} className="table__code">
                        {c.numero}
                      </Link>
                    </td>

                    <td>
                      <Link to={`/chamados/${c.id}`} className="table__title">
                        {c.titulo}
                      </Link>
                    </td>

                    <td className="muted">{c.categoria}</td>

                    <td>
                      <PriorityBadge prioridade={c.prioridade} />
                    </td>

                    <td className="muted">
                      {responsavel ? responsavel.nome : "Não atribuído"}
                    </td>

                    <td className="muted">{tempoRelativo(c.atualizadoEm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ==========================================
          HISTÓRICO
      ========================================== */}
      {/* <div className="profile-history"> */}
        {/* <div className="section-title section-title--compact">
          <span className="section-title__icon">☰</span>

          <h3>Histórico de chamados</h3>
        </div> */}

        {/* ========================================
            LISTA DO HISTÓRICO
        ======================================== */}
        {/* {meusChamados.length === 0 ? (
          <div className="empty empty--light">
            <strong>Você ainda não tem chamados</strong>

            <p>Quando abrir uma solicitação, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="profile-history__list">
            {meusChamados.map((chamado) => (
              <Link
                to={`/chamados/${chamado.id}`}
                key={chamado.id}
                className="profile-history__item"
              >
                <div className="profile-history__status">
                  <StatusBeacon status={chamado.status} comLabel={false} />
                </div>

                <div className="profile-history__meta">
                  <strong>{chamado.numero}</strong>

                  <span>{chamado.titulo}</span>
                </div>

                <div className="profile-history__priority">
                  <PriorityBadge prioridade={chamado.prioridade} />
                </div>

                <div className="profile-history__time">
                  {tempoRelativo(chamado.atualizadoEm)}
                </div>
              </Link>
            ))}
          </div>
        )} */}
      {/* </div> */}
    </div>
  );
}
