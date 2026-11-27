import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Monitor, Plus, Search, Pencil, Package } from "lucide-react";
import componenteService from "../services/componeteService";
import ambienteService from "../services/ambienteService";
import componenteTipoService from "../services/componenteTipoService";

function listaDe(resposta, chaves) {
  if (Array.isArray(resposta)) return resposta;
  for (const chave of chaves) {
    if (Array.isArray(resposta?.[chave])) return resposta[chave];
    if (Array.isArray(resposta?.data?.[chave])) return resposta.data[chave];
  }
  if (Array.isArray(resposta?.data)) return resposta.data;
  return [];
}

function normalizar(item) {
  const componente = item?.componente || item || {};
  const ambiente = item?.ambiente || {};
  return {
    ...componente,
    id: componente.id_compo ?? componente.compo_id ?? componente.id,
    nome: componente.compo_nome ?? componente.nome ?? "",
    tipoId: componente.compo_tipo_id ?? componente.id_compo_tipo ?? "",
    tipo: componente.compo_tipo_nome ?? componente.compo_tipo ?? componente.tipo ?? "—",
    patrimonio: componente.compo_patrimonio ?? componente.patrimonio ?? "—",
    numeroSerie: componente.compo_numero_serie ?? componente.numero_serie ?? "—",
    status: componente.compo_status ?? componente.status ?? "—",
    ambienteId: componente.id_amb ?? ambiente.id_amb ?? "",
    ambiente: ambiente.amb_nome ?? componente.amb_nome ?? componente.ambiente_nome ?? "Sem ambiente",
  };
}

const FORM_VAZIO = { nome: "", tipoId: "", ambienteId: "" };

export default function Componentes() {
  const [searchParams] = useSearchParams();
  const ambienteInicial = searchParams.get("ambiente") || "";
  const [componentes, setComponentes] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroAmbiente, setFiltroAmbiente] = useState(ambienteInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const [resComponentes, resAmbientes, resTipos] = await Promise.all([
        componenteService.listarComponente(),
        ambienteService.listarAmbientes(),
        componenteTipoService.listarComponenteTipo(),
      ]);
      setComponentes(listaDe(resComponentes, ["componentes", "componente"]).map(normalizar));
      setAmbientes(listaDe(resAmbientes, ["ambientes", "ambiente"]));
      setTipos(listaDe(resTipos, ["tipos", "tiposComponentes", "componenteTipo"]));
    } catch (error) {
      console.error("Erro ao carregar componentes:", error);
      setErro("Não foi possível carregar os componentes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return componentes.filter((item) =>
      (!termo || [item.nome, item.tipo, item.patrimonio, item.numeroSerie, item.ambiente]
        .some((valor) => String(valor).toLowerCase().includes(termo))) &&
      (!filtroAmbiente || String(item.ambienteId) === String(filtroAmbiente)),
    );
  }, [componentes, busca, filtroAmbiente]);

  async function salvar(event) {
    event.preventDefault();

    const nome = form?.nome?.trim() ?? "";
    const tipoId = Number(form?.tipoId);
    const ambienteId = Number(form?.ambienteId);

    if (
      nome.length < 3 ||
      nome.length > 100 ||
      !Number.isFinite(tipoId) ||
      tipoId <= 0 ||
      !Number.isFinite(ambienteId) ||
      ambienteId <= 0 ||
      salvando
    ) return;

    const dados = {
      compo_nome: nome,
      compo_tipo_id: tipoId,
      id_amb: ambienteId,
    };

    setSalvando(true);
    setErro("");

    try {
      if (form.id) {
        await componenteService.atualizarComponente(form.id, dados);
      } else {
        await componenteService.cadastrarComponente(dados);
      }

      setForm(null);
      await carregar();
    } catch (error) {
      console.error("Erro ao salvar componente:", error.response?.data || error);
      setErro(error.response?.data?.message || "Não foi possível salvar o componente.");
    } finally {
      setSalvando(false);
    }
  }

  function editar(item) {
    setForm({
      id: item.id,
      nome: item.nome,
      tipoId: item.tipoId,
      ambienteId: item.ambienteId,
    });
  }

  return (
    <main className="pagina pagina--componentes">
      <header className="pagina__cabecalho">
        <div>
          <h1>Componentes</h1>
          <p className="esmaecido">Gerencie cada equipamento e acompanhe em qual ambiente está instalado.</p>
        </div>
        <button className="botao botao--principal" type="button" onClick={() => setForm({ ...FORM_VAZIO, ambienteId: ambienteInicial })}>
          <Plus size={18} /> Novo componente
        </button>
      </header>

      {erro && <p className="formulario__erro">{erro}</p>}

      <section className="componentes-barra-ferramentas card">
        <label className="componentes-busca">
          <Search size={18} />
          <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome, patrimônio ou série" />
        </label>
        <select value={filtroAmbiente} onChange={(event) => setFiltroAmbiente(event.target.value)} aria-label="Filtrar por ambiente">
          <option value="">Todos os ambientes</option>
          {ambientes.map((ambiente) => (
            <option key={ambiente.id_amb ?? ambiente.id} value={ambiente.id_amb ?? ambiente.id}>
              {ambiente.amb_nome ?? ambiente.nome}
            </option>
          ))}
        </select>
        <span className="esmaecido">{filtrados.length} {filtrados.length === 1 ? "equipamento" : "equipamentos"}</span>
      </section>

      {carregando ? <p className="vazio">Carregando componentes...</p> : filtrados.length === 0 ? (
        <section className="card componentes-vazio">
          <Package size={30} />
          <strong>Nenhum componente encontrado</strong>
          <span className="esmaecido">Cadastre um equipamento ou ajuste os filtros.</span>
        </section>
      ) : (
        <section className="componentes-grade">
          {filtrados.map((item) => (
            <article className="card componente-card" key={item.id ?? `${item.nome}-${item.patrimonio}`}>
              <div className="componente-card__superior">
                <span className="componente-card__simbolo"><Monitor size={20} /></span>
                <div className="componente-card__heading">
                  <h2>{item.nome}</h2>
                  <span className="esmaecido">{item.tipo}</span>
                </div>
                <button className="botao botao--transparente botao--pequeno" type="button" aria-label={`Editar ${item.nome}`} onClick={() => editar(item)}>
                  <Pencil size={16} />
                </button>
              </div>
              <dl className="componente-card__details">
                <div><dt>Patrimônio</dt><dd>{item.patrimonio}</dd></div>
                <div><dt>Número de série</dt><dd>{item.numeroSerie}</dd></div>
                <div><dt>Status</dt><dd>{item.status}</dd></div>
                <div><dt>Ambiente</dt><dd>{item.ambiente}</dd></div>
              </dl>
            </article>
          ))}
        </section>
      )}

      <p className="componentes-footnote"><Link to="/ambientes">Ver ambientes</Link> para consultar os equipamentos agrupados por local.</p>

      {form && (
        <div className="componentes-modal-fundo" onMouseDown={(event) => event.target === event.currentTarget && setForm(null)}>
          <section className="card componentes-modal" role="dialog" aria-modal="true" aria-labelledby="componente-form-title">
            <h2 id="componente-form-title">{form.id ? "Editar componente" : "Novo componente"}</h2>
            <form onSubmit={salvar}>
              <label>Nome do equipamento<input autoFocus required minLength={3} maxLength={100} value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Ex.: Computador da sala 01" /></label>
              <label>Tipo<select required value={form.tipoId} onChange={(event) => setForm({ ...form, tipoId: event.target.value })}>
                <option value="">Selecione um tipo</option>
                {tipos.map((tipo) => <option key={tipo.id_compo_tipo ?? tipo.id} value={tipo.id_compo_tipo ?? tipo.id}>{tipo.compo_tipo ?? tipo.nome}</option>)}
              </select></label>
              <label>Ambiente<select required value={form.ambienteId} onChange={(event) => setForm({ ...form, ambienteId: event.target.value })}>
                <option value="">Selecione um ambiente</option>
                {ambientes.map((ambiente) => <option key={ambiente.id_amb ?? ambiente.id} value={ambiente.id_amb ?? ambiente.id}>{ambiente.amb_nome ?? ambiente.nome}</option>)}
              </select></label>
              <div className="componentes-modal__acoes">
                <button className="botao botao--transparente" type="button" onClick={() => setForm(null)}>Cancelar</button>
                <button className="botao botao--principal" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar componente"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
