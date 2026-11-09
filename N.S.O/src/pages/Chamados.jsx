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

// Padroniza textos da API para comparar estados sem diferenças de acento ou caixa.
function normalizarValor(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ");
}

// Converte o formato da API para os campos usados na lista de ocorrências.
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

// Apresenta a data da última atualização no formato brasileiro.
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

  const timestamp =
    typeof valor === "number" ? valor : new Date(valor).getTime();

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

// Lista ocorrências com busca, filtros e acesso às respectivas páginas de detalhe.
export default function Chamados() {
  const [chamados, setChamados] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);
  const [openSelect, setOpenSelect] = useState(null);
  const notificacoes = [];

  // Carrega e normaliza as ocorrências assim que a página é aberta.
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

  // Fecha o painel de notificações quando o usuário clica fora dele.
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
    <div className="pagina pagina--chamados">
      <header className="pagina__cabecalho">
        <div>
          <h1>Ocorrências</h1>
          <p className="atenuado">
            Acompanhe, filtre e priorize as ocorrências abertas.
          </p>
        </div>
      </header>

      <div className="barra-superior">
        <div className="barra-superior__busca">
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar ocorrências..."
            aria-label="Pesquisar ocorrências"
          />
        </div>

        <div className="barra-superior__acoes">
          <div className="barra-superior__notificacoes-wrap" ref={notificacoesRef}>
            <button
              type="button"
              className="barra-superior__icone-botao"
              aria-label="Notificações"
              aria-expanded={mostrarNotificacoes}
              onClick={() => setMostrarNotificacoes((valor) => !valor)}
            >
              🕭
            </button>

            {mostrarNotificacoes && (
              <div
                className="barra-superior__notificacoes"
                role="menu"
                aria-label="Notificações"
              >
                <div className="barra-superior__notificacoes-cabecalho">
                  <strong>Notificações</strong>
                  <span>{notificacoes.length}</span>
                </div>

                {notificacoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="barra-superior__notificacao-item"
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

      <div className="filtros">
        <div className="status-legenda-conteiner">
          <h2 className="status-legenda__titulo">Legenda de status</h2>
          <ul className="status-legenda" aria-label="Legenda de status">
            {STATUS_LEGEND.map(([value, label]) => (
              <li key={value} className="status-legenda__item">
                <StatusBeacon status={value} comLabel={false} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="selecao-personalizada">
          <span className="selecao-personalizada__rotulo">Status</span>
          <button
            type="button"
            className={`selecao-personalizada__acionador ${openSelect === "status" ? "esta-aberto" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openSelect === "status"}
            onClick={() =>
              setOpenSelect((current) =>
                current === "status" ? null : "status",
              )
            }
          >
            <span>{STATUS_LABELS[filtroStatus]}</span>
            <span className="selecao-personalizada__seta">▾</span>
          </button>
          {openSelect === "status" && (
            <div
              className="selecao-personalizada__menu"
              role="listbox"
              aria-label="Filtrar por status"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={filtroStatus === value}
                  className={`selecao-personalizada__opcao ${filtroStatus === value ? "esta-selecionado" : ""}`}
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

        <div className="selecao-personalizada">
          <span className="selecao-personalizada__rotulo">Prioridade</span>
          <button
            type="button"
            className={`selecao-personalizada__acionador ${openSelect === "prioridade" ? "esta-aberto" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={openSelect === "prioridade"}
            onClick={() =>
              setOpenSelect((current) =>
                current === "prioridade" ? null : "prioridade",
              )
            }
          >
            <span>{PRIORIDADE_LABELS[filtroPrioridade]}</span>
            <span className="selecao-personalizada__seta">▾</span>
          </button>
          {openSelect === "prioridade" && (
            <div
              className="selecao-personalizada__menu"
              role="listbox"
              aria-label="Filtrar por status"
            >
              {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={filtroPrioridade === value}
                  className={`selecao-personalizada__opcao ${filtroPrioridade === value ? "esta-selecionado" : ""}`}
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

        <Link to="/chamados/novo" className="botao botao--principal">
          + Nova ocorrência
        </Link>
      </div>

      <div className="cartao__chamados cartao--tabela">
        {carregando ? (
          <div className="vazio">Carregando ocorrências...</div>
        ) : erro ? (
          <div className="vazio">
            <strong>{erro}</strong>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="vazio">
            <strong>Nenhuma ocorrência encontrada</strong>
          </div>
        ) : (
          <table className="tabela">
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
                    <StatusBeacon status={ocorrencia.status} comLabel={false} />{" "}
                    <span className="indicador__rotulo">
                      {STATUS_LABELS[ocorrencia.status] ||
                        ocorrencia.status ||
                        "—"}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/chamados/${ocorrencia.id}`}
                      className="tabela__codigo"
                    >
                      {ocorrencia.numero || ocorrencia.id}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/chamados/${ocorrencia.id}`}
                      className="tabela__titulo"
                    >
                      {ocorrencia.titulo || ocorrencia.nome}
                    </Link>
                  </td>
                  <td className="atenuado">{ocorrencia.categoria || "—"}</td>
                  <td>
                    <PriorityBadge prioridade={ocorrencia.prioridade} />
                  </td>
                  <td className="atenuado">
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
