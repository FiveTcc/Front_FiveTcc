import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { db } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";
import { formatarData, iniciais, STATUS_LABEL } from "../services/utils";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

export default function ChamadoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [versao, setVersao] = useState(0);
  const chamado = useMemo(() => db.buscarChamado(id), [id, versao]);
  const usuarios = useMemo(() => db.listarUsuarios(), []);
  const [comentario, setComentario] = useState("");

  if (!chamado) return <Navigate to="/chamados" replace />;

  const podeGerenciar =
    usuario.perfil === "admin" || usuario.perfil === "tecnico";
  const solicitante = usuarios.find((u) => u.id === chamado.solicitanteId);
  const responsavel = usuarios.find((u) => u.id === chamado.responsavelId);
  const tecnicos = usuarios.filter(
    (u) => u.perfil === "tecnico" || u.perfil === "admin",
  );

  function atualizar(patch) {
    db.atualizarChamado(chamado.id, patch);
    setVersao((v) => v + 1);
  }

  function enviarComentario(e) {
    e.preventDefault();
    if (!comentario.trim()) return;
    db.adicionarComentario(chamado.id, {
      autorId: usuario.id,
      texto: comentario.trim(),
    });
    setComentario("");
    setVersao((v) => v + 1);
  }

  return (
    <div className="page page--narrow">
      <Link to="/chamados" className="back-link">
        ← Voltar para chamados
      </Link>

      <header className="ticket-header">
        <div>
          <span className="eyebrow">
            {chamado.numero} · {chamado.categoria}
          </span>
          <h1>{chamado.titulo}</h1>
        </div>
        <div className="ticket-header__badges">
          <StatusBeacon status={chamado.status} />
          <PriorityBadge prioridade={chamado.prioridade} />
        </div>
      </header>

      <div className="grid-2 grid-2--asym">
        <div>
          <div className="card">
            <h2>Descrição</h2>
            <p className="ticket-desc">{chamado.descricao}</p>
          </div>

          <div className="card">
            <h2>Histórico</h2>
            <ul className="timeline">
              <li className="timeline__item">
                <span className="timeline__dot" />
                <div>
                  <strong>{solicitante?.nome || "Usuário"}</strong> abriu o
                  chamado
                  <time>{formatarData(chamado.criadoEm)}</time>
                </div>
              </li>
              {chamado.comentarios.map((c, i) => {
                const autor = usuarios.find((u) => u.id === c.autorId);
                return (
                  <li key={i} className="timeline__item">
                    <span className="timeline__dot" />
                    <div>
                      <strong>{autor?.nome || "Usuário"}</strong>
                      <p>{c.texto}</p>
                      <time>{formatarData(c.data)}</time>
                    </div>
                  </li>
                );
              })}
            </ul>

            <form className="comment-form" onSubmit={enviarComentario}>
              <span className="avatar avatar--sm">
                {iniciais(usuario.nome)}
              </span>
              <textarea
                rows={2}
                placeholder="Adicionar um comentário…"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              <button type="submit" className="btn btn--primary btn--sm">
                Enviar
              </button>
            </form>
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Detalhes</h2>
            <dl className="detail-list">
              <div>
                <dt>Solicitante</dt>
                <dd>{solicitante?.nome || "—"}</dd>
              </div>
              <div>
                <dt>Aberto em</dt>
                <dd>{formatarData(chamado.criadoEm)}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{formatarData(chamado.atualizadoEm)}</dd>
              </div>
            </dl>
          </div>

          {podeGerenciar && (
            <div className="card">
              <h2>Gerenciar</h2>
              <label>
                Status
                <select
                  value={chamado.status}
                  onChange={(e) => atualizar({ status: e.target.value })}
                >
                  {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsável
                <select
                  value={chamado.responsavelId || ""}
                  onChange={(e) =>
                    atualizar({ responsavelId: e.target.value || null })
                  }
                >
                  <option value="">Não atribuído</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!podeGerenciar && (
            <div className="card">
              <h2>Responsável</h2>
              <div className="person">
                <span className="avatar avatar--sm">
                  {iniciais(responsavel?.nome)}
                </span>
                <span>
                  {responsavel ? responsavel.nome : "Ainda não atribuído"}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
