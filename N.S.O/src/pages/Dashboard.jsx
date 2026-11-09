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

// Uniformiza o status recebido da API para relacioná-lo aos rótulos e cores.
function normalizarStatus(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ");
}

// Adapta uma ocorrência da API aos campos consumidos pelo painel.
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

// Formata a hora da última atualização para exibição no painel.
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

// Desenha o gráfico de rosca proporcional à quantidade de ocorrências por status.
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
      <text x="70" y="66" textAnchor="middle" className="grafico-rosca__total">
        {total}
      </text>
      <text x="70" y="84" textAnchor="middle" className="grafico-rosca__legenda">
        chamados
      </text>
    </svg>
  );
}

// Reúne os indicadores, gráficos e ocorrências recentes do sistema.
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

  // Carrega o nome do usuário, os indicadores e a lista de ocorrências.
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
    <div className="pagina pagina--painel">
      <div className="pagina__superior">
        {/* Barra superior */}
        <header className="pagina__cabecalho">
          <div>
            <h1>Olá, {(nome || usuario.nome)?.toLowerCase()} </h1>
            <p className="atenuado">
              Visão geral dos chamados sob monitoramento agora.
            </p>
          </div>
        </header>

        <div className="barra-superior">
          <div className="barra-superior__busca">
            <span className="barra-superior__icone" aria-hidden="true">
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

          <div className="barra-superior__acoes">
            <div className="barra-superior__notificacoes-wrap">
              <button
                type="button"
                className="barra-superior__icone-botao"
                aria-label="Notificações"
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
      </div>

      <div className="painel__acoes">
        <Link to="/chamados/novo" className="botao botao--principal">
          + Novo chamado
        </Link>
      </div>

      {/* Estatísticas */}
      <section className="indicador-grade">
        <div className="indicador-cartao">
          <span className="indicador-cartao__rotulo">Em aberto</span>
          <span className="indicador-cartao__valor">
            {dadosDashboard?.ocorrenciasAbertas ?? 0}
          </span>
          <span className="indicador-cartao__dica">aguardando ação</span>
        </div>

        <div className="indicador-cartao indicador-cartao--alerta">
          <span className="indicador-cartao__rotulo">Críticos ativos</span>
          <span className="indicador-cartao__valor">
            {dadosDashboard?.ocorrenciasCriticas ?? 0}
          </span>
          <span className="indicador-cartao__dica">prioridade máxima</span>
        </div>

        <div className="indicador-cartao">
          <span className="indicador-cartao__rotulo">Resolvidos</span>
          <span className="indicador-cartao__valor">
            {dadosDashboard?.ocorrenciasResolvidas ?? 0}
          </span>
          <span className="indicador-cartao__dica">este período</span>
        </div>

        <div className="indicador-cartao">
          <span className="indicador-cartao__rotulo">Total no sistema</span>
          <span className="indicador-cartao__valor">
            {dadosDashboard?.ocorrenciasTotal ?? 0}
          </span>
          <span className="indicador-cartao__dica">desde o início</span>
        </div>
      </section>

      {/* Conteúdo principal */}
      <section className="grade-2">
        {/* Distribuição por status */}
        <div className="cartao__status">
          <h2>Distribuição por status</h2>

          <div className="grafico-rosca-linha">
            <Donut
              dados={Object.entries(contagem)}
              total={chamados.length || 0}
            />

            <ul className="grafico-rosca-legenda">
              {Object.entries(contagem).map(([status, qtd]) => (
                <li key={status}>
                  <span
                    className="grafico-rosca-legenda__ponto"
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
        <div className="cartao__atividade">
          <div className="cartao__cabecalho">
            <h2>Atividade recente</h2>

            <Link to="/chamados" className="ligacao">
              ver todos
            </Link>
          </div>

          <ul className="recente-lista">
            {recentes.map((c) => (
              <li key={c.id}>
                <Link to={`/chamados/${c.id}`} className="recente-item">
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
              <li className="atenuado">Nenhum chamado encontrado.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
