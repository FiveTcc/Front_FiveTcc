import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  Pencil,
  X,
  ClipboardList,
  Users,
  Building2,
  User,
  Monitor,
  Printer,
  Projector,
  Router,
  Network,
  Speaker,
  Wind,
  FlaskConical,
  Briefcase,
  BookOpen,
  Package,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Calendar,
  Eye,
} from "lucide-react";
import ambienteService from "../services/ambienteService";
import componenteService from "../services/componeteService";
import componenteTipoService from "../services/componenteTipoService";

/* ---------- Configurações visuais ---------- */

const andarLabel = (n) => (n === 0 ? "Térreo" : `${n}º Andar`);

const ICONES_COMP = {
  Computador: Monitor,
  Impressora: Printer,
  Projetor: Projector,
  Rede: Network,
  Áudio: Speaker,
  Climatização: Wind,
  Outro: Package,
};

const CSS = `
  .ambientes.page--ambientes {
    --accent: #2f6df6;
    --panel: rgba(15, 23, 42, 0.7);
    --border: rgba(148, 163, 184, 0.22);
    --text: #e5edf9;
    --text-dim: #aabbd8;
    --text-faint: #7f8fac;
    --surface-2: rgba(15, 23, 42, 0.28);
  }

  .ambientes-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin: 0 0 18px;
  }

  .ambientes-titulo-texto {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ambientes-titulo-texto h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    font-weight: 700;
    color: var(--text);
  }

  .ambientes-titulo-texto p {
    margin: 0;
    color: var(--text-dim);
    font-size: 0.98rem;
  }

  .ambientes-top-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }

  .ambientes-toolbar-search {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(100%, 360px);
    min-height: 46px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.28);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .ambientes-toolbar-search input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: 0.95rem;
    outline: none;
  }

  .ambientes-toolbar-search input::placeholder {
    color: var(--text-faint);
  }

  .ambientes-icon-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(15, 23, 42, 0.28);
    color: var(--text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .ambientes-filtros {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 12px;
    align-items: end;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .ambientes-filtros .custom-select {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .ambientes-filtros .custom-select__label {
    display: block;
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-dim);
  }

  .ambientes-filtros .custom-select__trigger {
    min-height: 46px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.28);
    color: var(--text);
    font-weight: 500;
    padding: 0 14px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .ambientes-btn--filtro {
    min-width: 180px;
    min-height: 46px;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(47, 109, 246, 0.2);
  }
`;

function normalizarComponente(item) {
  const componente = item?.componente || item || {};
  return {
    ...componente,
    id: componente.compo_id ?? componente.id_comp ?? componente.id,
    nome: componente.compo_nome ?? componente.nome ?? "",
    tipo: componente.compo_tipo_nome ?? componente.compo_tipo ?? componente.tipo ?? "",
    pat: componente.compo_patrimonio ?? componente.patrimonio ?? componente.pat ?? "â€”",
    status: componente.compo_status ?? componente.status ?? "â€”",
    manut: componente.compo_ultima_manutencao ?? componente.ultima_manutencao ?? componente.manut ?? "â€”",
  };
}
/* ---------- PÃ¡gina: renderizada dentro do <Outlet /> do layout ---------- */

export default function Ambientes() {
  const navigate = useNavigate();
  const [ambientes, setAmbientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modo, setModo] = useState("grade"); // "grade" | "detalhe"
  const [selId, setSelId] = useState(null);
  const [aba, setAba] = useState("visao");
  const [f, setF] = useState({
    q: "",
    tipo: "",
    bloco: "",
    status: "",
  });
  const [cf, setCf] = useState({ q: "", tipo: "", status: "" });
  const [novo, setNovo] = useState(null);
  const [edit, setEdit] = useState(null);
  const [componentes, setComponentes] = useState([]);
  const [carregandoComponentes, setCarregandoComponentes] = useState(false);
  const [tiposComponentes, setTiposComponentes] = useState([]);
  const [novoComponente, setNovoComponente] = useState(null);
  const [salvandoComponente, setSalvandoComponente] = useState(false);
  const qtdDe = (a) => a.comps;
  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));

  useEffect(() => {
    let montado = true;

    async function carregarAmbientes() {
      try {
        const resposta = await ambienteService.listarAmbientes();
        const dados = Array.isArray(resposta)
          ? resposta
          : resposta?.ambientes || resposta?.data || resposta?.ambiente || [];
        const lista = (Array.isArray(dados) ? dados : [dados])
          .filter(Boolean)
          .map((item) => ({
            ...item,
            id: item.id_amb ?? item.amb_id ?? item.id,
            nome: item.amb_nome ?? item.nome ?? "",
            tipo: item.amb_tipo ?? item.tipo ?? "Outro",
            bloco: item.amb_bloco ?? item.bloco ?? "",
            andar: Number(item.amb_andar ?? item.andar ?? 0),
            ativo: item.amb_status === "ativo" || item.amb_status === "ATIVO" || item.ativo === true || item.ativo === 1,
            criado: item.amb_data_criacao ?? item.criado_em ?? item.criado ?? "â€”",
            por: item.usuario?.nome ?? item.por ?? "â€”",
            comps: Number(item.componentes_count ?? item.comps ?? item.componentes?.length ?? 0),
            componentes: Array.isArray(item.componentes) ? item.componentes : [],
            desc: item.amb_descricao ?? item.descricao ?? item.desc ?? "â€”",
          }));
        if (montado) {
          setAmbientes(lista);
          setSelId((atual) => atual ?? lista[0]?.id ?? null);
        }
      } catch (error) {
        console.error("Erro ao carregar ambientes:", error);
        if (montado) setErro("NÃ£o foi possÃ­vel carregar os ambientes.");
      } finally {
        if (montado) setCarregando(false);
      }
    }

    carregarAmbientes();
    return () => {
      montado = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return ambientes.filter(
      (a) =>
        (!q ||
          [a.nome, a.bloco, a.tipo].some((s) => s.toLowerCase().includes(q))) &&
        (!f.tipo || a.tipo === f.tipo) &&
        (!f.bloco || a.bloco === f.bloco) &&
        (!f.status || (f.status === "ativo") === a.ativo),
    );
  }, [ambientes, f]);

  const blocos = [...new Set(ambientes.map((a) => a.bloco))].sort();
  const tiposAmbiente = [...new Set(ambientes.map((a) => a.tipo).filter(Boolean))].sort();
  const contTipos = tiposAmbiente
    .map((t) => [t, ambientes.filter((a) => a.tipo === t).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const sel = ambientes.find((a) => a.id === selId) || filtrados[0];
  useEffect(() => {
    if (!sel?.nome) {
      setComponentes([]);
      return undefined;
    }

    let montado = true;
    setCarregandoComponentes(true);
    componenteService.buscarPorAmbiente(sel.nome)
      .then((resposta) => {
        const dados = Array.isArray(resposta)
          ? resposta
          : resposta?.componentes || resposta?.data || resposta?.componente || [];
        if (montado) {
          setComponentes((Array.isArray(dados) ? dados : [dados]).filter(Boolean).map(normalizarComponente));
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar componentes do ambiente:", error);
        if (montado) setComponentes([]);
      })
      .finally(() => montado && setCarregandoComponentes(false));

    return () => {
      montado = false;
    };
  }, [sel?.id, sel?.nome]);

  useEffect(() => {
    componenteTipoService.listarComponenteTipo()
      .then((resposta) => {
        const dados = Array.isArray(resposta)
          ? resposta
          : resposta?.tipos || resposta?.data || [];
        setTiposComponentes((Array.isArray(dados) ? dados : [dados]).filter(Boolean));
      })
      .catch((error) => console.error("Erro ao carregar tipos de componentes:", error));
  }, []);

  const comps = componentes;
  const tiposComponente = [...new Set(comps.map((c) => c.tipo).filter(Boolean))].sort();
  const statusComponentes = [...new Set(comps.map((c) => c.status).filter(Boolean))].sort();
  const compsFiltrados = comps.filter(
    (c) =>
      (!cf.q || c.nome.toLowerCase().includes(cf.q.toLowerCase())) &&
      (!cf.tipo || c.tipo === cf.tipo) &&
      (!cf.status || c.status === cf.status),
  );

  const abrir = (id) => {
    setSelId(id);
    setAba("visao");
    navigate(`/ambientes/${id}`);
  };

  const salvarNovo = async () => {
    if (!novo.nome.trim()) return;
    try {
      const resposta = await ambienteService.cadastrarAmbiente({
        amb_nome: novo.nome.trim(),
        amb_tipo: novo.tipo,
        amb_bloco: novo.bloco,
        amb_andar: Number(novo.andar),
        amb_descricao: novo.desc?.trim() || "",
      });
      const criado = resposta?.ambiente || resposta?.data || resposta;
      const id = criado.id_amb ?? criado.amb_id ?? criado.id;
      setAmbientes((lista) => [
        {
          ...criado,
          id,
          nome: criado.amb_nome ?? criado.nome ?? novo.nome.trim(),
          tipo: criado.amb_tipo ?? criado.tipo ?? novo.tipo,
          bloco: criado.amb_bloco ?? criado.bloco ?? novo.bloco,
          andar: Number(criado.amb_andar ?? criado.andar ?? novo.andar),
          ativo: criado.amb_status !== "inativo" && criado.amb_status !== "INATIVO",
          comps: 0,
          componentes: [],
          desc: criado.amb_descricao ?? criado.descricao ?? novo.desc?.trim() ?? "â€”",
        },
        ...lista,
      ]);
      setNovo(null);
      abrir(id);
    } catch (error) {
      console.error("Erro ao cadastrar ambiente:", error);
      setErro("NÃ£o foi possÃ­vel cadastrar o ambiente.");
    }
    return;
  };

  const salvarComponente = async (event) => {
    event.preventDefault();
    if (!novoComponente?.nome.trim() || salvandoComponente || !sel?.id) return;

    try {
      setSalvandoComponente(true);
      await componenteService.cadastrarComponente({
        compo_nome: novoComponente.nome.trim(),
        compo_tipo_id: Number(novoComponente.tipoId),
        compo_patrimonio: novoComponente.patrimonio.trim(),
        id_amb: sel.id,
      });
      setNovoComponente(null);
      setCf({ q: "", tipo: "", status: "" });
      const resposta = await componenteService.buscarPorAmbiente(sel.nome);
      const dados = Array.isArray(resposta)
        ? resposta
        : resposta?.componentes || resposta?.data || [];
      setComponentes((Array.isArray(dados) ? dados : [dados]).filter(Boolean).map(normalizarComponente));
    } catch (error) {
      console.error("Erro ao cadastrar componente:", error);
      setErro("NÃ£o foi possÃ­vel cadastrar o componente.");
    } finally {
      setSalvandoComponente(false);
    }
  };

  const abrirEdicao = () =>
    setEdit({
      id: sel.id,
      nome: sel.nome,
      tipo: sel.tipo,
      bloco: sel.bloco,
      andar: String(sel.andar),
      ativo: sel.ativo ? "ativo" : "inativo",
      desc: sel.desc,
    });

  const salvarEdicao = async () => {
    if (!edit.nome.trim()) return;
    try {
      await ambienteService.editarAmbiente(edit.id, {
        amb_nome: edit.nome.trim(),
        amb_tipo: edit.tipo,
        amb_bloco: edit.bloco,
        amb_andar: Number(edit.andar),
        amb_status: edit.ativo,
        amb_descricao: edit.desc.trim(),
      });
    } catch (error) {
      console.error("Erro ao editar ambiente:", error);
      setErro("NÃ£o foi possÃ­vel editar o ambiente.");
      return;
    }
    setAmbientes(
      ambientes.map((a) =>
        a.id === edit.id
          ? {
              ...a,
              nome: edit.nome.trim(),
              tipo: edit.tipo,
              bloco: edit.bloco,
              andar: Number(edit.andar),
              ativo: edit.ativo === "ativo",
              desc: edit.desc.trim(),
            }
          : a,
      ),
    );
    setEdit(null);
  };

  const Filtros = (
    <div className="filters ambientes-filtros">
      <Select
        label="Tipo"
        value={f.tipo}
        onChange={set("tipo")}
        opts={tiposAmbiente.map((t) => [t, t])}
      />
      <Select
        label="Bloco"
        value={f.bloco}
        onChange={set("bloco")}
        opts={blocos.map((b) => [b, b])}
      />
      <Select
        label="Status"
        value={f.status}
        onChange={set("status")}
        opts={[
          ["ativo", "Ativo"],
          ["inativo", "Inativo"],
        ]}
      />
      <button
        type="button"
        className="ambientes-btn ambientes-btn--filtro"
        onClick={() =>
          setNovo({
            nome: "",
            tipo: "Sala",
            bloco: "Bloco A",
            andar: "0",
            desc: "",
          })
        }
      >
        <Plus size={18} />
        Novo Ambiente
      </button>
    </div>
  );

  return (
    <div className="ambientes page page--ambientes">
      <style>{CSS}</style>

      <div className="page-ambientes">
        <div className="ambientes-head-row">
          <div className="ambientes-titulo-texto">
            <h1>Ambientes</h1>
            <p>
              {modo === "grade"
                ? "Gerencie os ambientes cadastrados no sistema."
                : "Gerencie os ambientes cadastrados no sistema e visualize seus componentes."}
            </p>
          </div>

          <div className="ambientes-top-actions">
            <div className="ambientes-toolbar-search" aria-label="Buscar ambientes">
              <span className="topbar__icon" aria-hidden="true">
                âŒ•
              </span>
              <input
                type="search"
                value={f.q}
                onChange={set("q")}
                placeholder="Buscar por nome, bloco ou tipo..."
                aria-label="Buscar ambientes"
              />
            </div>

            <button
              type="button"
              className="ambientes-icon-btn"
              aria-label="NotificaÃ§Ãµes"
            >
              ðŸ•­
            </button>
          </div>
        </div>

        {carregando && <p className="ambientes-vazio">Carregando ambientes...</p>}
        {erro && <p className="ambientes-erro">{erro}</p>}

        {modo === "grade" ? (
          <>
          <section className="ambientes-painel ambientes-painel--filtros-topo">{Filtros}</section>
          <div className="ambientes-grade-wrap">
            <div>
              {filtrados.length === 0 && (
                <p className="ambientes-vazio">
                  Nenhum ambiente encontrado. Limpe os filtros ou cadastre um
                  novo ambiente.
                </p>
              )}
              <div className="card__ambientes card__ambientes--grid">
                {filtrados.map((a) => (
                  <CardAmbiente
                    key={a.id}
                    a={a}
                    qtd={qtdDe(a)}
                    onOpen={() => abrir(a.id)}
                  />
                ))}
              </div>
            </div>

            <aside className="ambientes-painel ambientes-resumo">
              <h3>
                <ClipboardList size={18} /> Resumo dos ambientes
              </h3>
              <div className="ambientes-kpis">
                <Kpi
                  Icon={Building2}
                  cor="#3b82f6"
                  n={ambientes.length}
                  label="Total de ambientes"
                />
                <Kpi
                  Icon={CheckCircle2}
                  cor="#22c55e"
                  n={ambientes.filter((a) => a.ativo).length}
                  label="Ativos"
                />
                <Kpi
                  Icon={XCircle}
                  cor="#ef4444"
                  n={ambientes.filter((a) => !a.ativo).length}
                  label="Inativos"
                />
                <Kpi
                  Icon={FlaskConical}
                  cor="#8b5cf6"
                  n={ambientes.filter((a) => a.tipo === "LaboratÃ³rio").length}
                  label="LaboratÃ³rios"
                />
              </div>
              <h3>Tipos de ambiente</h3>
              <ul className="ambientes-tipos">
                {contTipos.map(([t, n]) => {
                  const { cor, Icon } = tipoConfig(t);
                  return (
                    <li key={t}>
                      <span
                        className="ambientes-chip-ico"
                        style={{ background: cor + "33", color: cor }}
                      >
                        <Icon size={16} />
                      </span>
                      {t}
                      <b>{n}</b>
                    </li>
                  );
                })}
              </ul>
              <div className="ambientes-dica">
                <h3>
                  <Lightbulb size={16} /> Dica
                </h3>
                <p>
                  Mantenha os ambientes sempre atualizados para facilitar a
                  abertura de chamados e o gerenciamento dos componentes.
                </p>
              </div>
            </aside>
          </div>
          </>
        ) : (
          <>
            <section className="ambientes-painel">{Filtros}</section>
            <div className="ambientes-detalhe-wrap">
              <div className="ambientes-lista">
                {filtrados.map((a) => (
                  <CardAmbiente
                    key={a.id}
                    a={a}
                    compacto
                    ativo={a.id === sel?.id}
                    qtd={qtdDe(a)}
                    onOpen={() => abrir(a.id)}
                  />
                ))}
                {filtrados.length === 0 && (
                  <p className="ambientes-vazio">Nenhum ambiente encontrado.</p>
                )}
              </div>

              {sel && (
                <section className="ambientes-painel ambientes-det">
                  <div className="ambientes-det-head">
                    <Thumb tipo={sel.tipo} size={128} />
                    <div className="ambientes-det-info">
                      <h2>{sel.nome}</h2>
                      <div className="ambientes-tags">
                        <Tag tipo={sel.tipo} />
                        <Status ativo={sel.ativo} />
                      </div>
                      <p className="ambientes-local">
                        <MapPin size={14} /> {sel.bloco} Â·{" "}
                        {andarLabel(sel.andar)}
                      </p>
                      <p className="ambientes-desc">{sel.desc}</p>
                    </div>
                    <button className="ambientes-btn-sec" onClick={abrirEdicao}>
                      <Pencil size={15} /> Editar
                    </button>
                    <button className="ambientes-icon" aria-label="Mais aÃ§Ãµes">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="ambientes-abas" role="tablist">
                    {[
                      ["visao", Eye, "VisÃ£o geral"],
                      ["componentes", Monitor, "Componentes"],
                    ].map(([k, Icon, nome]) => (
                      <button
                        key={k}
                        role="tab"
                        aria-selected={aba === k}
                        className={aba === k ? "on" : ""}
                        onClick={() => setAba(k)}
                      >
                        <Icon size={17} /> {nome}
                      </button>
                    ))}
                  </div>

                  {aba === "componentes" && (
                    <>
                      <div className="filters ambientes-comp-filtros">
                        <label className="ambientes-busca">
                          <Search size={16} />
                          <input
                            placeholder="Buscar componentes..."
                            value={cf.q}
                            onChange={(e) =>
                              setCf((cur) => ({ ...cur, q: e.target.value }))
                            }
                          />
                        </label>

                        <Select
                          label="Tipo"
                          value={cf.tipo}
                          onChange={(v) =>
                            setCf((cur) => ({ ...cur, tipo: v }))
                          }
                          opts={[...new Set(comps.map((c) => c.tipo))].map(
                            (t) => [t, t],
                          )}
                        />
                        <Select
                          label="Status"
                          value={cf.status}
                          onChange={(v) =>
                            setCf((cur) => ({ ...cur, status: v }))
                          }
                          opts={statusComponentes.map((s) => [s, s])}
                        />

                        <button
                          type="button"
                          className="ambientes-btn"
                          onClick={() => setNovoComponente({
                            nome: "",
                            tipoId: tiposComponentes[0]?.id_compo_tipo ?? "",
                            patrimonio: "",
                          })}
                          disabled={tiposComponentes.length === 0}
                        >
                          <Plus size={16} /> Adicionar componente
                        </button>

                      </div>
                      <div className="ambientes-tabela-wrap">
                        <table className="ambientes-tabela">
                          <thead>
                            <tr>
                              <th>Componente</th>
                              <th>Tipo</th>
                              <th>PatrimÃ´nio</th>
                              <th>Status</th>
                              <th>Ãšltima manutenÃ§Ã£o</th>
                              <th>AÃ§Ãµes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compsFiltrados.map((c) => {
                              const Icon = c.Icon || ICONES_COMP[c.tipo] || Package;
                              return (
                              <tr key={c.id ?? c.pat}>
                                <td>
                                  <span className="ambientes-comp-nome">
                                    <span className="ambientes-chip-ico">
                                      <Icon size={16} />
                                    </span>
                                    {c.nome}
                                  </span>
                                </td>
                                <td className="ambientes-mudo">{c.tipo}</td>
                                <td>{c.pat}</td>
                                <td>
                                  <span
                                    className={`ambientes-pill ${c.status === "Funcionando" ? "ok" : c.status === "Com problema" ? "err" : "warn"}`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td>{c.manut}</td>
                                <td>
                                  <button
                                    className="ambientes-icon"
                                    aria-label={`AÃ§Ãµes de ${c.nome}`}
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {carregandoComponentes && (
                          <p className="ambientes-vazio">Carregando componentes...</p>
                        )}
                        {!carregandoComponentes && compsFiltrados.length === 0 && (
                          <p className="ambientes-vazio">
                            {comps.length === 0
                              ? "Este ambiente ainda nÃ£o tem componentes cadastrados."
                              : "Nenhum componente encontrado com esses filtros."}
                          </p>
                        )}
                      </div>
                      {/* <p className="ambientes-rodape-tabela">
                        Mostrando {compsFiltrados.length} de {comps.length}{" "}
                        componentes
                      </p> */}
                    </>
                  )}

                  {aba === "visao" && (
                    <div className="ambientes-visao">
                      <Info l="Nome" v={sel.nome} />
                      <Info l="Tipo" v={sel.tipo} />
                      <Info l="Bloco" v={sel.bloco} />
                      <Info l="Andar" v={andarLabel(sel.andar)} />
                      <Info l="Status" v={sel.ativo ? "Ativo" : "Inativo"} />
                      <Info l="Componentes" v={comps.length} />
                      <Info l="Criado em" v={`${sel.criado} por ${sel.por}`} />
                    </div>
                  )}

                </section>
              )}

              {sel && (
                <aside className="ambientes-col-dir">
                  <section className="ambientes-painel">
                    <h3>
                      <ClipboardList size={18} /> InformaÃ§Ãµes do Ambiente
                    </h3>
                    <Info l="Nome" v={sel.nome} />
                    <Info l="Tipo" v={sel.tipo} />
                    <Info l="Bloco" v={sel.bloco} />
                    <Info l="Andar" v={andarLabel(sel.andar)} />
                    <div className="ambientes-info">
                      <small>Status</small>
                      <Status ativo={sel.ativo} />
                    </div>
                    <Info l="ObservaÃ§Ãµes" v={sel.desc} />
                  </section>
                </aside>
              )}
            </div>
          </>
        )}
      </div>

      {novo && (
        <Modal titulo="Novo ambiente" onClose={() => setNovo(null)}>
          <FormAmbiente
            valor={novo}
            tipos={tiposAmbiente}
            onChange={setNovo}
            onCancel={() => setNovo(null)}
            onSubmit={salvarNovo}
            salvar="Salvar ambiente"
          />
        </Modal>
      )}

      {edit && (
        <Modal titulo="Editar ambiente" onClose={() => setEdit(null)}>
          <FormAmbiente
            edicao
            valor={edit}
            tipos={tiposAmbiente}
            onChange={setEdit}
            onCancel={() => setEdit(null)}
            onSubmit={salvarEdicao}
            salvar="Salvar alteraÃ§Ãµes"
          />
        </Modal>
      )}

      {novoComponente && (
        <Modal titulo="Novo componente" onClose={() => setNovoComponente(null)}>
          <FormComponenteAmbiente
            valor={novoComponente}
            tipos={tiposComponentes}
            salvando={salvandoComponente}
            onChange={setNovoComponente}
            onCancel={() => setNovoComponente(null)}
            onSubmit={salvarComponente}
          />
        </Modal>
      )}

    </div>
  );
}

/* ---------- PeÃ§as menores ---------- */

function Select({ label, value, onChange, opts, allLabel = "Todos" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = [["", allLabel], ...opts];
  const atual = options.find(([v]) => v === value) ?? options[0];
  return (
    <div className="custom-select ambientes-select" ref={ref}>
      <small className="custom-select__label">{label}</small>

      <button
        type="button"
        className={`custom-select__trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{atual[1]}</span>
        <span className="custom-select__caret">â–¾</span>
      </button>

      {open && (
        <div
          className="custom-select__menu"
          role="listbox"
          aria-label={label}
        >
          {options.map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={v === value}
              className={`custom-select__option ${v === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({ tipo, size = 72 }) {
  const { cor, Icon } = tipoConfig(tipo);
  return (
    <div
      className="ambientes-thumb"
      style={{
        width: size,
        height: size * 0.85,
        background: `linear-gradient(135deg, ${cor}55, #0b1a33)`,
        color: cor,
      }}
    >
      <Icon size={size * 0.38} />
    </div>
  );
}

const Tag = ({ tipo }) => (
  <span
    className="ambientes-tag"
    style={{
      background: tipoConfig(tipo).cor + "33",
      color: tipoConfig(tipo).cor,
      borderColor: tipoConfig(tipo).cor + "66",
    }}
  >
    {tipo}
  </span>
);

function tipoConfig(tipo = "") {
  const cores = ["#3b82f6", "#8b5cf6", "#f59e0b", "#14b8a6", "#64748b"];
  const indice = [...tipo].reduce((total, caractere) => total + caractere.charCodeAt(0), 0) % cores.length;
  return { cor: cores[indice], Icon: MapPin };
}
const Status = ({ ativo }) => (
  <span className={`ambientes-pill ${ativo ? "ok" : "err-sol"}`}>
    {ativo ? "Ativo" : "Inativo"}
  </span>
);
const Info = ({ l, v }) => (
  <div className="ambientes-info">
    <small>{l}</small>
    <span>{v}</span>
  </div>
);

function Kpi({ Icon, cor, n, label }) {
  return (
    <div className="ambientes-kpi">
      <span
        className="ambientes-kpi-ico"
        style={{ background: cor + "26", color: cor }}
      >
        <Icon size={20} />
      </span>
      <b>{n}</b>
      <small className="custom-select__label">{label}</small>
    </div>
  );
}

function CardAmbiente({ a, qtd, onOpen, compacto, ativo }) {
  return (
    <article
      className={`ambientes-card ${compacto ? "compacto" : ""} ${ativo ? "ativo" : ""}`}
      tabIndex={0}
      role="button"
      aria-label={`Abrir ${a.nome}`}
      onClick={onOpen}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())
      }
    >
      <div className="ambientes-card-topo">
        <Thumb tipo={a.tipo} size={compacto ? 72 : 76} />
        <div className="ambientes-card-info">
          <h3>{a.nome}</h3>
          <div className="ambientes-tags">
            <Tag tipo={a.tipo} />
            <Status ativo={a.ativo} />
          </div>
          <p className="ambientes-local">
            <MapPin size={13} /> {a.bloco} Â· {andarLabel(a.andar)}
          </p>
        </div>
        <MoreVertical size={16} className="ambientes-mais" />
      </div>
      <div className="ambientes-card-meta">
        <span>
          <Monitor size={15} /> {qtd} {qtd === 1 ? "componente" : "componentes"}
        </span>
      </div>
      {!compacto && (
        <div className="ambientes-card-meta fino">
          <span>
            <Calendar size={14} /> Criado em {a.criado}
          </span>
          <span>
            <User size={14} /> {a.por}
          </span>
        </div>
      )}
    </article>
  );
}

function Modal({ titulo, onClose, children }) {
  // Fecha com ESC
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Trava a rolagem da pÃ¡gina enquanto o modal estiver aberto
  useEffect(() => {
    const larguraBarra =
      window.innerWidth - document.documentElement.clientWidth;

    const overflowOriginal = document.body.style.overflow;
    const paddingOriginal = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${larguraBarra}px`;

    return () => {
      document.body.style.overflow = overflowOriginal;
      document.body.style.paddingRight = paddingOriginal;
    };
  }, []);

  return (
    <div className="ambientes-modal-fundo" onClick={onClose}>
      <div className="ambientes-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

function Acoes({ onCancel, salvar, ok }) {
  return (
    <div className="ambientes-modal-acoes">
      <button type="button" className="ambientes-btn-sec" onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" className="ambientes-btn" disabled={!ok}>
        {salvar}
      </button>
    </div>
  );
}

function FormComponenteAmbiente({ valor, tipos, salvando, onChange, onCancel, onSubmit }) {
  const up = (campo) => (event) => onChange({ ...valor, [campo]: event.target.value });
  const ok = valor.nome.trim() && valor.tipoId;

  return (
    <form onSubmit={onSubmit}>
      <label>
        Nome do componente
        <input
          autoFocus
          value={valor.nome}
          onChange={up("nome")}
          placeholder="Ex.: Computador da sala 01"
        />
      </label>
      <label>
        Tipo
        <select value={valor.tipoId} onChange={up("tipoId")}>
          <option value="">Selecione um tipo</option>
          {tipos.map((tipo) => (
            <option key={tipo.id_compo_tipo} value={tipo.id_compo_tipo}>
              {tipo.compo_tipo}
            </option>
          ))}
        </select>
      </label>
      <label>
        PatrimÃ´nio
        <input
          value={valor.patrimonio}
          onChange={up("patrimonio")}
          placeholder="Opcional"
        />
      </label>
      <Acoes onCancel={onCancel} salvar={salvando ? "Salvando..." : "Cadastrar componente"} ok={ok && !salvando} />
    </form>
  );
}

function FormAmbiente({ valor, onChange, onCancel, onSubmit, salvar, edicao, tipos }) {
  const up = (k) => (e) => onChange({ ...valor, [k]: e.target.value });
  const ok = !!valor.nome.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit();
      }}
    >
      <label>
        Nome
        <input
          autoFocus
          value={valor.nome}
          onChange={up("nome")}
          placeholder="Ex.: LaboratÃ³rio 03"
        />
      </label>
      <label>
        Tipo
        <select value={valor.tipo} onChange={up("tipo")}>
          {tipos.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <div className="ambientes-linha">
        <label>
          Bloco
          <input value={valor.bloco} onChange={up("bloco")} />
        </label>
        <label>
          Andar
          <input type="number" min="0" value={valor.andar} onChange={up("andar")} />
        </label>
      </div>
      {edicao && (
        <label>
          Status
          <select value={valor.ativo} onChange={up("ativo")}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>
      )}
      <label>
        ObservaÃ§Ãµes
        <textarea
          rows={3}
          value={valor.desc}
          onChange={up("desc")}
          placeholder="Opcional"
        />
      </label>
      <Acoes onCancel={onCancel} salvar={salvar} ok={ok} />
    </form>
  );
}





