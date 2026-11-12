import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Pencil, Plus, Save, X } from "lucide-react";
import ambienteService from "../services/ambienteService";
import componenteService from "../services/componeteService";
import componenteTipoService from "../services/componenteTipoService";
import CustomSelect from "../components/CustomSelect";

function normalizarLista(resposta, chave = "ambientes") {
  const dados = resposta?.data ?? resposta?.resultado ?? resposta?.result ?? resposta?.payload ?? resposta;

  if (Array.isArray(dados)) return dados;
  if (dados && Array.isArray(dados[chave])) return dados[chave];
  if (dados && Array.isArray(dados.ambiente)) return dados.ambiente;

  return [];
}

function textoOuPadrao(valor, padrao = "—") {
  if (valor === null || valor === undefined || valor === "") return padrao;
  return String(valor).trim();
}

function statusParaTexto(valor) {
  const texto = textoOuPadrao(valor, "ativo").toLowerCase();
  return ["inativo", "false", "0", "desativado", "disabled"].includes(texto) ? "Inativo" : "Ativo";
}

function normalizarAmbiente(item) {
  const ambiente = item?.ambiente || item || {};

  return {
    id: ambiente.id_amb ?? ambiente.id ?? ambiente.amb_id,
    nome: textoOuPadrao(ambiente.amb_nome ?? ambiente.nome, "Ambiente"),
    tipo: textoOuPadrao(ambiente.amb_tipo ?? ambiente.tipo, "Outro"),
    bloco: textoOuPadrao(ambiente.amb_bloco ?? ambiente.bloco, "—"),
    andar: Number(ambiente.amb_andar ?? ambiente.andar ?? 0),
    descricao: textoOuPadrao(ambiente.amb_obs ?? ambiente.amb_descricao ?? ambiente.descricao, "Nenhuma descrição informada."),
    status: textoOuPadrao(ambiente.amb_status ?? ambiente.status ?? "ativo").toLowerCase(),
  };
}

function normalizarComponente(item) {
  const componente = item?.componente || item || {};

  return {
    id: componente.id_comp ?? componente.id_compo ?? componente.id,
    nome: textoOuPadrao(componente.compo_nome ?? componente.nome, "Componente"),
    tipo: textoOuPadrao(componente.compo_tipo ?? componente.tipo, "Outro"),
    observacao: textoOuPadrao(componente.compo_obs ?? componente.obs ?? componente.observacao, "—"),
    patrimonio: textoOuPadrao(componente.compo_patrimonio ?? componente.patrimonio, "—"),
    status: textoOuPadrao(componente.compo_status ?? componente.status, "—"),
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
  const TIPOS_COMPONENTE_PADRAO = [
  "Computador",
  "Notebook",
  "Monitor",
  "Impressora",
  "Projetor",
  "Teclado",
  "Mouse",
  "Roteador",
  "Switch",
  "Webcam",
  "Scanner",
  "Caixa de som",
];

const [novo, setNovo] = useState({ nome: "", tipoId: "", tipoTexto: "", observacao: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [componenteSelecionado, setComponenteSelecionado] = useState(null);
  const inputNomeComponenteRef = useRef(null);

  async function carregarComponentes(nome) {
    const resposta = await componenteService.buscarPorAmbiente(nome);
    const lista = normalizarLista(resposta, "componentes");
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

        const listaAmbientes = normalizarLista(resAmbientes, "ambientes");
        let encontrado = listaAmbientes
          .map(normalizarAmbiente)
          .find((item) => String(item.id) === String(id));

        if (!encontrado) {
          const respostaDetalhe = await ambienteService.listarAmbienteId(id).catch(() => null);
          const listaDetalhe = normalizarLista(respostaDetalhe, "ambientes");
          encontrado = listaDetalhe
            .map(normalizarAmbiente)
            .find((item) => String(item.id) === String(id));

          if (!encontrado && respostaDetalhe && typeof respostaDetalhe === "object") {
            encontrado = normalizarAmbiente(respostaDetalhe);
          }
        }

        if (!encontrado) throw new Error("Ambiente não encontrado.");

        const listaTipos = normalizarLista(resTipos, "tipos");
        if (!ativo) return;
        setAmbiente(encontrado);
        setForm({ nome: encontrado.nome, tipo: encontrado.tipo, bloco: encontrado.bloco === "—" ? "" : encontrado.bloco, andar: encontrado.andar, descricao: encontrado.descricao, status: String(encontrado.status).toLowerCase() === "inativo" ? "inativo" : "ativo" });
        setTipos(listaTipos);
        const primeiroTipo = listaTipos[0];
        setNovo((atual) => ({
          ...atual,
          tipoId: primeiroTipo?.id_compo_tipo ?? primeiroTipo?.id ?? primeiroTipo?.compo_tipo_id ?? "",
          tipoTexto: primeiroTipo?.compo_tipo ?? primeiroTipo?.nome ?? "",
        }));
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
  const nomeComponente = componenteDetalhe?.compo_nome ?? componenteDetalhe?.nome ?? "Componente";
  const observacaoComponente = componenteDetalhe?.compo_obs ?? componenteDetalhe?.obs ?? componenteDetalhe?.observacao ?? "—";
  const camposDetalheComponente = [
    { key: "compo_nome", label: "Nome", value: textoOuPadrao(nomeComponente, "—") },
    { key: "compo_obs", label: "Observação", value: textoOuPadrao(observacaoComponente, "—") },
  ];

  async function salvarAmbiente(event) {
    event.preventDefault();
    setSalvando(true); setErro(""); setAviso("");
    try {
      await ambienteService.editarAmbiente(ambiente.id, {
        amb_nome: form.nome.trim(),
        amb_tipo: form.tipo,
        amb_bloco: form.bloco.trim(),
        amb_andar: Number(form.andar),
        amb_obs: form.descricao.trim(),
        amb_status: form.status,
      });
      setAmbiente((atual) => ({
        ...atual,
        nome: form.nome.trim(),
        tipo: form.tipo,
        bloco: form.bloco.trim() || "—",
        andar: Number(form.andar),
        descricao: form.descricao.trim(),
        status: form.status,
      }));
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
    const tipoTexto = String(novo.tipoTexto ?? "").trim();
    const idAmbiente = Number(ambiente?.id);

    if (!nome || !tipoTexto || !Number.isFinite(idAmbiente)) {
      setErro("Preencha nome, tipo e ambiente antes de salvar.");
      return;
    }

    setSalvando(true); setErro(""); setAviso("");
    try {
      let tipoId = Number(novo.tipoId || 0);
      if (!Number.isFinite(tipoId) || tipoId <= 0) {
        const tipoEncontrado = tipos.find((tipo) => {
          const nomeTipo = String(tipo.compo_tipo ?? tipo.nome ?? "").trim().toLowerCase();
          return nomeTipo === tipoTexto.toLowerCase();
        });
        tipoId = Number(tipoEncontrado?.id_compo_tipo ?? tipoEncontrado?.id ?? tipoEncontrado?.compo_tipo_id ?? 0);
      }

      if (!Number.isFinite(tipoId) || tipoId <= 0) {
        try {
          const tipoCriado = await componenteTipoService.cadastrarComponenteTipo({
            compo_tipo: tipoTexto,
          });
          tipoId = Number(
            tipoCriado?.id_compo_tipo ??
              tipoCriado?.id ??
              tipoCriado?.data?.id_compo_tipo ??
              tipoCriado?.data?.id ??
              0,
          );
        } catch (error) {
          console.warn("Tipo de componente não pôde ser criado; segue com valor digitado.", error);
        }
      }

      const payload = {
        compo_nome: nome,
        compo_obs: novo.observacao.trim(),
        id_amb: idAmbiente,
        ...(Number.isFinite(tipoId) && tipoId > 0 ? { compo_tipo_id: tipoId } : {}),
        ...(tipoTexto ? { compo_tipo: tipoTexto } : {}),
      };

      await componenteService.cadastrarComponente(payload);
      await carregarComponentes(ambiente.nome);
      const primeiroTipo = tiposDisponiveis[0];
      setNovo({
        nome: "",
        tipoId: primeiroTipo?.id ?? "",
        tipoTexto: primeiroTipo?.nome ?? "",
        observacao: "",
      });
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
                  <div className="ambiente-detail-form__field">
                    <label htmlFor="ambiente-status">Status</label>
                    <CustomSelect
                      id="ambiente-status"
                      label="Status"
                      className="cselect--form"
                      value={form.status}
                      options={[
                        { value: "ativo", label: "Ativo" },
                        { value: "inativo", label: "Inativo" },
                      ]}
                      onChange={(value) => setForm((atual) => ({ ...atual, status: value }))}
                    />
                  </div>
                </div>
                <div className="form__row">
                  <label>Bloco<input value={form.bloco} onChange={(e) => setForm({ ...form, bloco: e.target.value })} /></label>
                  <label>Andar<input type="number" min="0" value={form.andar} onChange={(e) => setForm({ ...form, andar: e.target.value })} /></label>
                </div>
                <label>Descrição<textarea rows="3" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
                <div className="form__actions"><button type="button" className="btn btn--ghost" onClick={() => setEditando(false)}>Cancelar</button><button type="submit" className="btn btn--primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</button></div>
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
              <button type="button" className="btn btn--adicionar" onClick={() => setAdicionando((valor) => !valor)}><Plus size={16} /> Adicionar componente</button>
            </div>
            {adicionando && (
              <div className="ambiente-componente-modal-fundo" onClick={() => setAdicionando(false)}>
                <div className="ambiente-componente-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                  <div className="ambiente-componente-modal-header">
                    <div>
                      <span className= "eyebrow">Adicionar componente</span>
                      <h3>Novo componente</h3>
                    </div>
                    <button type="button" className="ambiente-componente-modal-close" onClick={() => setAdicionando(false)} aria-label="Fechar cadastro de componente">
                      <X size={18} />
                    </button>
                  </div>

                  <form className="form ambiente-add-form" onSubmit={adicionarComponente}>
                    <label>Nome do componente<input ref={inputNomeComponenteRef} required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex.: Computador da sala" /></label>
                    <div className="form__row">
                      <label>
                        Tipo
                        <input
                          type="text"
                          list="tiposComponenteDetalhe"
                          value={novo.tipoTexto ?? ""}
                          onChange={(e) => {
                            const valor = e.target.value;
                            const tipoEncontrado = tipos.find((tipo) => {
                              const nomeTipo = String(tipo.compo_tipo ?? tipo.nome ?? "").trim().toLowerCase();
                              return nomeTipo === valor.trim().toLowerCase();
                            });

                            setNovo({
                              ...novo,
                              tipoTexto: valor,
                              tipoId: tipoEncontrado
                                ? String(tipoEncontrado.id_compo_tipo ?? tipoEncontrado.id ?? tipoEncontrado.compo_tipo_id)
                                : novo.tipoId,
                            });
                          }}
                          placeholder="Selecione ou digite um tipo"
                        />
                        <datalist id="tiposComponenteDetalhe">
                          {(tiposDisponiveis.length ? tiposDisponiveis : TIPOS_COMPONENTE_PADRAO.map((nome) => ({ id: nome, nome }))).map((tipo) => (
                            <option key={tipo.id ?? tipo.nome} value={tipo.nome} />
                          ))}
                        </datalist>
                      </label>
                      <label>Observação<input value={novo.observacao} onChange={(e) => setNovo({ ...novo, observacao: e.target.value })} placeholder="Opcional" /></label>
                    </div>
                    <div className="form__actions"><button type="button" className="btn btn--cancelar" onClick={() => setAdicionando(false)}>Cancelar</button><button type="submit" className="btn btn--adicionar" disabled={salvando}>{salvando ? "Salvando..." : "Adicionar componente"}</button></div>
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
                    <span>{componente.tipo} · {textoOuPadrao(componente.observacao, "Sem observação")}</span>
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


