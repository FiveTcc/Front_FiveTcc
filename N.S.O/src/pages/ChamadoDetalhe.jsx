import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ocorrenciaService from "../services/ocorrenciaService";
import userService from "../services/userServices";
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
  const dados = resposta?.data?.data ?? resposta?.data ?? resposta;
  const ocorrencia = dados?.ocorrencia || dados?.data?.ocorrencia || dados || {};
  const usuarioCriador =
    dados?.criado_por || dados?.usuario || dados?.user || dados?.criador ||
    ocorrencia.criado_por || ocorrencia.usuario || ocorrencia.user || ocorrencia.criador;

  return {
    ...ocorrencia,
    id: ocorrencia.id_ocor ?? ocorrencia.id,
    numero: ocorrencia.id_ocor ?? ocorrencia.numero,
    titulo: ocorrencia.ocor_nome ?? ocorrencia.titulo,
    status: ocorrencia.ocor_status ?? ocorrencia.status,
    prioridade: ocorrencia.ocor_prioridade ?? ocorrencia.prioridade,
    descricao: ocorrencia.ocor_obs ?? ocorrencia.descricao,
    id_user:
      ocorrencia.id_user ??
      ocorrencia.id_usuario ??
      ocorrencia.user_id ??
      ocorrencia.usuario_id ??
      ocorrencia.ocor_id_user ??
      ocorrencia.ocor_id_usuario ??
      ocorrencia.id_usu ??
      usuarioCriador?.id_user ??
      usuarioCriador?.id_usuario ??
      usuarioCriador?.user_id ??
      usuarioCriador?.id,
    criadoEm: ocorrencia.criado_em ?? ocorrencia.criadoEm,
    atualizadoEm: ocorrencia.atualizado_em ?? ocorrencia.atualizadoEm,
    comentarios: ocorrencia.comentarios || [],
    componente: dados?.componente || dados?.data?.componente,
    ambiente: dados?.ambiente || dados?.data?.ambiente,
    criador: usuarioCriador,
    criadorNome:
      dados?.user_nome ||
      dados?.usuario_nome ||
      dados?.nome_usuario ||
      ocorrencia.user_nome ||
      ocorrencia.usuario_nome ||
      ocorrencia.nome_usuario ||
      (typeof usuarioCriador === "string" ? usuarioCriador : undefined),
  };
}

function nomeCriador(chamado) {
  return (
    chamado.criadorNome ||
    chamado.criador?.nome ||
    chamado.criador?.user_nome ||
    chamado.criador?.usuario_nome ||
    chamado.criador?.nome_usuario ||
    chamado.criador?.name ||
    (chamado.id_user ? `Usuário ${chamado.id_user}` : "Usuário")
  );
}

function nomeUsuario(usuario) {
  return usuario?.nome || usuario?.user_nome || usuario?.usuario_nome || "Usuário";
}

export default function ChamadoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [chamado, setChamado] = useState(null);
  const [nomePerfil, setNomePerfil] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [comentario, setComentario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const nomeLogado = nomePerfil || nomeUsuario(usuario);

  useEffect(() => {
    let montado = true;

    async function carregarPerfil() {
      try {
        const resposta = await userService.buscarperfil();
        const perfil =
          resposta?.data?.usuario ||
          resposta?.data?.user ||
          resposta?.data ||
          resposta?.usuario ||
          resposta?.user ||
          resposta;
        const nome =
          perfil?.nome || perfil?.user_nome || perfil?.usuario_nome || "";
        const foto =
          perfil?.FotoPerfil ||
          perfil?.user_imagem_url ||
          perfil?.user_imagem ||
          perfil?.user_foto ||
          perfil?.foto_perfil ||
          perfil?.foto ||
          "";

        if (montado) {
          if (nome) setNomePerfil(nome);
          if (foto) setFotoPerfil(foto);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuÃ¡rio:", error);
      }
    }

    carregarPerfil();
    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    let montado = true;

    async function carregar() {
      try {
        const resposta = await ocorrenciaService.buscarOcorrenciaPorId(id);
        const chamadoCarregado = normalizarOcorrencia(resposta);
        const idUsuario =
          chamadoCarregado.id_user ??
          chamadoCarregado.id_usuario ??
          chamadoCarregado.user_id ??
          chamadoCarregado.usuarioId ??
          chamadoCarregado.usuario_id ??
          chamadoCarregado.criador?.id_user ??
          chamadoCarregado.criador?.id_usuario ??
          chamadoCarregado.criador?.user_id ??
          chamadoCarregado.criador?.id;

        if (idUsuario && !chamadoCarregado.criadorNome) {
          try {
            const respostaUsuario = await userService.buscarUsuarioPorId(idUsuario);
            const usuarioResposta =
              respostaUsuario?.usuario ||
              respostaUsuario?.user ||
              respostaUsuario?.data?.data?.usuario ||
              respostaUsuario?.data?.data?.user ||
              respostaUsuario?.data?.usuario ||
              respostaUsuario?.data?.user ||
              respostaUsuario?.data ||
              respostaUsuario;
            const usuarioEncontrado = Array.isArray(usuarioResposta)
              ? usuarioResposta[0]
              : usuarioResposta;

            chamadoCarregado.criadorNome =
              usuarioEncontrado?.user_nome ||
              usuarioEncontrado?.usuario_nome ||
              usuarioEncontrado?.nome_usuario ||
              usuarioEncontrado?.name ||
              usuarioEncontrado?.nome;
          } catch (error) {
            console.error("Erro ao buscar usuário criador:", error);
          }
        }

        if (montado) setChamado(chamadoCarregado);
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
            autor: nomeLogado,
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
    return <div className="page"><div className="empty">Carregando ocorrência...</div></div>;
  }

  if (erro && !chamado) {
    return <div className="page"><div className="empty"><strong>{erro}</strong></div></div>;
  }

  if (!chamado) return null;

  const podeGerenciar = ["admin", "tecnico"].includes(usuario?.perfil);

  return (
    <div className="page ticket-detail-page">
      <Link to="/chamados" className="back-link">← Voltar para Ocorrências</Link>

      <header className="page__header ticket-header">
        <div>
          <span className="eyebrow">
            #{chamado.numero} · {chamado.componente?.compo_nome || "Ocorrência"}
          </span>
          <h1>{chamado.titulo}</h1>
          <p className="muted">Detalhes e histórico da ocorrência.</p>
        </div>
        <div className="ticket-header__badges">
          <StatusBeacon status={chamado.status} />
          <PriorityBadge prioridade={chamado.prioridade} />
        </div>
      </header>

      {erro && <p className="form__error">{erro}</p>}

      <div className="card">
            <h2>Observações</h2>
            <p className="ticket-desc">{chamado.descricao || "—"}</p>
          </div>

      <div className="grid-2 grid-2--asym">
        <div className="card">
            <h2>Histórico</h2>
            <div className="ticket-history-scroll">
              <ul className="timeline">
                <li className="timeline__item">
                  <span className="timeline__dot" />
                  <div>
                    <strong>{nomeCriador(chamado)}</strong> abriu a ocorrência
                    <time> {formatarData(chamado.criadoEm)}</time>
                  </div>
                </li>
                {chamado.comentarios.map((item, index) => (
                  <li key={index} className="timeline__item">
                    <span className="timeline__dot" />
                    <div>
                      <strong>{item.autor || nomeLogado}</strong>
                      <p>{item.texto || item.ocor_obs}</p>
                      <time>{formatarData(item.data || item.criado_em)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <form className="comment-form" onSubmit={enviarComentario}>
              {fotoPerfil ? (
                <img
                  className="avatar avatar--sm"
                  src={fotoPerfil}
                  alt={`Foto de ${nomeLogado}`}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="avatar avatar--sm">{iniciais(nomeLogado)}</span>
              )}
              <input
                type="text"
                placeholder="Adicionar uma observação..."
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
              />
              <button type="submit" className="btn btn--primary btn--sm" disabled={salvando}>
                {salvando ? "Enviando..." : "Enviar"}
              </button>
            </form>
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
