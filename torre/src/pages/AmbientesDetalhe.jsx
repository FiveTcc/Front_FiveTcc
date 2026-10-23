import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Pencil, Plus, Save, X } from "lucide-react";
import ambienteService from "../services/ambienteService";
import componenteService from "../services/componeteService";
import componenteTipoService from "../services/componenteTipoService";

function listaDe(resposta, chaves) {
  const raiz = resposta?.data?.data ?? resposta?.data ?? resposta;
  for (const chave of chaves) {
    if (Array.isArray(raiz?.[chave])) return raiz[chave];
    if (raiz?.[chave] && typeof raiz[chave] === "object") return [raiz[chave]];
  }
  return Array.isArray(raiz) ? raiz : raiz && typeof raiz === "object" ? [raiz] : [];
}

function normalizarAmbiente(item) {
  const ambiente = item?.ambiente || item || {};
  return {
    ...ambiente,
    id: ambiente.id_amb ?? ambiente.amb_id ?? ambiente.id,
    nome: ambiente.amb_nome ?? ambiente.nome ?? "Ambiente",
    tipo: ambiente.amb_tipo ?? ambiente.tipo ?? "Outro",
    bloco: ambiente.amb_bloco ?? ambiente.bloco ?? "â€”",
    andar: Number(ambiente.amb_andar ?? ambiente.andar ?? 0),
    descricao: ambiente.amb_descricao ?? ambiente.descricao ?? "",
    status: ambiente.amb_status ?? (ambiente.ativo ? "ativo" : "inativo"),
  };
}

function normalizarComponente(item) {
  const componente = item?.componente || item || {};
  return {
    ...componente,
    id: componente.compo_id ?? componente.id_comp ?? componente.id,
    nome: componente.compo_nome ?? componente.nome ?? "Componente",
    tipo: componente.compo_tipo_nome ?? componente.compo_tipo ?? componente.tipo ?? "â€”",
    patrimonio: componente.compo_patrimonio ?? componente.patrimonio ?? "â€”",
    status: componente.compo_status ?? componente.status ?? "â€”",
    manutencao: componente.compo_ultima_manutencao ?? componente.ultima_manutencao ?? "â€”",
  };
}

export default function AmbientesDetalhe() {
  const { id } = useParams();
  const [ambiente, setAmbiente] = useState(null);
  const [componentes, setComponentes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [editando, setEditando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "", bloco: "", andar: 0, descricao: "", status: "ativo" });
  const [novo, setNovo] = useState({ nome: "", tipoId: "", patrimonio: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function carregarComponentes(nome) {
    const resposta = await componenteService.buscarPorAmbiente(nome);
    setComponentes(listaDe(resposta, ["componentes", "componente"]).map(normalizarComponente));
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
        const encontrado = listaDe(resAmbientes, ["ambientes", "ambiente"])
          .map(normalizarAmbiente)
          .find((item) => String(item.id) === String(id));
        if (!encontrado) throw new Error("Ambiente nÃ£o encontrado.");
        const listaTipos = listaDe(resTipos, ["tipos", "componenteTipos", "componente_tipo"]);
        if (!ativo) return;
        setAmbiente(encontrado);
        setForm({ nome: encontrado.nome, tipo: encontrado.tipo, bloco: encontrado.bloco === "â€”" ? "" : encontrado.bloco, andar: encontrado.andar, descricao: encontrado.descricao, status: String(encontrado.status).toLowerCase() === "inativo" ? "inativo" : "ativo" });
        setTipos(listaTipos);
        setNovo((atual) => ({ ...atual, tipoId: listaTipos[0]?.id_compo_tipo ?? listaTipos[0]?.id ?? "" }));
        await carregarComponentes(encontrado.nome);
      } catch (error) {
        console.error("Erro ao carregar detalhe do ambiente:", error);
        if (ativo) setErro(error.message === "Ambiente nÃ£o encontrado." ? error.message : "NÃ£o foi possÃ­vel carregar os dados do ambiente.");
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

  async function salvarAmbiente(event) {
    event.preventDefault();
    setSalvando(true); setErro(""); setAviso("");
    try {
      await ambienteService.editarAmbiente(ambiente.id, {
        amb_nome: form.nome.trim(), amb_tipo: form.tipo, amb_bloco: form.bloco.trim(),
        amb_andar: Number(form.andar), amb_descricao: form.descricao.trim(), amb_status: form.status,
      });
      setAmbiente((atual) => ({ ...atual, nome: form.nome.trim(), tipo: form.tipo, bloco: form.bloco.trim() || "â€”", andar: Number(form.andar), descricao: form.descricao.trim(), status: form.status }));
      setEditando(false); setAviso("AlteraÃ§Ãµes do ambiente salvas.");
    } catch (error) {
      console.error("Erro ao editar ambiente:", error); setErro("NÃ£o foi possÃ­vel salvar as alteraÃ§Ãµes do ambiente.");
    } finally { setSalvando(false); }
  }

  async function adicionarComponente(event) {
    event.preventDefault();
    if (!novo.nome.trim() || !novo.tipoId) return;
    setSalvando(true); setErro(""); setAviso("");
    try {
      await componenteService.cadastrarComponente({
        compo_nome: novo.nome.trim(), compo_tipo_id: Number(novo.tipoId),
        compo_patrimonio: novo.patrimonio.trim(), id_amb: ambiente.id,
      });
      await carregarComponentes(ambiente.nome);
      setNovo({ nome: "", tipoId: tiposDisponiveis[0]?.id ?? "", patrimonio: "" });
      setAdicionando(false); setAviso("Componente adicionado ao ambiente.");
    } catch (error) {
      console.error("Erro ao adicionar componente:", error); setErro("NÃ£o foi possÃ­vel adicionar o componente.");
    } finally { setSalvando(false); }
  }

  if (carregando) return <div className="page"><div className="empty">Carregando ambiente...</div></div>;
  if (!ambiente) return <div className="page"><div className="empty"><strong>{erro || "Ambiente nÃ£o encontrado."}</strong><p><Link to="/ambientes">Voltar para ambientes</Link></p></div></div>;

  return (
    <div className="page ticket-detail-page ambiente-detail-page">
      <Link to="/ambientes" className="back-link"><ArrowLeft size={16} /> Voltar para Ambientes</Link>
      <header className="page__header ticket-header">
        <div>
          <span className="eyebrow"><Building2 size={14} /> {ambiente.tipo} Â· {ambiente.bloco}</span>
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
              <div><h2>InformaÃ§Ãµes do ambiente</h2><p className="muted">LocalizaÃ§Ã£o e descriÃ§Ã£o</p></div>
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
                <label>DescriÃ§Ã£o<textarea rows="3" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
                <div className="form__actions"><button type="button" className="btn btn--ghost" onClick={() => setEditando(false)}><X size={15} /> Cancelar</button><button type="submit" className="btn" disabled={salvando}><Save size={15} /> {salvando ? "Salvando..." : "Salvar alteraÃ§Ãµes"}</button></div>
              </form>
            ) : (
              <div className="ambiente-detail-info">
                <p><MapPin size={16} /><span><small>LocalizaÃ§Ã£o</small><strong>{ambiente.bloco} Â· {ambiente.andar === 0 ? "TÃ©rreo" : `${ambiente.andar}Âº andar`}</strong></span></p>
                <p><Building2 size={16} /><span><small>Tipo</small><strong>{ambiente.tipo}</strong></span></p>
                <div><small>DescriÃ§Ã£o</small><p>{ambiente.descricao || "Nenhuma descriÃ§Ã£o informada."}</p></div>
              </div>
            )}
          </section>

          <section className="card ambiente-detail-card ambiente-components-card">
            <div className="ambiente-detail-card-head">
              <div><h2>Componentes</h2><p className="muted">{componentes.length} cadastrados neste ambiente</p></div>
              <button type="button" className="btn" onClick={() => setAdicionando((valor) => !valor)}><Plus size={16} /> Adicionar componente</button>
            </div>
            {adicionando && (
              <form className="form ambiente-add-form" onSubmit={adicionarComponente}>
                <label>Nome do componente<input required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex.: Computador da sala" /></label>
                <div className="form__row">
                  <label>Tipo<select required value={novo.tipoId} onChange={(e) => setNovo({ ...novo, tipoId: e.target.value })}><option value="">Selecione um tipo</option>{tiposDisponiveis.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}</select></label>
                  <label>PatrimÃ´nio<input value={novo.patrimonio} onChange={(e) => setNovo({ ...novo, patrimonio: e.target.value })} placeholder="Opcional" /></label>
                </div>
                <div className="form__actions"><button type="button" className="btn btn--ghost" onClick={() => setAdicionando(false)}>Cancelar</button><button type="submit" className="btn" disabled={salvando || !tiposDisponiveis.length}>{salvando ? "Salvando..." : "Adicionar componente"}</button></div>
                {!tiposDisponiveis.length && <p className="muted">Cadastre um tipo de componente antes de adicionÃ¡-lo.</p>}
              </form>
            )}
            {componentes.length ? (
              <div className="ambiente-components-list">{componentes.map((componente) => (
                <article className="ambiente-component-row" key={componente.id ?? componente.nome}>
                  <div className="ambiente-component-icon"><Building2 size={18} /></div>
                  <div className="ambiente-component-main"><strong>{componente.nome}</strong><span>{componente.tipo} Â· PatrimÃ´nio {componente.patrimonio}</span></div>
                  <span className="ambiente-component-status">{componente.status}</span>
                </article>
              ))}</div>
            ) : <div className="empty ambiente-components-empty">Este ambiente ainda nÃ£o tem componentes cadastrados.</div>}
          </section>
        </div>
        <aside>
          <section className="card ambiente-detail-summary"><h2>Resumo do ambiente</h2><div><span>Status</span><strong>{String(ambiente.status).toLowerCase() === "inativo" ? "Inativo" : "Ativo"}</strong></div><div><span>Componentes</span><strong>{componentes.length}</strong></div><div><span>Andar</span><strong>{ambiente.andar === 0 ? "TÃ©rreo" : `${ambiente.andar}Âº`}</strong></div></section>
        </aside>
      </div>

      
    </div>
  );
}


