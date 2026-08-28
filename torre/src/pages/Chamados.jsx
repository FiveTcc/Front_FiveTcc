import { useEffect, useMemo, useState } from "react";
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

  const todos = useMemo(() => db.listarChamados(), []);
  const usuarios = useMemo(() => db.listarUsuarios(), []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {
      // Ignora erros de localStorage
    }
  }, [theme]);

  // CHAMADOS DO USUÁRIO LOGADO
  const meusChamados = useMemo(() => {
    if (!usuario) return [];

    return todos.filter(
      (chamado) =>
        chamado.usuarioId === usuario.id ||
        chamado.solicitanteId === usuario.id ||
        chamado.criadoPorId === usuario.id
    );
  }, [todos, usuario]);

  // RESUMO DOS CHAMADOS
  const total = meusChamados.length;

  const abertos = meusChamados.filter(
    (chamado) => chamado.status === "aberto"
  ).length;

  const andamento = meusChamados.filter(
    (chamado) => chamado.status === "em_andamento"
  ).length;

  const concluidos = meusChamados.filter(
    (chamado) =>
      chamado.status === "resolvido" ||
      chamado.status === "fechado"
  ).length;

  
  // ÚLTIMO CHAMADO
  const ultimoChamado = useMemo(() => {
    if (meusChamados.length === 0) return null;

    return [...meusChamados].sort(
      (a, b) =>
        new Date(b.atualizadoEm) - new Date(a.atualizadoEm)
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

      const statusOk =
        filtroStatus === "todos" ||
        c.status === filtroStatus;

      const prioridadeOk =
        filtroPrioridade === "todas" ||
        c.prioridade === filtroPrioridade;

      return buscaOk && statusOk && prioridadeOk;
    });
  }, [
    todos,
    busca,
    filtroStatus,
    filtroPrioridade,
  ]);

  return (
    <div className="page">

      {/* ==========================================
          TOPBAR
      ========================================== */}
      <div className="topbar">

        <div className="topbar__search">
          <span
            className="topbar__icon"
            aria-hidden="true"
          >
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
              theme === "dark"
                ? "Ativar tema claro"
                : "Ativar tema escuro"
            }
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "dark"
                  ? "light"
                  : "dark"
              )
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

        </div>
      </div>

      {/* ==========================================
          CABEÇALHO
      ========================================== */}
      <header className="page__header">

        <div>
          <span className="eyebrow">
            {filtrados.length} de {todos.length}
          </span>

          <h1>Chamados</h1>

          <p className="muted">
            Acompanhe, filtre e priorize as solicitações abertas.
          </p>
        </div>

        <Link
          to="/chamados/novo"
          className="btn btn--primary"
        >
          + Novo chamado
        </Link>

      </header>

      {/* ==========================================
          FILTROS
      ========================================== */}
      <div className="filters">

        {/* <input
          type="search"
          placeholder="Buscar por título, código ou categoria…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="filters__search"
        /> */}

        <select
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(e.target.value)
          }
        >
          <option value="todos">
            Todos os status
          </option>

          <option value="aberto">
            Aberto
          </option>

          <option value="em_andamento">
            Em andamento
          </option>

          <option value="aguardando">
            Aguardando
          </option>

          <option value="resolvido">
            Resolvido
          </option>

          <option value="fechado">
            Fechado
          </option>
        </select>

        <select
          value={filtroPrioridade}
          onChange={(e) =>
            setFiltroPrioridade(e.target.value)
          }
        >
          <option value="todas">
            Todas as prioridades
          </option>

          <option value="critica">
            Crítica
          </option>

          <option value="alta">
            Alta
          </option>

          <option value="media">
            Média
          </option>

          <option value="baixa">
            Baixa
          </option>
        </select>

      </div>

      {/* ==========================================
          TABELA DE CHAMADOS
      ========================================== */}
      <div className="card card--table">

        {filtrados.length === 0 ? (

          <div className="empty">
            <strong>
              Nenhum chamado encontrado
            </strong>

            <p>
              Ajuste os filtros ou abra um novo chamado
              para começar.
            </p>
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

                const responsavel =
                  usuarioPorId(c.responsavelId);

                return (
                  <tr key={c.id}>

                    <td>
                      <StatusBeacon
                        status={c.status}
                        comLabel={false}
                      />
                    </td>

                    <td>
                      <Link
                        to={`/chamados/${c.id}`}
                        className="table__code"
                      >
                        {c.numero}
                      </Link>
                    </td>

                    <td>
                      <Link
                        to={`/chamados/${c.id}`}
                        className="table__title"
                      >
                        {c.titulo}
                      </Link>
                    </td>

                    <td className="muted">
                      {c.categoria}
                    </td>

                    <td>
                      <PriorityBadge
                        prioridade={c.prioridade}
                      />
                    </td>

                    <td className="muted">
                      {responsavel
                        ? responsavel.nome
                        : "Não atribuído"}
                    </td>

                    <td className="muted">
                      {tempoRelativo(c.atualizadoEm)}
                    </td>

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
      <div className="profile-history">

        <div className="section-title section-title--compact">

          <span className="section-title__icon">
            ☰
          </span>

          <h3>
            Histórico de chamados
          </h3>

        </div>


        {/* ========================================
            LISTA DO HISTÓRICO
        ======================================== */}
        {meusChamados.length === 0 ? (

          <div className="empty empty--light">

            <strong>
              Você ainda não tem chamados
            </strong>

            <p>
              Quando abrir uma solicitação,
              ela aparecerá aqui.
            </p>

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

                  <StatusBeacon
                    status={chamado.status}
                    comLabel={false}
                  />

                </div>

                <div className="profile-history__meta">

                  <strong>
                    {chamado.numero}
                  </strong>

                  <span>
                    {chamado.titulo}
                  </span>

                </div>

                <div className="profile-history__priority">

                  <PriorityBadge
                    prioridade={chamado.prioridade}
                  />

                </div>

                <div className="profile-history__time">

                  {tempoRelativo(
                    chamado.atualizadoEm
                  )}

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}
