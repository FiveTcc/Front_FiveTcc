
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ocorrenciaService from "../services/ocorrenciaService";

export default function NovoChamado() {
  const navigate = useNavigate();

  // Dados da ocorrência
  const [micro, setMicro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Hardware");
  const [prioridade, setPrioridade] = useState("Selecione");

  // Relacionamentos com o banco
  const [componenteId, setComponenteId] = useState("");
  const [ambienteId, setAmbienteId] = useState("");

  // Controle da tela
  const [enviando, setEnviando] = useState(false);
  const [openSelect, setOpenSelect] = useState(null);

  const categorias = [
    "Hardware",
    "Software",
    "Rede",
    "Acesso e Permissões",
    "Outros",
  ];

  const prioridades = [
    "Baixa",
    "Média",
    "Alta",
    "Crítica",
  ];

  // Converter valores para o padrão da API
  function normalizar(valor) {
    return valor
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");
  }

  // Enviar formulário
  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !micro.trim() ||
      !descricao.trim() ||
      !componenteId ||
      !ambienteId ||
      prioridade === "Selecione"
    ) {
      window.alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setEnviando(true);

      const dados = {
        ocor_nome: micro.trim(),
        ocor_tipo: normalizar(categoria),
        ocor_prioridade: normalizar(prioridade),
        ocor_obs: descricao.trim(),
        componente_id: Number(componenteId),
        ambiente_id: Number(ambienteId),
      };

      console.log("Dados enviados:", dados);

      const response =
        await ocorrenciaService.abrirOcorrencia(dados);

      console.log("Ocorrência criada:", response);

      window.alert("Chamado criado com sucesso!");

      navigate("/chamados");

    } catch (error) {
      console.error("Erro ao criar chamado:", error);

      window.alert(
        error.response?.data?.message ||
        "Não foi possível criar o chamado."
      );

    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="page page--narrow">

      <header className="page__header">
        <div>
          <span className="eyebrow">Abertura</span>
          <h1>Novo chamado</h1>

          <p className="muted">
            Descreva o problema com o máximo de detalhe
            possível para agilizar o atendimento.
          </p>
        </div>
      </header>

      <form
        className="card__novochamado form"
        onSubmit={handleSubmit}
      >

        {/* Nome da ocorrência */}
        <label>
          Micro / Equipamento

          <input
            type="text"
            value={micro}
            onChange={(e) => setMicro(e.target.value)}
            placeholder="Ex.: PC-08 / Micro 12"
            required
          />
        </label>

        {/* Categoria e prioridade */}
        <div className="form__row">

          <div className="custom-select">
            <span className="custom-select__label">
              Categoria
            </span>

            <button
              type="button"
              className={`custom-select__trigger ${
                openSelect === "categoria" ? "is-open" : ""
              }`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "categoria" ? null : "categoria"
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
                {categorias.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`custom-select__option ${
                      categoria === option ? "is-selected" : ""
                    }`}
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

          <div className="custom-select">
            <span className="custom-select__label">
              Prioridade
            </span>

            <button
              type="button"
              className={`custom-select__trigger ${
                openSelect === "prioridade" ? "is-open" : ""
              }`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "prioridade" ? null : "prioridade"
                )
              }
            >
              <span>{prioridade}</span>
              <span className="custom-select__caret">▾</span>
            </button>

            {openSelect === "prioridade" && (
              <div
                className="custom-select__menu"
                role="listbox"
                aria-label="Prioridade"
              >
                {prioridades.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`custom-select__option ${
                      prioridade === option ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      setPrioridade(option);
                      setOpenSelect(null);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* IDs do banco */}
        <div className="form__row">

          <label>
            ID do componente

            <input
              type="number"
              min="1"
              value={componenteId}
              onChange={(e) => setComponenteId(e.target.value)}
              placeholder="Ex.: 6"
              required
            />
          </label>

          <label>
            ID do ambiente

            <input
              type="number"
              min="1"
              value={ambienteId}
              onChange={(e) => setAmbienteId(e.target.value)}
              placeholder="Ex.: 1"
              required
            />
          </label>

        </div>

        {/* Descrição */}
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

        {/* Ações */}
        <div className="form__actions">

          <button
            type="button"
            className="btn btn--cancelar"
            onClick={() => navigate(-1)}
            disabled={enviando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar chamado"}
          </button>

        </div>

      </form>
    </div>
  );
}
