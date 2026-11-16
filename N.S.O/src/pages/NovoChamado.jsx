
import { useEffect, useRef, useState } from "react";
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
  const categoriaRef = useRef(null);
  const prioridadeRef = useRef(null);

  useEffect(() => {
    if (!openSelect) return;

    const activeSelectRef =
      openSelect === "categoria" ? categoriaRef : prioridadeRef;
    const closeOnOutsidePointerDown = (event) => {
      if (
        activeSelectRef.current &&
        !activeSelectRef.current.contains(event.target)
      ) {
        setOpenSelect(null);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [openSelect]);

  const categorias = [
    "Hardware",
    "Software",
    "Rede",
    "Acesso e Permissões",
    "Outros",
  ];

  const prioridades = [
    "Selecione",
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
    <div className="pagina pagina--estreita">

      <header className="pagina__cabecalho">
        <div>
          <span className="rotulo-superior">Abertura</span>
          <h1>Novo chamado</h1>

          <p className="esmaecido">
            Descreva o problema com o máximo de detalhe
            possível para agilizar o atendimento.
          </p>
        </div>
      </header>

      <form
        className="card__novochamado formulario"
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
        <div className="formulario__linha">

          <div className="personalizado-selecao" ref={categoriaRef}>
            <span className="personalizado-selecao__rotulo">
              Categoria
            </span>

            <button
              type="button"
              className={`personalizado-selecao__acionador ${
                openSelect === "categoria" ? "esta-aberto" : ""
              }`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "categoria" ? null : "categoria"
                )
              }
            >
              <span>{categoria}</span>
              <span className="personalizado-selecao__seta">▾</span>
            </button>

            {openSelect === "categoria" && (
              <div
                className="personalizado-selecao__menu"
                role="listbox"
                aria-label="Categoria"
              >
                {categorias.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`personalizado-selecao__opcao ${
                      categoria === option ? "esta-selecionado" : ""
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

          <div className="personalizado-selecao" ref={prioridadeRef}>
            <span className="personalizado-selecao__rotulo">
              Prioridade
            </span>

            <button
              type="button"
              className={`personalizado-selecao__acionador ${
                openSelect === "prioridade" ? "esta-aberto" : ""
              }`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "prioridade" ? null : "prioridade"
                )
              }
            >
              <span>{prioridade}</span>
              <span className="personalizado-selecao__seta">▾</span>
            </button>

            {openSelect === "prioridade" && (
              <div
                className="personalizado-selecao__menu"
                role="listbox"
                aria-label="Prioridade"
              >
                {prioridades.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`personalizado-selecao__opcao ${
                      prioridade === option ? "esta-selecionado" : ""
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
        <div className="formulario__linha">

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
        <label className="formulario__descricao">
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
        <div className="formulario__acoes">

          <button
            type="button"
            className="botao botao--cancelar"
            onClick={() => navigate(-1)}
            disabled={enviando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="botao botao--principal"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar chamado"}
          </button>

        </div>

      </form>
    </div>
  );
}
