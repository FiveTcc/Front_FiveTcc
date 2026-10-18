import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ocorrenciaService from "../services/ocorrenciaService";
import { formatarData, iniciais } from "../services/utils";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

const STATUS_LABEL = {
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function normalizarOcorrencia(resposta) {
  const ocorrencia = resposta?.ocorrencia || resposta || {};

  return {
    ...ocorrencia,
    id: ocorrencia.id_ocor ?? ocorrencia.id,
    numero: ocorrencia.id_ocor ?? ocorrencia.numero,
    titulo: ocorrencia.ocor_nome ?? ocorrencia.titulo,
    status: ocorrencia.ocor_status ?? ocorrencia.status,
    prioridade: ocorrencia.ocor_prioridade ?? ocorrencia.prioridade,
    descricao: ocorrencia.ocor_obs ?? ocorrencia.descricao,
    criadoEm: ocorrencia.criado_em ?? ocorrencia.criadoEm,
    atualizadoEm: ocorrencia.atualizado_em ?? ocorrencia.atualizadoEm,
    comentarios: ocorrencia.comentarios || [],
    componente: resposta?.componente,
    ambiente: resposta?.ambiente,
    criador:
      resposta?.usuario ||
      resposta?.user ||
      resposta?.criador ||
      ocorrencia.usuario ||
      ocorrencia.user ||
      ocorrencia.criador,
    criadorNome:
      resposta?.user_nome ||
      resposta?.usuario_nome ||
      ocorrencia.user_nome ||
      ocorrencia.usuario_nome,
  };
}

function nomeCriador(chamado) {
  return (
    chamado.criadorNome ||
    chamado.criador?.nome ||
    chamado.criador?.user_nome ||
    chamado.criador?.usuario_nome ||
    (chamado.id_user ? `Usuário ${chamado.id_user}` : "Usuário")
  );
}

export default function ChamadoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [chamado, setChamado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let montado = true;

    async function carregar() {
      try {
        const resposta = await ocorrenciaService.buscarOcorrenciaPorId(id);
        if (montado) setChamado(normalizarOcorrencia(resposta));
      } catch (error) {
        if (montado) {
          setErro("Não foi possível carregar a ocorrência.");
          console.error("Erro ao carregar ocorrência:", error);
        }
      } finally {
        if (montado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      montado = false;
    };
  }, [id]);

  async function atualizarStatus(novoStatus) {
    try {
      await ocorrenciaService.alterarStatus(chamado.id, novoStatus);
      setChamado((atual) => ({ ...atual, status: novoStatus }));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Não foi possível atualizar o status.");
    }
  }

  async function enviarComentario(event) {
    event.preventDefault();
    if (!comentario.trim()) return;

    setSalvando(true);
    try {
      await ocorrenciaService.adicionarObservacao(chamado.id, comentario.trim());
      setChamado((atual) => ({
        ...atual,
        comentarios: [
          ...atual.comentarios,
          {
            texto: comentario.trim(),
            data: new Date().toISOString(),
            autor: usuario?.nome || "Usuário",
          },
        ],
      }));
      setComentario("");
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      setErro("Não foi possível adicionar a observação.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="page page--narrow"><div className="empty">Carregando ocorrência...</div></div>;
  }

  if (erro && !chamado) {
    return <div className="page page--narrow"><div className="empty"><strong>{erro}</strong></div></div>;
  }

  if (!chamado) return null;

  const podeGerenciar = ["admin", "tecnico"].includes(usuario?.perfil);

  return (
    <div className="page page--narrow ticket-detail-page">
      <Link to="/chamados" className="back-link">← Voltar para chamados</Link>

      <header className="ticket-header">
        <div>
          <span className="eyebrow">
            #{chamado.numero} · {chamado.componente?.compo_nome || "Ocorrência"}
          </span>
          <h1>{chamado.titulo}</h1>
        </div>
        <div className="ticket-header__badges">
          <StatusBeacon status={chamado.status} />
          <PriorityBadge prioridade={chamado.prioridade} />
        </div>
      </header>

      {erro && <p className="form__error">{erro}</p>}

      <div className="grid-2 grid-2--asym">
        <div>
          <div className="card">
            <h2>Descrição</h2>
            <p className="ticket-desc">{chamado.descricao || "—"}</p>
          </div>

          <div className="card">
            <h2>Histórico</h2>
            <ul className="timeline">
              <li className="timeline__item">
                <span className="timeline__dot" />
                <div>
                  <strong>{usuario?.nome || "Usuário"}</strong> abriu a ocorrência
                  <time> {formatarData(chamado.criadoEm)}</time>
                </div>
              </li>
              {chamado.comentarios.map((item, index) => (
                <li key={index} className="timeline__item">
                  <span className="timeline__dot" />
                  <div>
                    <strong>{item.autor || usuario?.nome || "Usuário"}</strong>
                    <p>{item.texto || item.ocor_obs}</p>
                    <time>{formatarData(item.data || item.criado_em)}</time>
                  </div>
                </li>
              ))}
            </ul>

            <form className="comment-form" onSubmit={enviarComentario}>
              <span className="avatar avatar--sm">{iniciais(usuario?.nome)}</span>
              <textarea
                rows={2}
                placeholder="Adicionar uma observação..."
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
              />
              <button type="submit" className="btn btn--primary btn--sm" disabled={salvando}>
                {salvando ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Detalhes</h2>
            <dl className="detail-list">
              <div><dt>Criado por</dt><dd>{nomeCriador(chamado)}</dd></div>
              <div><dt>Componente</dt><dd>{chamado.componente?.compo_nome || "—"}</dd></div>
              <div><dt>Ambiente</dt><dd>{chamado.ambiente?.amb_nome || "—"}</dd></div>
              <div><dt>Aberto em</dt><dd>{formatarData(chamado.criadoEm)}</dd></div>
              <div><dt>Última atualização</dt><dd>{formatarData(chamado.atualizadoEm)}</dd></div>
            </dl>
          </div>

          {podeGerenciar && (
            <div className="card">
              <h2>Gerenciar</h2>
              <label>
                Status
                <select value={chamado.status} onChange={(event) => atualizarStatus(event.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>{rotulo}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
