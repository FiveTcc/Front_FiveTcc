import { useEffect, useMemo, useRef, useState } from "react";
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

function normalizarComponente(item) {
  const componente = item?.componente || item || {};
  return {
    ...componente,
    id: componente.compo_id ?? componente.id_comp ?? componente.id,
    nome: componente.compo_nome ?? componente.nome ?? "",
    tipo: componente.compo_tipo_nome ?? componente.compo_tipo ?? componente.tipo ?? "",
    pat: componente.compo_patrimonio ?? componente.patrimonio ?? componente.pat ?? "—",
    status: componente.compo_status ?? componente.status ?? "—",
    manut: componente.compo_ultima_manutencao ?? componente.ultima_manutencao ?? componente.manut ?? "—",
  };
}
/* ---------- Página: renderizada dentro do <Outlet /> do layout ---------- */

export default function Ambientes() {
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
            criado: item.amb_data_criacao ?? item.criado_em ?? item.criado ?? "—",
            por: item.usuario?.nome ?? item.por ?? "—",
            comps: Number(item.componentes_count ?? item.comps ?? item.componentes?.length ?? 0),
            componentes: Array.isArray(item.componentes) ? item.componentes : [],
            desc: item.amb_descricao ?? item.descricao ?? item.desc ?? "—",
          }));
        if (montado) {
          setAmbientes(lista);
          setSelId((atual) => atual ?? lista[0]?.id ?? null);
        }
      } catch (error) {
        console.error("Erro ao carregar ambientes:", error);
        if (montado) setErro("Não foi possível carregar os ambientes.");
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
    setModo("detalhe");
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
          desc: criado.amb_descricao ?? criado.descricao ?? novo.desc?.trim() ?? "—",
        },
        ...lista,
      ]);
      setNovo(null);
      abrir(id);
    } catch (error) {
      console.error("Erro ao cadastrar ambiente:", error);
      setErro("Não foi possível cadastrar o ambiente.");
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
      setErro("Não foi possível cadastrar o componente.");
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
      setErro("Não foi possível editar o ambiente.");
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
    <div className="ambientes-filtros">
      <label className="ambientes-busca">
        <Search size={18} />
        <input
          placeholder="Buscar por nome, bloco ou tipo..."
          value={f.q}
          onChange={set("q")}
        />
      </label>
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
    </div>
  );

  return (
    <div className="page page--ambientes">
      <style>{CSS}</style>

      <div className="page-ambientes">
        <div className="ambientes-titulo">
          {/* <Building2 size={40} color="#3b82f6" /> */}
          <div className="ambientes-titulo-texto">
            <h1>Ambientes</h1>
            <p>
              {modo === "grade"
                ? "Gerencie os ambientes cadastrados no sistema."
                : "Gerencie os ambientes cadastrados no sistema e visualize seus componentes."}
            </p>
          </div>

          <div className="ambientes-titulo-acoes">
            <div className="ambientes-btn-ico">
            <button
              className="ambientes-btn"
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
          </div>
        </div>

        {carregando && <p className="ambientes-vazio">Carregando ambientes...</p>}
        {erro && <p className="ambientes-erro">{erro}</p>}

        {modo === "grade" ? (
          <div className="ambientes-grade-wrap">
            <div>
              <section className="ambientes-painel">{Filtros}</section>
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
                  n={ambientes.filter((a) => a.tipo === "Laboratório").length}
                  label="Laboratórios"
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
                        <MapPin size={14} /> {sel.bloco} ·{" "}
                        {andarLabel(sel.andar)}
                      </p>
                      <p className="ambientes-desc">{sel.desc}</p>
                    </div>
                    <button className="ambientes-btn-sec" onClick={abrirEdicao}>
                      <Pencil size={15} /> Editar
                    </button>
                    <button className="ambientes-icon" aria-label="Mais ações">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="ambientes-abas" role="tablist">
                    {[
                      ["visao", Eye, "Visão geral"],
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
                      <div className="ambientes-comp-filtros">
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
                              <th>Patrimônio</th>
                              <th>Status</th>
                              <th>Última manutenção</th>
                              <th>Ações</th>
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
                                    aria-label={`Ações de ${c.nome}`}
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
                              ? "Este ambiente ainda não tem componentes cadastrados."
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
                      <ClipboardList size={18} /> Informações do Ambiente
                    </h3>
                    <Info l="Nome" v={sel.nome} />
                    <Info l="Tipo" v={sel.tipo} />
                    <Info l="Bloco" v={sel.bloco} />
                    <Info l="Andar" v={andarLabel(sel.andar)} />
                    <div className="ambientes-info">
                      <small>Status</small>
                      <Status ativo={sel.ativo} />
                    </div>
                    <Info l="Observações" v={sel.desc} />
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
            salvar="Salvar alterações"
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

/* ---------- Peças menores ---------- */

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
    <div className="ambientes-select" ref={ref}>
      <small>{label}</small>

      <button
        type="button"
        className={`ambientes-select__trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{atual[1]}</span>
        <span className="ambientes-select__caret">▾</span>
      </button>

      {open && (
        <div
          className="ambientes-select__menu"
          role="listbox"
          aria-label={label}
        >
          {options.map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={v === value}
              className={`ambientes-select__option ${v === value ? "is-selected" : ""}`}
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
      <small>{label}</small>
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
            <MapPin size={13} /> {a.bloco} · {andarLabel(a.andar)}
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

  // Trava a rolagem da página enquanto o modal estiver aberto
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
        Patrimônio
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
          placeholder="Ex.: Laboratório 03"
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
        Observações
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

/* ---------- Estilos Ambientes ---------- */

const CSS = `
.ambientes{--bg:#060f1f;--sup:#0a1830;--sup2:#0d2040;--borda:#16305a;--txt:#e8eefb;--mudo:#8ea3c7;--azul:#1d7bff;
min-height:100%;background:var(--bg);color:var(--txt);font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;font-size:14px}
.ambientes *{box-sizing:border-box}.ambientes h1,.ambientes h2,.ambientes h3,.ambientes h4,.ambientes p{margin:0}
.ambientes button,.ambientes input,.ambientes select{font:inherit;color:inherit}
.ambientes button{cursor:pointer}
.ambientes :focus-visible{outline:2px solid var(--azul);outline-offset:2px}
.ambientes-icon{background:none;border:0;padding:6px;border-radius:8px;display:grid;place-items:center;color:var(--txt)}.ambientes-icon:hover{background:var(--sup2)}
.ambientes-busca{display:flex;align-items:center;gap:10px;background:var(--panel-soft);border:1px solid var(--border); border-color:var(--border); border-radius:10px;padding:0 14px;height:42px;flex:1;min-width:180px;color:var(--mudo); gap:10px; box-sizing: border-box;}
.ambientes-busca input{background:transparent;border:none;outline:0;flex:1;min-width:0;color:var(--text)}
.ambientes-busca:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px var(--azul)}
.page-ambientes{padding:1 26px 40px}
.ambientes-titulo{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.ambientes-titulo h1{font-size:28px}.ambientes-titulo p{color:var(--mudo);margin-top:4px}.ambientes-titulo .ambientes-btn{margin-left:auto}
.ambientes-titulo-acoes{display:flex;flex-direction:column;align-items:flex-end;gap:12px;margin-left:auto;padding-top:16px}.ambientes-titulo-acoes .topbar__notifications-wrap{position:relative}
.ambientes-titulo-texto{display:flex;flex-direction:column;gap:4px;margin-top:-60px}.ambientes-titulo-texto h1{font-size:28px}.ambientes-titulo-texto p{color:var(--mudo);margin-top:3px}
.ambientes-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 14px 18px;
  min-height: 48px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
  position: static;
  background: var(--accent);
  color: #ffffff;
}
.ambientes-btn:active {
  transform: translateY(-10px);
}
.ambientes-btn:hover {
  background: #1d4fc4;
}
.ambientes-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ambientes-btn-ico {
  padding: 10px  0;
}
.ambientes-btn-sec {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 0 16px;
  height: 48px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
.ambientes-btn-sec:hover {
  background: #c81d1dc9;
}
.ambientes-btn-sec:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ambientes-painel{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:16px; box-shadow:var(--shadow-card);margin-bottom:20px;}
.ambientes-filtros{display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
.ambientes-select {position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 140px; padding: 0 2px; box-sizing: border-box; top: -10px;}
.ambientes-select__label,.ambientes-select small {font-size: 0.85rem;color: var(--mudo);padding-left: 2px;}
.ambientes-select select {background: var(--sup2); border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; height: 42px;}
.ambientes-select__trigger {width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--panel-input-border); border-radius: 14px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(148, 163, 184, 0.02));color: var(--text);cursor: pointer; text-align: left; font: inherit; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);}
.ambientes-select__trigger.is-open {border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.18);}
.ambientes-select__caret {color: var(--text-dim);font-size: 0.9rem;}
.ambientes-select__menu { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--shadow-card); z-index: 5; overflow: hidden; padding: 8px;}
.ambientes-select__option {display: block; width: calc(100% - 8px); margin: 2px 4px; border: 0; background: transparent; color: var(--text); text-align: left; padding: 10px 12px; font: inherit; font-weight: 500; cursor: pointer; border-radius: 10px; border-color: var(--accent) transition: background 0.12s ease, color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease;}
.ambientes-select__option:hover {background: var(--surface-3); color: var(--text);box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);}
.ambientes-select__option.is-selected {background: transparent; color: var(--text); box-shadow: none;}
.ambientes-select__option.is-selected:hover {background: var(--surface-3); color: var(--text); box-shadow: none;}
.ambientes-toggle{display:flex;gap:6px;margin-left:auto}
.ambientes-toggle button{background:var(--surface-1);border:1px solid var(--border);border-radius:8px;width:40px;height:40px;display:grid;place-items:center;color:var(--mudo)}
.ambientes-toggle .on{background:var(--azul);border-color:var(--azul);color:#fff}
.ambientes-grade-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}
.ambientes-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px;margin-top:16px}
.ambientes-card{background:var(--panel);border:1px solid var(--border);border-radius:12px; box-shadow:var(--shadow-card); padding:16px;display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:border-color .15s}
.ambientes-card:hover{border-color:var(--accent)}.ambientes-card.ativo{border-color:var(--azul);box-shadow:0 0 0 1px var(--azul)}
.ambientes-card-topo{display:flex;gap:12px;align-items:flex-start}.ambientes-card-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ambientes-card h3{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ambientes-mais{color:var(--mudo);flex:none}
.ambientes-tags{display:flex;gap:8px;flex-wrap:wrap}
.ambientes-local{display:flex;align-items:center;gap:5px;color:var(--mudo);font-size:12.5px}
.ambientes-card-meta{display:flex;justify-content:space-between;color:var(--mudo);border-top:1px solid var(--border);padding-top:10px}
.ambientes-card-meta span{display:flex;align-items:center;gap:6px}.ambientes-card-meta.fino{font-size:12px;border-top:0;padding-top:0}
.ambientes-card.compacto{padding:12px;gap:8px}.ambientes-card.compacto .ambientes-card-meta{border:0;padding:0}
.ambientes-thumb{border-radius:8px;display:grid;place-items:center;flex:none;border:1px solid var(--border)}
.ambientes-tag,.ambientes-pill{display:inline-block;padding:2px 10px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid transparent;white-space:nowrap}
.ambientes-pill.ok{background:#0f3d2a;color:#4ade80;border-color:#166a45}.ambientes-pill.err{background:#4a1519;color:#f87171;border-color:#7f1d24}
.ambientes-pill.warn{background:#4a3308;color:#fbbf24;border-color:#7a5510}.ambientes-pill.err-sol{background:#dc2626;color:#fff}
.ambientes-resumo h3{display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:14px}.ambientes-resumo h3:not(:first-child){margin-top:22px}
.ambientes-kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ambientes-kpi{background: linear-gradient(135deg,rgba(37, 99, 235, 0.09),rgba(37, 99, 235, 0.02));border: 1px solid var(--border);border-color: rgba(37, 99, 235, 0.35); border-radius:var(--radius-lg);padding:12px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center;min-height:86px}
.ambientes-kpi-ico{grid-row:span 2;width:38px;height:38px;border-radius:8px;display:grid;place-items:center}.ambientes-kpi b{font-size:22px}.ambientes-kpi small{color:var(--mudo);grid-column:1/-1;font-size:12px}
.ambientes-tipos{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.ambientes-tipos li{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)}.ambientes-tipos b{margin-left:auto}
.ambientes-chip-ico{width:30px;height:30px;border-radius:8px;display:inline-grid;place-items:center;background:#0b2a5c;color:#5aa2ff;flex:none}
.ambientes-dica{margin-top:20px;background: linear-gradient(135deg,rgba(37, 99, 235, 0.09),rgba(37, 99, 235, 0.02));border: 1px solid var(--border);border-color: rgba(37, 99, 235, 0.35);border-radius:var(--radius-lg);padding:14px}
.ambientes-dica h3{display:flex;gap:8px;align-items:center;color:#5aa2ff;margin-bottom:8px}.ambientes-dica p{color:var(--mudo);font-size:14px;line-height:1.5}
.ambientes-vazio{color:var(--mudo);padding:24px;text-align:center}
.ambientes-detalhe-wrap{display:grid;grid-template-columns:290px minmax(0,1fr) 300px;gap:16px;margin-top:16px;align-items:start}
.ambientes-lista{display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 260px);overflow:auto;padding:2px;scrollbar-color: #8c8c8c #f1f1f1;scrollbar-width: auto;}
.ambientes-det-head{display:flex;gap:18px;align-items:flex-start}.ambientes-det-info{flex:1;display:flex;flex-direction:column;gap:8px}.ambientes-det-info h2{font-size:24px}
.ambientes-desc{color:var(--txt)}
.ambientes-abas{display:flex;gap:6px;border-bottom:1px solid var(--border);margin:18px 0 16px}
.ambientes-abas button{display:flex;align-items:center;gap:8px;background:none;border:0;border-bottom:2px solid transparent;padding:10px 16px;color:var(--mudo);margin-bottom:-1px}
.ambientes-abas .on{color:#5aa2ff;border-color:var(--azul)}
.ambientes-comp-filtros{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.ambientes-comp-filtros .ambientes-busca{height:38px;flex:1;}.ambientes-comp-filtros .ambientes-btn{height:38px;padding:0 14px;font-size:13px}
.ambientes-tabela-wrap{background: var(--surface);border: 1px solid var(--border);border-radius: 18px;box-shadow: var(--shadow-card);z-index: 5;overflow: hidden;padding: 8px;overflow-x:auto;overflow-y:scroll;scrollbar-color: #8c8c8c #f1f1f1;scrollbar-width: auto;height:355px;border:1px solid var(--border);border-radius:10px}
.ambientes-tabela-wrap::-webkit-scrollbar {width: 17px;}
/* Trilho */
.ambientes-tabela-wrap::-webkit-scrollbar-track {background: #f1f1f1;}
/* Polegar (parte que arrasta) */
.ambientes-tabela-wrap::-webkit-scrollbar-thumb {background: #8c8c8c;border-radius: 4px;border: 3px solid #f1f1f1;}
.ambientes-tabela-wrap::-webkit-scrollbar-thumb:hover {background: #6b6b6b;}
/* Botões das setas */
.minha-area::-webkit-scrollbar-button:single-button {height: 17px;background-color: #f1f1f1;background-repeat: no-repeat;background-position: center;background-size: 10px;}
/* Seta para cima */
.minha-area::-webkit-scrollbar-button:single-button:vertical:decrement {background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><polygon points='5,2 9,8 1,8' fill='%23777'/></svg>");}
/* Seta para baixo */
.minha-area::-webkit-scrollbar-button:single-button:vertical:increment {background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><polygon points='1,2 9,2 5,8' fill='%23777'/></svg>");}
.ambientes-tabela {
  --tb-border: #e2e8f0;
  --tb-hover: #e8ecf0;
  --tb-text: #0a0a0a;
  --tb-muted: #64748b;
  --tb-icon-bg: #dbeafe;
  --tb-icon-color: #2563eb;

  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
  color: var(--tb-text);
}

.dark .ambientes-tabela,
[data-theme="dark"] .ambientes-tabela {
  --tb-border: #1e293b;
  --tb-hover: #15294d;
  --tb-text: #e2e8f0;
  --tb-muted: #94a3b8;
  --tb-icon-bg: #1e3a8a;
  --tb-icon-color: #60a5fa;
}

.ambientes-tabela th {
  color: var(--tb-text);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--tb-border);
}

.ambientes-tabela td {
  color: var(--tb-text);
  padding: 12px 16px;
  border-bottom: 1px solid var(--tb-border);
}

.ambientes-tabela tbody tr:hover {
  background: var(--tb-hover);
}

.ambientes-tabela tbody tr:hover td {
  color: var(--tb-text);
}

/* Ícone do componente */
.ambientes-tabela .ambientes-icone {
  background: var(--tb-icon-bg);
  color: var(--tb-icon-color);
  border-radius: 8px;
}
.ambientes-comp-nome{display:flex;align-items:center;gap:10px}
.ambientes-rodape-tabela{color:var(--mudo);font-size:12.5px;margin-top:10px}
.ambientes-visao{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.ambientes-info{display:flex;flex-direction:column;gap:4px;padding:10px 0}.ambientes-info small{color:var(--mudo)}.ambientes-info span{line-height:1.4}
.ambientes-col-dir{display:flex;flex-direction:column;gap:3px}
.ambientes-col-dir h3{display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:8px}.ambientes-col-dir h3 a{margin-left:auto;font-size:12px;color:#5aa2ff;text-decoration:none}
.ambientes-modal-fundo{position:fixed;inset:0;background:#000a;display:grid;place-items:center;z-index:50;padding:16px;overflow:hidden;}
.ambientes-modal {
  --modal-bg: #ffffff;
  --modal-bg-2: #f8fafc;
  --modal-border: #e2e8f0;
  --modal-text: #0f172a;
  --modal-muted: #64748b;
  --modal-accent: #2563eb;
  --modal-accent-text: #ffffff;
  color-scheme: light;

  background: var(--modal-bg);
  color: var(--modal-text);
  border: 1px solid var(--modal-border);
  border-radius: 14px;
  padding: 22px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
}

/* Tema escuro: deixe só o seletor que o seu app usa */
.dark .ambientes-modal,
[data-theme="dark"] .ambientes-modal {
  --modal-bg: #0f172a;
  --modal-bg-2: #1e293b;
  --modal-border: #334155;
  --modal-text: #e2e8f0;
  --modal-muted: #94a3b8;
  --modal-accent: #3b82f6;
  --modal-accent-text: #ffffff;
  color-scheme: dark;
}

.ambientes-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ambientes-modal form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ambientes-modal label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--modal-muted);
  flex: 1;
}

.ambientes-modal input,
.ambientes-modal select,
.ambientes-modal textarea {
  background: var(--modal-bg-2);
  border: 1px solid var(--modal-border);
  border-radius: 8px;
  color: var(--modal-text);
}

.ambientes-modal input,
.ambientes-modal select {
  height: 40px;
  padding: 0 12px;
}

.ambientes-modal textarea {
  padding: 10px 12px;
  resize: vertical;
  min-height: 72px;
}

.ambientes-modal input::placeholder,
.ambientes-modal textarea::placeholder {
  color: var(--modal-muted);
  opacity: 0.7;
}

.ambientes-modal input:focus,
.ambientes-modal select:focus,
.ambientes-modal textarea:focus {
  outline: none;
  border-color: var(--modal-accent);
}

/* Botões */
.ambientes-modal button {
  background: transparent;
  color: var(--modal-text);
  border: 1px solid var(--modal-border);
  border-radius: 8px;
  height: 48px;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
}

.ambientes-modal button:hover {
  background: var(--modal-bg-2);
}

.ambientes-modal button[type="submit"] {
  background: var(--modal-accent);
  color: var(--modal-accent-text);
  border-color: var(--modal-accent);
}

.ambientes-modal button[type="submit"]:hover {
  filter: brightness(1.1);
  background: var(--modal-accent);
}

.ambientes-modal .ambientes-btn-sec {
  background: #dc2626;
  border: 1px solid #dc2626;
  color: #ffffff;
}

.ambientes-modal .ambientes-btn-sec:hover {
  background: #b91c1ca9;
  border: 1px solid #b91c1ca9;
  color: #ffffff;
}

.ambientes-modal .ambientes-btn-sec:focus-visible {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
}

/* Botão de fechar (X) */
.ambientes-modal-head button {
  background: transparent;
  border: none;
  color: var(--modal-muted);
  height: auto;
  padding: 4px 8px;
  font-size: 20px;
}
.ambientes-erro{color:#f87171;font-size:12.5px}
.ambientes-linha{display:flex;gap:12px}.ambientes-modal-acoes{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}
.topbar__notifications-wrap{position:relative}
.topbar__notifications{
  position:absolute;
  top:calc(100% + 8px);
  right:0;
  z-index:20;
}
@media(max-width:1280px){.ambientes-detalhe-wrap{grid-template-columns:270px minmax(0,1fr)}.ambientes-col-dir{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}}
@media(max-width:1000px){.ambientes-grade-wrap{grid-template-columns:1fr}}
@media(max-width:760px){.ambientes-detalhe-wrap{grid-template-columns:1fr}.ambientes-lista{max-height:none;flex-direction:row;overflow-x:auto}.ambientes-lista .ambientes-card{min-width:260px}.ambientes-col-dir{grid-template-columns:1fr}.ambientes-titulo{flex-wrap:wrap}.ambientes-titulo .ambientes-btn{margin-left:0}.ambientes-det-head{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.ambientes *{transition:none!important}}
`;
