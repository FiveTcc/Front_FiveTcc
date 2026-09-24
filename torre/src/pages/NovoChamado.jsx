import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";

export default function NovoChamado() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [micro, setMicro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(db.CATEGORIAS[0]);
  const [local, setLocal] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [foto, setFoto] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [openSelect, setOpenSelect] = useState(null);

  const prioridadeLabels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    critica: "Crítica",
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!micro.trim() || !descricao.trim()) return;
    setEnviando(true);
    const criado = db.criarChamado({
      titulo: `Chamado de TI - ${categoria}`,
      descricao: descricao.trim(),
      categoria,
      prioridade,
      solicitanteId: usuario.id,
      micro: micro.trim(),
      local: local.trim(),
      dataOcorrencia: dataOcorrencia.trim(),
      anexos: [foto, ...arquivos].filter(Boolean).map((arquivo) => ({
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
      })),
    });
    navigate(`/chamados/${criado.id}`);
  }

  return (
    <div className="page page--narrow">
      <header className="page__header">
        <div>
          <span className="eyebrow">Abertura</span>
          <h1>Novo chamado</h1>
          <p className="muted">
            Descreva o problema com o máximo de detalhe possível para agilizar o
            atendimento.
          </p>
        </div>
      </header>

      <form className="card__novochamado form" onSubmit={handleSubmit}>
        <label>
          Micro
          <input
            type="text"
            value={micro}
            onChange={(e) => setMicro(e.target.value)}
            placeholder="Ex.: PC-08 / Micro 12"
            required
          />
        </label>

        <div className="form__row">
          <div className="custom-select">
            <span className="custom-select__label">Categoria</span>
            <button
              type="button"
              className={`custom-select__trigger ${openSelect === "categoria" ? "is-open" : ""}`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "categoria" ? null : "categoria",
                )
              }
            >
              <span>{categoria}</span>
              <span className="custom-select__caret">▾</span>
            </button>
            {openSelect === "categoria" && (
              <div
                className="custom-select__menu"
                role="listbox"
                aria-label="Categoria"
              >
                {db.CATEGORIAS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`custom-select__option ${categoria === option ? "is-selected" : ""}`}
                    onClick={() => {
                      setCategoria(option);
                      setOpenSelect(null);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label>
            Local
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex.: Sala 12, Bloco B"
            />
          </label>
        </div>

        <label>
          Data da ocorrência
          <input
            type="date"
            value={dataOcorrencia}
            onChange={(e) => setDataOcorrencia(e.target.value)}
          />
        </label>

        <label className="form__description">
          Descrição
          <textarea
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhe o problema, mensagens de erro, quando começou..."
            required
          />
        </label>

        <div className="form__attachments">
          <span>Anexos</span>
          <div className="form__attachment-actions">
            <label className="btn btn--ghost form__file-button">
              Enviar imagens
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setArquivos(Array.from(e.target.files || []))}
              />
            </label>
          </div>
          {(foto || arquivos.length > 0) && (
            <p className="form__attachments-list">
              {[foto, ...arquivos]
                .filter(Boolean)
                .map((arquivo) => arquivo.name)
                .join(", ")}
            </p>
          )}
        </div>

        <div className="form__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={enviando}
          >
            Enviar chamado
          </button>
        </div>
      </form>
    </div>
  );
}
