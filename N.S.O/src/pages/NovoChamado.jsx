import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Apresenta o formulário para registrar uma nova ocorrência.
export default function NovoChamado() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [micro, setMicro] = useState("");
  const [descricao, setDescricao] = useState("");
  const categorias = ["Hardware", "Software", "Rede", "Acesso e Permissões", "Outros"];
  const prioridades = ["Baixa", "Média", "Alta", "Crítica"];
  const [categoria, setCategoria] = useState(categorias[0]);
  const [local, setLocal] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [prioridade, setPrioridade] = useState("Selecione");
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

  // Valida os campos obrigatórios antes de iniciar o envio do formulário.
  function handleSubmit(e) {
    e.preventDefault();
    if (!micro.trim() || !descricao.trim()) return;
    setEnviando(true);
    setEnviando(false);
    window.alert("Conecte esta tela à API para enviar um chamado.");
  }

  return (
    <div className="pagina pagina--estreito">
      <header className="pagina__cabecalho">
        <div>
          <span className="rotulo-superior">Abertura</span>
          <h1>Novo chamado</h1>
          <p className="atenuado">
            Descreva o problema com o máximo de detalhe possível para agilizar o
            atendimento.
          </p>
        </div>
      </header>

      <form className="cartao__novochamado formulario" onSubmit={handleSubmit}>
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

        <div className="formulario__linha">
          <div className="selecao-personalizada">
            <span className="selecao-personalizada__rotulo">Categoria</span>
            <button
              type="button"
              className={`selecao-personalizada__acionador ${openSelect === "categoria" ? "esta-aberto" : ""}`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "categoria" ? null : "categoria",
                )
              }
            >
              <span>{categoria}</span>
              <span className="selecao-personalizada__seta">▾</span>
            </button>
            {openSelect === "categoria" && (
              <div className="selecao-personalizada__menu" role="listbox" aria-label="Categoria">
                {categorias.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`selecao-personalizada__opcao ${categoria === option ? "esta-selecionado" : ""}`}
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

          <div className="selecao-personalizada">
            <span className="selecao-personalizada__rotulo">Prioridade</span>
            <button
              type="button"
              className={`selecao-personalizada__acionador ${openSelect === "prioridade" ? "esta-aberto" : ""}`}
              onClick={() =>
                setOpenSelect((current) =>
                  current === "prioridade" ? null : "prioridade",
                )
              }
            >
              <span>{prioridade}</span>
              <span className="selecao-personalizada__seta">▾</span>
            </button>
            {openSelect === "prioridade" && (
              <div className="selecao-personalizada__menu" role="listbox" aria-label="Prioridade">
                {prioridades.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`selecao-personalizada__opcao ${prioridade === option ? "esta-selecionado" : ""}`}
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

          <label>
            Local
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex.: Sala 12, Bloco B"
            />
          </label>

          <label>
            Data da ocorrência
            <input
              type="date"
              value={dataOcorrencia}
              onChange={(e) => setDataOcorrencia(e.target.value)}
            />
          </label>
        </div>

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

        <div className="formulario__anexos">
          <span>Anexos</span>
          <div className="formulario__anexo-acoes">
            <label className="botao botao--vazado formulario__arquivo-botao">
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
            <p className="formulario__anexos-lista">
              {[foto, ...arquivos]
                .filter(Boolean)
                .map((arquivo) => arquivo.name)
                .join(", ")}
            </p>
          )}
        </div>

        <div className="formulario__acoes">
          <button type="button" className="botao botao--cancelar" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="botao botao--principal" disabled={enviando}>
            Enviar chamado
          </button>
        </div>
      </form>
    </div>
  );
}
