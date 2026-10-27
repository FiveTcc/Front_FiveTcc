import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Pencil, Plus, Save, X } from "lucide-react";
import ambienteService from "../services/ambienteService";
import componenteService from "../services/componeteService";
import componenteTipoService from "../services/componenteTipoService";

function listaDe(resposta, chaves = []) {
  const candidatos = [
    resposta,
    resposta?.data,
    resposta?.data?.data,
    resposta?.resultado,
    resposta?.result,
    resposta?.payload,
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) return candidato;

    if (candidato && typeof candidato === "object") {
      for (const chave of chaves) {
        const valor = candidato[chave];
        if (Array.isArray(valor)) return valor;
        if (valor && typeof valor === "object") {
          const nested = Array.isArray(valor.data)
            ? valor.data
            : Array.isArray(valor.result)
              ? valor.result
              : Array.isArray(valor.items)
                ? valor.items
                : Array.isArray(valor.ambientes)
                  ? valor.ambientes
                  : Array.isArray(valor.componente)
                    ? valor.componente
                    : Array.isArray(valor.componentes)
                      ? valor.componentes
                      : null;

          if (nested) return nested;
          return [valor];
        }
      }

      const primeiroArray = Object.values(candidato).find((valor) => Array.isArray(valor));
      if (primeiroArray) return primeiroArray;
    }
  }

  return [];
}

function textoOuPadrao(valor, padrao = "—") {
  if (valor === null || valor === undefined || valor === "") return padrao;
  return String(valor);
}

function statusParaTexto(valor) {
  const texto = textoOuPadrao(valor, "ativo").toLowerCase();
  return ["inativo", "false", "0", "desativado", "disabled"].includes(texto) ? "Inativo" : "Ativo";
}

function normalizarAmbiente(item) {
  const ambiente = item?.ambiente || item || {};
  const status = ambiente.amb_status ?? ambiente.status ?? ambiente.ativo ?? ambiente.amb_ativo ?? "ativo";

  return {
    ...ambiente,
    id: ambiente.id_amb ?? ambiente.amb_id ?? ambiente.id,
    nome: textoOuPadrao(ambiente.amb_nome ?? ambiente.nome, "Ambiente"),
    tipo: textoOuPadrao(ambiente.amb_tipo ?? ambiente.tipo, "Outro"),
    bloco: textoOuPadrao(ambiente.amb_bloco ?? ambiente.bloco, "—"),
    andar: Number(ambiente.amb_andar ?? ambiente.andar ?? 0),
    descricao: textoOuPadrao(ambiente.amb_descricao ?? ambiente.descricao, "Nenhuma descrição informada."),
    status: typeof status === "boolean" ? (status ? "ativo" : "inativo") : String(status).toLowerCase(),
  };
}

function pegarValorPorChaves(objeto, chaves) {
  for (const chave of chaves) {
    const valor = objeto?.[chave];
    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      return valor;
    }
  }
  return "";
}

function valorExibivel(valor) {
  if (Array.isArray(valor)) {
    const itens = valor
      .map((item) => valorExibivel(item))
      .filter((item) => item && String(item).trim() !== "");
    return itens.join(", ");
  }

  if (valor && typeof valor === "object") {
    const itens = Object.values(valor)
      .map((item) => valorExibivel(item))
      .filter((item) => item && String(item).trim() !== "");
    return itens.join(", ");
  }

  if (valor === null || valor === undefined || valor === "") return "";
  return String(valor).trim();
}

function pegarValorRecursivo(objeto, aliases) {
  const aliasesLower = aliases.map((alias) => alias.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const fila = [objeto];

  while (fila.length) {
    const atual = fila.pop();
    if (!atual || typeof atual !== "object") continue;

    for (const [chave, valor] of Object.entries(atual)) {
      const chaveLower = String(chave).toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = aliasesLower.some((alias) =>
        chaveLower === alias ||
        chaveLower.includes(alias) ||
        alias.includes(chaveLower)
      );

      if (match) {
        const resultado = valorExibivel(valor);
        if (resultado) return resultado;
      }

      if (valor && typeof valor === "object") {
        fila.push(valor);
      }
    }
  }

  return "";
}

function normalizarComponente(item) {
  const componente = item?.componente || item || {};
  const tipo = componente.compo_tipo ?? componente.tipo ?? componente.componenteTipo ?? componente.compoTipo ?? {};
  const tipoNome = componente.compo_tipo_nome ?? tipo.compo_tipo ?? tipo.nome ?? tipo.tipo ?? componente.tipo ?? "—";
  const patrimonio = pegarValorRecursivo(componente, [
    "compo_patrimonio",
    "patrimonio",
    "numero_patrimonio",
    "pat",
    "compo_observacao",
    "observacao",
    "obs",
    "obser",
    "compo_obs",
    "descricao",
  ]);
  const observacao = pegarValorRecursivo(componente, [
    "compo_obs",
    "compo_observacao",
    "observacao",
    "obs",
    "obser",
    "obs_componente",
    "descricao",
    "compo_patrimonio",
    "patrimonio",
  ]);
  const status = componente.compo_status ?? componente.status ?? componente.estado ?? componente.compoEstado ?? "—";
  const numeroSerie = componente.compo_numero_serie ?? componente.numero_serie ?? componente.numeroSerie ?? "—";

  return {
    ...componente,
    id: componente.id_compo ?? componente.compo_id ?? componente.id_comp ?? componente.id,
    nome: pegarValorPorChaves(componente, ["compo_nome", "nome", "nome_componente"]) || "Componente",
    tipo: tipoNome,
    patrimonio: patrimonio || "—",
    observacao: observacao || "—",
    numeroSerie,
    status,
    manutencao: componente.compo_ultima_manutencao ?? componente.ultima_manutencao ?? "—",
  };
}

export default function AmbientesDetalhe() {
  const { id } = useParams();
  const [ambiente, setAmbiente] = useState(null);
  const [componentes, setComponentes] = useState([]);
  const [componentesOriginais, setComponentesOriginais] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "", bloco: "", andar: 0, descricao: "", status: "ativo" });
  const [novo, setNovo] = useState({ nome: "", tipoId: "", observacao: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [componenteSelecionado, setComponenteSelecionado] = useState(null);
  const inputNomeComponenteRef = useRef(null);

  async function carregarComponentes(nome) {
    const resposta = await componenteService.buscarPorAmbiente(nome);
    const lista = listaDe(resposta, ["componentes", "componente", "data", "items"]);
    const componentesBrutos = (Array.isArray(lista) ? lista : [lista])
      .filter(Boolean)
      .map((item) => item?.componente || item)
      .filter((componente) => componente && (componente.compo_nome || componente.nome || componente.id || componente.id_compo));

    const componentesNormalizados = componentesBrutos.map(normalizarComponente).filter((componente) => componente && (componente.nome || componente.id));

    setComponentesOriginais(componentesBrutos);
    setComponentes(componentesNormalizados);
  }

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        setCarregando(true);
        const [resAmbientes, resTipos] = await Promise.all([
          ambienteService.listarAmbientes(),
          componenteTipoService.listarComponenteTipo(),
        ]);

        const listaAmbientes = listaDe(resAmbientes, ["ambientes", "ambiente", "data", "result", "items"]);
        let encontrado = listaAmbientes
          .map(normalizarAmbiente)
          .find((item) => String(item.id) === String(id));

        if (!encontrado) {
          const respostaDetalhe = await ambienteService.listarAmbienteId(id).catch(() => null);
          const listaDetalhe = listaDe(respostaDetalhe, ["ambiente", "ambientes", "data", "result", "items"]);
          encontrado = listaDetalhe
            .map(normalizarAmbiente)
            .find((item) => String(item.id) === String(id));

          if (!encontrado && respostaDetalhe && typeof respostaDetalhe === "object") {
            encontrado = normalizarAmbiente(respostaDetalhe);
          }
        }

        if (!encontrado) throw new Error("Ambiente não encontrado.");

        const listaTipos = listaDe(resTipos, ["tipos", "componenteTipos", "componente_tipo", "data", "items"]);
        if (!ativo) return;
        setAmbiente(encontrado);
        setForm({ nome: encontrado.nome, tipo: encontrado.tipo, bloco: encontrado.bloco === "—" ? "" : encontrado.bloco, andar: encontrado.andar, descricao: encontrado.descricao, status: String(encontrado.status).toLowerCase() === "inativo" ? "inativo" : "ativo" });
        setTipos(listaTipos);
        setNovo((atual) => ({ ...atual, tipoId: listaTipos[0]?.id_compo_tipo ?? listaTipos[0]?.id ?? listaTipos[0]?.compo_tipo_id ?? "" }));
        await carregarComponentes(encontrado.nome);
      } catch (error) {
        console.error("Erro ao carregar detalhe do ambiente:", error);
        if (ativo) setErro(error.message === "Ambiente não encontrado." ? error.message : "Não foi possível carregar os dados do ambiente.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [id]);

  const tiposDisponiveis = useMemo(() => tipos.map((tipo) => ({
    id: tipo.id_compo_tipo ?? tipo.id ?? tipo.compo_tipo_id,
    nome: tipo.compo_tipo ?? tipo.nome ?? tipo.tipo,
  })).filter((tipo) => tipo.id && tipo.nome), [tipos]);

  const statusAmbienteTexto = statusParaTexto(ambiente?.status);
  const andarTexto = ambiente?.andar === 0 ? "Térreo" : `${ambiente?.andar ?? 0}º andar`;
  const componenteDetalhe = componenteSelecionado?.componente || componenteSelecionado || {};
  const nomeComponente = pegarValorRecursivo(componenteDetalhe, ["compo_nome", "nome", "nome_componente"]) || "Componente";
  const observacaoComponente =
    pegarValorRecursivo(componenteDetalhe, [
      "compo_obs",
      "compo_observacao",
      "observacao",
      "obs",
      "obser",
      "obs_componente",
      "descricao",
      "comentario",
      "comentarios",
      "compo_patrimonio",
      "patrimonio",
    ]) ||
    pegarValorPorChaves(componenteDetalhe, [
      "compo_obs",
      "obs",
      "observacao",
      "obs_componente",
      "descricao",
      "comentario",
      "observacao_componente",
      "compo_observacao",
    ]) ||
    pegarValorPorChaves(componenteDetalhe?.componente || {}, [
      "compo_obs",
      "obs",
      "observacao",
      "obs_componente",
      "descricao",
      "comentario",
      "observacao_componente",
      "compo_observacao",
    ]);
  const imagemComponente = componenteDetalhe.compo_imagem ?? componenteDetalhe.imagem ?? componenteDetalhe.imagem_url ?? componenteDetalhe.image_url ?? componenteDetalhe.foto ?? componenteDetalhe.foto_url ?? componenteDetalhe.img ?? componenteDetalhe.image ?? "";
  const camposDetalheComponente = [
    { key: "compo_nome", label: "Nome", value: nomeComponente || "—" },
    { key: "compo_observacao", label: "Observação", value: observacaoComponente || "—" },
  ];

  async function salvarAmbiente(event) {
    event.preventDefault();
    setSalvando(true); setErro(""); setAviso("");
    try {
      await ambienteService.editarAmbiente(ambiente.id, {
        amb_nome: form.nome.trim(), amb_tipo: form.tipo, amb_bloco: form.bloco.trim(),
        amb_andar: Number(form.andar), amb_descricao: form.descricao.trim(), amb_status: form.status,
      });
      setAmbiente((atual) => ({ ...atual, nome: form.nome.trim(), tipo: form.tipo, bloco: form.bloco.trim() || "—", andar: Number(form.andar), descricao: form.descricao.trim(), status: form.status }));
      setEditando(false); setAviso("Alterações do ambiente salvas.");
    } catch (error) {
      console.error("Erro ao editar ambiente:", error); setErro("Não foi possível salvar as alterações do ambiente.");
    } finally { setSalvando(false); }
  }

  useEffect(() => {
    if (adicionando) {
      setTimeout(() => inputNomeComponenteRef.current?.focus(), 50);
    }
  }, [adicionando]);

  async function adicionarComponente(event) {
    event.preventDefault();
    const nome = String(novo.nome ?? "").trim();
    const tipoId = Number(novo.tipoId);
    const idAmbiente = Number(ambiente?.id);

    if (!nome || !novo.tipoId || !Number.isFinite(tipoId) || !Number.isFinite(idAmbiente)) {
      setErro("Preencha nome, tipo e ambiente antes de salvar.");
      return;
    }

    const payload = {
      compo_nome: nome,
      compo_obs: novo.observacao.trim(),
      compo_tipo_id: tipoId,
      id_amb: idAmbiente,
    };

    setSalvando(true); setErro(""); setAviso("");
    try {
      await componenteService.cadastrarComponente(payload);
      await carregarComponentes(ambiente.nome);
      setNovo({ nome: "", tipoId: tiposDisponiveis[0]?.id ?? "", observacao: "" });
      setAdicionando(false); setAviso("Componente cadastrado com sucesso.");
    } catch (error) {
      console.error("Erro ao adicionar componente:", error);
      const mensagem = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Não foi possível adicionar o componente.";
      setErro(mensagem);
    } finally { setSalvando(false); }
  }

  if (carregando) return <div className="page"><div className="empty">Carregando ambiente...</div></div>;
  if (!ambiente) return <div className="page"><div className="empty"><strong>{erro || "Ambiente não encontrado."}</strong><p><Link to="/ambientes">Voltar para ambientes</Link></p></div></div>;

  return (
    <div className="page ticket-detail-page ambiente-detail-page">
      <Link to="/ambientes" className="back-link"><ArrowLeft size={16} /> Voltar para Ambientes</Link>
      <header className="page__header ticket-header">
        <div>
          <span className="eyebrow"><Building2 size={14} /> {ambiente.tipo} · {ambiente.bloco}</span>
          <h1>{ambiente.nome}</h1>
          <p className="muted">Detalhes do ambiente e componentes cadastrados.</p>
        </div>
        <div className="ticket-header__badges">
          <span className={`ambiente-status ${String(ambiente.status).toLowerCase() === "inativo" ? "is-inactive" : ""}`}>{String(ambiente.status).toLowerCase() === "inativo" ? "Inativo" : "Ativo"}</span>
        </div>
      </header>

      {erro && <p className="form__error">{erro}</p>}
      {aviso && <p className="ambiente-detail-success">{aviso}</p>}

      <div className="grid-2 grid-2--asym ambiente-detail-grid">
        <div>
          <section className="card ambiente-detail-card">
            <div className="ambiente-detail-card-head">
              <div><h2>Informações do ambiente</h2><p className="muted">Localização e descrição</p></div>
              {!editando && <button className="btn btn--ghost" type="button" onClick={() => setEditando(true)}><Pencil size={15} /> Editar</button>}
            </div>
            {editando ? (
              <form className="form ambiente-detail-form" onSubmit={salvarAmbiente}>
                <label>Nome<input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                <div className="form__row">
                  <label>Tipo<input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} /></label>
                  <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
                </div>
                <div className="form__row">
                  <label>Bloco<input value={form.bloco} onChange={(e) => setForm({ ...form, bloco: e.target.value })} /></label>
                  <label>Andar<input type="number" min="0" value={form.andar} onChange={(e) => setForm({ ...form, andar: e.target.value })} /></label>
                </div>
                <label>Descrição<textarea rows="3" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
                <div className="form__actions"><button type="button" className="btn btn--ghost" onClick={() => setEditando(false)}><X size={15} /> Cancelar</button><button type="submit" className="btn" disabled={salvando}><Save size={15} /> {salvando ? "Salvando..." : "Salvar alterações"}</button></div>
              </form>
            ) : (
              <div className="ambiente-detail-info">
                <p><MapPin size={16} /><span><small>Localização</small><strong>{textoOuPadrao(ambiente.bloco, "—")} · {andarTexto}</strong></span></p>
                <p><Building2 size={16} /><span><small>Tipo</small><strong>{textoOuPadrao(ambiente.tipo, "Outro")}</strong></span></p>
                <p><Building2 size={16} /><span><small>Status</small><strong>{statusAmbienteTexto}</strong></span></p>
                <div><small>Descrição</small><p>{textoOuPadrao(ambiente.descricao, "Nenhuma descrição informada.")}</p></div>
              </div>
            )}
          </section>

          <section className="card ambiente-detail-card ambiente-components-card">
            <div className="ambiente-detail-card-head">
              <div><h2>Componentes</h2><p className="muted">{componentes.length} cadastrados neste ambiente</p></div>
              <button type="button" className="btn" onClick={() => setAdicionando((valor) => !valor)}><Plus size={16} /> Adicionar componente</button>
            </div>
            {adicionando && (
              <div className="ambiente-componente-modal-fundo" onClick={() => setAdicionando(false)}>
                <div className="ambiente-componente-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                  <div className="ambiente-componente-modal-header">
                    <div>
                      <span className="eyebrow">Adicionar componente</span>
                      <h3>Novo componente</h3>
                    </div>
                    <button type="button" className="ambiente-componente-modal-close" onClick={() => setAdicionando(false)} aria-label="Fechar cadastro de componente">
                      <X size={18} />
                    </button>
                  </div>

                  <form className="form ambiente-add-form" onSubmit={adicionarComponente}>
                    <label>Nome do componente<input ref={inputNomeComponenteRef} required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex.: Computador da sala" /></label>
                    <div className="form__row">
                      <label>Tipo<select required value={novo.tipoId} onChange={(e) => setNovo({ ...novo, tipoId: e.target.value })}><option value="">Selecione um tipo</option>{tiposDisponiveis.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}</select></label>
                      <label>Observação<input value={novo.observacao} onChange={(e) => setNovo({ ...novo, observacao: e.target.value })} placeholder="Opcional" /></label>
                    </div>
                    <div className="form__actions"><button type="button" className="btn btn--ghost" onClick={() => setAdicionando(false)}>Cancelar</button><button type="submit" className="btn" disabled={salvando || !tiposDisponiveis.length}>{salvando ? "Salvando..." : "Adicionar componente"}</button></div>
                    {!tiposDisponiveis.length && <p className="muted">Cadastre um tipo de componente antes de adicioná-lo.</p>}
                  </form>
                </div>
              </div>
            )}
            {componentes.length ? (
              <div className="ambiente-components-list">{componentes.map((componente, index) => (
                <button type="button" className="ambiente-component-row" key={componente.id ?? componente.nome} onClick={() => setComponenteSelecionado(componentesOriginais[index] ?? componente)}>
                  <div className="ambiente-component-icon"><Building2 size={18} /></div>
                  <div className="ambiente-component-main">
                    <strong>{componente.nome}</strong>
                    <span>{componente.tipo} · {pegarValorPorChaves(componente, ["observacao", "obs", "obser", "compo_observacao", "descricao", "compo_patrimonio", "patrimonio"]) || "Sem observação"}</span>
                  </div>
                  <span className="ambiente-component-status">{componente.status}</span>
                </button>
              ))}</div>
            ) : <div className="empty ambiente-components-empty">Este ambiente ainda não tem componentes cadastrados.</div>}
          </section>
        </div>
        <aside>
          <section className="card ambiente-detail-summary">
            <div className="ambiente-summary-header">
              <div className="ambiente-summary-icon"><Building2 size={18} /></div>
              <div>
                <h2>Resumo do ambiente</h2>
                <p className="muted">Visão geral rápida</p>
              </div>
            </div>

            <div className="ambiente-summary-list">
              <div className="ambiente-summary-item">
                <span>Status</span>
                <strong className={String(ambiente.status).toLowerCase() === "inativo" ? "is-inactive" : "is-active"}>
                  {String(ambiente.status).toLowerCase() === "inativo" ? "Inativo" : "Ativo"}
                </strong>
              </div>
              <div className="ambiente-summary-item">
                <span>Componentes</span>
                <strong>{componentes.length}</strong>
              </div>
              <div className="ambiente-summary-item">
                <span>Andar</span>
                <strong>{ambiente.andar === 0 ? "Térreo" : `${ambiente.andar}º`}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {componenteSelecionado && (
        <div className="ambiente-componente-modal-fundo" onClick={() => setComponenteSelecionado(null)}>
          <div className="ambiente-componente-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="ambiente-componente-modal-header">
              <div>
                <span className="eyebrow">Detalhes do componente</span>
                <h3>{componenteSelecionado.nome}</h3>
              </div>
              <button type="button" className="ambiente-componente-modal-close" onClick={() => setComponenteSelecionado(null)} aria-label="Fechar detalhes">
                <X size={18} />
              </button>
            </div>

            <div className="ambiente-componente-modal-grid">
              {camposDetalheComponente.length ? (
                camposDetalheComponente.map((campo) => (
                  <div key={campo.key} className="ambiente-componente-field ambiente-componente-field--full">
                    <span>{campo.label}</span>
                    <strong>{textoOuPadrao(campo.value, "—")}</strong>
                  </div>
                ))
              ) : (
                <div className="ambiente-componente-field ambiente-componente-field--full">
                  <span>Informações</span>
                  <strong>Nenhuma informação disponível para este componente.</strong>
                </div>
              )}
            </div>

            <div className="ambiente-componente-modal-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setComponenteSelecionado(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


