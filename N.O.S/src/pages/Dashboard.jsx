import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import dashboardService from "../services/dashboardService";
import userService from "../services/userServices";

import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

const CORES_STATUS = {
  aberta: "#FFBF00",
  "em andamento": "#00A8FF",
  concluida: "#16A870",
  cancelada: "#808080",
};

const STATUS_LABELS = {
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

// Cards de estatística por perfil (campo vem de GET /dashboard)
const CARDS_POR_ESCOPO = {
  administrador: [
    { campo: "ocorrenciasAbertas", rotulo: "Em aberto", dica: "aguardando ação" },
    { campo: "ocorrenciasCriticas", rotulo: "Críticas ativas", dica: "prioridade máxima", alerta: true },
    { campo: "ocorrenciasResolvidas", rotulo: "Resolvidas", dica: "este período" },
    { campo: "ocorrenciasTotal", rotulo: "Total no sistema", dica: "desde o início" },
  ],
  tecnico: [
    { campo: "ocorrenciasAbertas", rotulo: "Em aberto", dica: "atribuídas a você" },
    { campo: "ocorrenciasCriticas", rotulo: "Críticas ativas", dica: "prioridade máxima", alerta: true },
    { campo: "ocorrenciasResolvidas", rotulo: "Resolvidas", dica: "encerradas por você" },
    { campo: "ocorrenciasTotal", rotulo: "Total atribuída", dica: "desde o início" },
  ],
  funcionario: [
    { campo: "ocorrenciasAbertas", rotulo: "Em aberto", dica: "aguardando atendimento" },
    { campo: "ocorrenciasEmAndamento", rotulo: "Em andamento", dica: "sendo atendidas" },
    { campo: "ocorrenciasResolvidas", rotulo: "Resolvidas", dica: "concluídas" },
    { campo: "ocorrenciasTotal", rotulo: "Total abertas por você", dica: "desde o início" },
  ],
};

const TEXTO_SUBTITULO = {
  administrador: "Visão geral das ocorrências sob monitoramento agora.",
  tecnico: "Acompanhe as ocorrências atribuídas a você.",
  funcionario: "Acompanhe as ocorrências que você abriu.",
};

// Perfis que veem o botão "Nova ocorrência" (ajuste conforme a regra do sistema)
const ESCOPOS_COM_NOVA_OCORRENCIA = ["administrador", "funcionario"];

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ");
}

// Aceita tanto array [{ status, total }] quanto objeto { aberta: 3, ... }
function normalizarContagem(porStatus) {
  const base = {
    aberta: 0,
    "em andamento": 0,
    concluida: 0,
    cancelada: 0,
  };

  if (Array.isArray(porStatus)) {
    porStatus.forEach((item) => {
      const status = normalizarTexto(
        item.status ?? item.ocor_status ?? item.ocorre_status,
      );
      const qtd = Number(
        item.total ?? item.quantidade ?? item.qtd ?? item.count ?? 0,
      );
      if (status in base) base[status] += qtd;
    });
  } else if (porStatus && typeof porStatus === "object") {
    Object.entries(porStatus).forEach(([chave, valor]) => {
      const status = normalizarTexto(chave);
      if (status in base) base[status] += Number(valor) || 0;
    });
  }

  return base;
}

// Aceita item aninhado ({ ocorrencia, componente, ambiente }) ou plano
function normalizarOcorrencia(item) {
  const ocorrencia = item?.ocorrencia || item || {};
  const componente = item?.componente || {};
  const ambiente = item?.ambiente || {};

  const id =
    ocorrencia.id_ocor ?? ocorrencia.id_ocorrencia ?? ocorrencia.id;

  return {
    ...item,
    id,
    numero: id ?? ocorrencia.numero,
    titulo:
      ocorrencia.ocor_nome ??
      ocorrencia.ocorre_nome ??
      ocorrencia.nome ??
      ocorrencia.titulo,
    status: normalizarTexto(
      ocorrencia.ocor_status ?? ocorrencia.ocorre_status ?? ocorrencia.status,
    ),
    prioridade: normalizarTexto(
      ocorrencia.ocor_prioridade ??
        ocorrencia.ocorre_prioridade ??
        ocorrencia.prioridade,
    ),
    atualizadoEm:
      ocorrencia.atualizado_em ??
      ocorrencia.atualizadoEm ??
      ocorrencia.criado_em,
    categoria:
      componente.compo_nome ||
      ambiente.amb_nome ||
      ocorrencia.ambiente ||
      ocorrencia.componente ||
      ocorrencia.categoria ||
      "",
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

  const timestamp =
    typeof valor === "number" ? valor : new Date(valor).getTime();
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
    <svg viewBox="0 0 140 140" className="grafico-rosca">
      <circle
        cx="70"
        cy="70"
        r={raio}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth="16"
      />
      {dados.map(([status, qtd]) => {
        if (!qtd || !total) return null;
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
      <text x="70" y="66" textAnchor="middle" className="grafico-rosca__total">
        {total}
      </text>
      <text x="70" y="84" textAnchor="middle" className="grafico-rosca__legenda">
        ocorrências
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);

  const [dadosDashboard, setDadosDashboard] = useState(null);
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener("click", fecharAoClicarFora);
    return () => document.removeEventListener("click", fecharAoClicarFora);
  }, []);

  useEffect(() => {
    async function buscarNome() {
      try {
        const response = await userService.buscarperfil();
        setNome(response.nome || response.user_nome || "");
      } catch (err) {
        console.error(err);
      }
    }

    async function carregar() {
      try {
        setErro("");
        const dados = await dashboardService.buscarDashboard();
        setDadosDashboard(dados);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setErro("Não foi possível carregar o painel.");
      } finally {
        setCarregandoDashboard(false);
      }
    }

    carregar();
    buscarNome();
  }, [usuario]);

  const notificacoes = [];

  // Escopo vem da API: administrador | tecnico | funcionario
  const escopo = dadosDashboard?.escopo ?? "administrador";
  const cards = CARDS_POR_ESCOPO[escopo] ?? CARDS_POR_ESCOPO.administrador;

  const contagem = useMemo(
    () => normalizarContagem(dadosDashboard?.ocorrenciasPorStatus),
    [dadosDashboard],
  );

  const totalDonut = useMemo(
    () => Object.values(contagem).reduce((soma, qtd) => soma + qtd, 0),
    [contagem],
  );

  const atividades = useMemo(
    () => (dadosDashboard?.atividadesRecentes ?? []).map(normalizarOcorrencia),
    [dadosDashboard],
  );

  const recentes = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return atividades
      .filter(
        (c) =>
          !termo ||
          `${c.titulo || ""} ${c.numero || ""} ${c.categoria || ""}`
            .toLowerCase()
            .includes(termo),
      )
      .slice(0, 5);
  }, [atividades, busca]);

  const capitalizar = (texto) => {
    const excecoes = ["da", "de", "do", "das", "dos", "e"];
    return texto
      ?.toLowerCase()
      .split(" ")
      .map((palavra, i) =>
        i > 0 && excecoes.includes(palavra)
          ? palavra
          : palavra.charAt(0).toUpperCase() + palavra.slice(1),
      )
      .join(" ");
  };

  return (
    <div className="pagina pagina--painel">
      <div className="pagina__superior">
        {/* Barra superior */}
        <header className="pagina__cabecalho">
          <div>
            <h1>Olá, {capitalizar(nome || usuario?.nome)} </h1>
            <p className="esmaecido">
              {TEXTO_SUBTITULO[escopo] ?? TEXTO_SUBTITULO.administrador}
            </p>
          </div>
        </header>

        <div className="topbar">
          <div className="topbar__busca">
            <span className="topbar__simbolo" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar ocorrência..."
              aria-label="Pesquisar chamados"
            />
          </div>

          <div className="topbar__acoes">
            <div className="topbar__notificacoes-wrap" ref={notificacoesRef}>
              <button
                type="button"
                className="topbar__simbolo-botao"
                aria-label="Notificações"
                aria-expanded={mostrarNotificacoes}
                onClick={() => setMostrarNotificacoes((valor) => !valor)}
              >
                🕭
              </button>

              {mostrarNotificacoes && (
                <div
                  className="topbar__notificacoes"
                  role="menu"
                  aria-label="Notificações"
                >
                  <div className="topbar__notificacoes-cabecalho">
                    <strong>Notificações</strong>
                    <span>{notificacoes.length}</span>
                  </div>

                  {notificacoes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="topbar__notificacao-item"
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

      {ESCOPOS_COM_NOVA_OCORRENCIA.includes(escopo) && (
        <div className="painel__acoes">
          <Link to="/novochamado" className="botao botao--principal">
            + Nova ocorrência
          </Link>
        </div>
      )}

      {erro && <p className="esmaecido">{erro}</p>}

      {/* Estatísticas */}
      <section className="estatistica-grade">
        {cards.map((card) => (
          <div
            key={card.campo}
            className={`estatistica-card${card.alerta ? " estatistica-card--alerta" : ""}`}
          >
            <span className="estatistica-card__rotulo">{card.rotulo}</span>
            <span className="estatistica-card__valor">
              {carregandoDashboard ? "…" : (dadosDashboard?.[card.campo] ?? 0)}
            </span>
            <span className="estatistica-card__dica">{card.dica}</span>
          </div>
        ))}
      </section>

      {/* Conteúdo principal */}
      <section className="grade-2">
        {/* Distribuição por status */}
        <div className="card__situacao">
          <h2>Distribuição por status</h2>

          <div className="grafico-rosca-linha">
            <Donut dados={Object.entries(contagem)} total={totalDonut} />

            <ul className="grafico-rosca-legenda">
              {Object.entries(contagem).map(([status, qtd]) => (
                <li key={status}>
                  <span
                    className="grafico-rosca-legenda__ponto"
                    style={{
                      backgroundColor: CORES_STATUS[status],
                      "--cor-ponto": CORES_STATUS[status],
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
          <div className="card__cabecalho">
            <h2>Atividade recente</h2>

            <Link to="/ocorrencias" className="link">
              ver todas
            </Link>
          </div>

          <ul className="recente-lista">
            {recentes.map((c) => (
              <li key={c.id}>
                <Link to={`/ocorrencias/${c.id}`} className="recente-item">
                  <StatusBeacon status={c.status} comLabel={false} />

                  <div className="recente-item__corpo">
                    <span className="recente-item__codigo">{c.numero}</span>

                    <span className="recente-item__titulo">{c.titulo}</span>
                  </div>

                  <PriorityBadge prioridade={c.prioridade} />

                  <span className="recente-item__tempo">
                    {mostrarTempoAtualizacao(c.atualizadoEm)}
                  </span>
                </Link>
              </li>
            ))}

            {!recentes.length && (
              <li className="esmaecido">Nenhuma ocorrência encontrada.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}