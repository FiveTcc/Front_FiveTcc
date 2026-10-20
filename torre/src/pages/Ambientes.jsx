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
  History,
} from "lucide-react";

/* ---------- Dados de exemplo (contagens são sempre derivadas) ---------- */

const TIPOS = {
  Laboratório: { cor: "#3b82f6", Icon: FlaskConical },
  Sala: { cor: "#8b5cf6", Icon: Users },
  Escritório: { cor: "#f59e0b", Icon: Briefcase },
  Biblioteca: { cor: "#c2763a", Icon: BookOpen },
  Depósito: { cor: "#64748b", Icon: Package },
  Físico: { cor: "#14b8a6", Icon: MapPin },
};

const POOL = [
  ["Computador 01", "Computador", Monitor, "Funcionando", "12/08/2026"],
  ["Computador 02", "Computador", Monitor, "Com problema", "08/09/2026"],
  ["Computador 03", "Computador", Monitor, "Funcionando", "12/08/2026"],
  ["Impressora HP", "Impressora", Printer, "Funcionando", "05/08/2026"],
  ["Projetor Epson", "Projetor", Projector, "Em manutenção", "28/08/2026"],
  ["Roteador", "Rede", Router, "Funcionando", "15/07/2026"],
  ["Switch", "Rede", Network, "Funcionando", "15/07/2026"],
  ["Mesa de Som", "Áudio", Speaker, "Funcionando", "20/07/2026"],
  ["Ar Condicionado", "Climatização", Wind, "Funcionando", "10/03/2026"],
  ["Caixa de Som", "Áudio", Speaker, "Funcionando", "10/08/2026"],
  ["Computador 04", "Computador", Monitor, "Funcionando", "12/08/2026"],
  ["Computador 05", "Computador", Monitor, "Funcionando", "12/08/2026"],
];

const AMBIENTES_INICIAIS = [
  {
    id: "lab01",
    nome: "Laboratório 01",
    tipo: "Laboratório",
    bloco: "Bloco A",
    andar: 1,
    ativo: true,
    criado: "12/03/2025",
    por: "João Silva",
    comps: 12,
    desc: "Ambiente destinado a aulas práticas de informática e desenvolvimento.",
  },
  {
    id: "sala05",
    nome: "Sala 05",
    tipo: "Sala",
    bloco: "Bloco A",
    andar: 1,
    ativo: true,
    criado: "10/03/2025",
    por: "Maria Souza",
    comps: 8,
    desc: "Sala de aula com mesas e projetor.",
  },
  {
    id: "lab02",
    nome: "Laboratório 02",
    tipo: "Laboratório",
    bloco: "Bloco B",
    andar: 1,
    ativo: true,
    criado: "08/03/2025",
    por: "Carlos Lima",
    comps: 10,
    desc: "Laboratório de redes e infraestrutura.",
  },
  {
    id: "esc",
    nome: "Escritório da Direção",
    tipo: "Escritório",
    bloco: "Bloco C",
    andar: 0,
    ativo: true,
    criado: "05/03/2025",
    por: "Ana Costa",
    comps: 6,
    desc: "Escritório administrativo da direção.",
  },
  {
    id: "bib",
    nome: "Biblioteca",
    tipo: "Biblioteca",
    bloco: "Bloco C",
    andar: 0,
    ativo: true,
    criado: "02/03/2025",
    por: "João Silva",
    comps: 10,
    desc: "Acervo, salas de estudo e computadores de consulta.",
  },
  {
    id: "cor",
    nome: "Corredor Principal",
    tipo: "Físico",
    bloco: "Bloco A",
    andar: 0,
    ativo: true,
    criado: "28/02/2025",
    por: "Fernanda Alves",
    comps: 4,
    desc: "Circulação principal do Bloco A.",
  },
  {
    id: "qui",
    nome: "Laboratório de Química",
    tipo: "Laboratório",
    bloco: "Bloco B",
    andar: 2,
    ativo: true,
    criado: "20/02/2025",
    por: "Rafael Mendes",
    comps: 9,
    desc: "Aulas práticas de química e ciências.",
  },
  {
    id: "sala12",
    nome: "Sala 12",
    tipo: "Sala",
    bloco: "Bloco D",
    andar: 1,
    ativo: true,
    criado: "18/02/2025",
    por: "Juliana Martins",
    comps: 7,
    desc: "Sala de aula convencional.",
  },
  {
    id: "alm",
    nome: "Almoxarifado",
    tipo: "Depósito",
    bloco: "Bloco E",
    andar: 0,
    ativo: false,
    criado: "15/02/2025",
    por: "Thiago Pereira",
    comps: 5,
    desc: "Estoque de materiais e equipamentos reserva.",
  },
];

const ch = (id, env, titulo, status, data) => ({
  id,
  env,
  titulo,
  status,
  data,
});
const CHAMADOS = [
  ch("0248", "lab01", "Computador não liga", "Aberto", "09/09/2026"),
  ch("0231", "lab01", "Projetor sem imagem", "Em andamento", "05/09/2026"),
  ch("0217", "lab01", "Teclado com defeito", "Resolvido", "01/09/2026"),
  ch("0209", "lab01", "Rede lenta nas bancadas", "Resolvido", "26/08/2026"),
  ch("0198", "lab01", "Ar condicionado com ruído", "Resolvido", "19/08/2026"),
  ch("0244", "sala05", "Lâmpada queimada", "Aberto", "08/09/2026"),
  ch("0226", "sala05", "Cadeira quebrada", "Resolvido", "02/09/2026"),
  ch("0240", "lab02", "Switch reiniciando", "Em andamento", "07/09/2026"),
  ch("0233", "lab02", "Monitor sem sinal", "Aberto", "06/09/2026"),
  ch("0211", "lab02", "Mouse sem resposta", "Resolvido", "28/08/2026"),
  ch("0238", "esc", "Impressora sem toner", "Aberto", "07/09/2026"),
  ch("0229", "bib", "Leitor de código travado", "Em andamento", "03/09/2026"),
  ch("0222", "bib", "Computador de consulta lento", "Resolvido", "30/08/2026"),
  ch("0215", "bib", "Wi-Fi instável", "Resolvido", "27/08/2026"),
  ch("0242", "qui", "Exaustor sem funcionar", "Aberto", "08/09/2026"),
  ch("0219", "qui", "Bancada com tomada solta", "Resolvido", "31/08/2026"),
  ch("0236", "sala12", "Projetor sem cabo HDMI", "Aberto", "05/09/2026"),
  ch("0205", "alm", "Porta sem fechadura", "Em andamento", "22/08/2026"),
  ch("0201", "alm", "Estante instável", "Resolvido", "20/08/2026"),
];

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
const STATUS_COMP = ["Funcionando", "Com problema", "Em manutenção"];

function componentesDe(env, idx) {
  return Array.from({ length: env.comps }, (_, i) => {
    const [nome, tipo, Icon, status, manut] = POOL[i % POOL.length];
    return {
      nome,
      tipo,
      Icon,
      manut,
      status: env.id === "lab01" ? status : "Funcionando",
      pat: `PAT-${String(idx * 100 + i + 1).padStart(4, "0")}`,
    };
  });
}

/* ---------- Página: renderizada dentro do <Outlet /> do layout ---------- */

export default function Ambientes() {
  const [ambientes, setAmbientes] = useState(AMBIENTES_INICIAIS);
  const [modo, setModo] = useState("grade"); // "grade" | "detalhe"
  const [selId, setSelId] = useState("lab01");
  const [aba, setAba] = useState("componentes");
  const [f, setF] = useState({
    q: "",
    tipo: "",
    bloco: "",
    andar: "",
    status: "",
  });
  const [cf, setCf] = useState({ q: "", tipo: "", status: "" });
  const [novo, setNovo] = useState(null);
  const [edit, setEdit] = useState(null);
  const [extras, setExtras] = useState({}); // componentes adicionados, por id de ambiente
  const [novoComp, setNovoComp] = useState(null);

  const chamadosDe = (id) => CHAMADOS.filter((c) => c.env === id);
  const qtdDe = (a) => a.comps + (extras[a.id]?.length ?? 0);
  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));

  const filtrados = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return ambientes.filter(
      (a) =>
        (!q ||
          [a.nome, a.bloco, a.tipo].some((s) => s.toLowerCase().includes(q))) &&
        (!f.tipo || a.tipo === f.tipo) &&
        (!f.bloco || a.bloco === f.bloco) &&
        (f.andar === "" || String(a.andar) === f.andar) &&
        (!f.status || (f.status === "ativo") === a.ativo),
    );
  }, [ambientes, f]);

  const blocos = [...new Set(ambientes.map((a) => a.bloco))].sort();
  const andares = [...new Set(ambientes.map((a) => a.andar))].sort();
  const contTipos = Object.keys(TIPOS)
    .map((t) => [t, ambientes.filter((a) => a.tipo === t).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const sel = ambientes.find((a) => a.id === selId) || filtrados[0];
  const selIdx = ambientes.findIndex((a) => a.id === sel?.id);
  const comps = useMemo(
    () =>
      sel ? [...componentesDe(sel, selIdx), ...(extras[sel.id] || [])] : [],
    [sel, selIdx, extras],
  );
  const compsFiltrados = comps.filter(
    (c) =>
      (!cf.q || c.nome.toLowerCase().includes(cf.q.toLowerCase())) &&
      (!cf.tipo || c.tipo === cf.tipo) &&
      (!cf.status || c.status === cf.status),
  );

  const abrir = (id) => {
    setSelId(id);
    setAba("componentes");
    setModo("detalhe");
  };

  const salvarNovo = () => {
    if (!novo.nome.trim()) return;
    const id = `novo${Date.now()}`;
    setAmbientes([
      {
        id,
        nome: novo.nome.trim(),
        tipo: novo.tipo,
        bloco: novo.bloco,
        andar: Number(novo.andar),
        ativo: true,
        criado: new Date().toLocaleDateString("pt-BR"),
        por: "João Silva",
        comps: 0,
        desc: novo.desc?.trim() || "Ambiente recém-criado.",
      },
      ...ambientes,
    ]);
    setNovo(null);
    abrir(id);
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

  const salvarEdicao = () => {
    if (!edit.nome.trim()) return;
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

  const salvarComp = () => {
    if (!novoComp.nome.trim()) return;
    const c = {
      id: `x${Date.now()}`,
      nome: novoComp.nome.trim(),
      tipo: novoComp.tipo,
      Icon: ICONES_COMP[novoComp.tipo] || Package,
      status: novoComp.status,
      manut: "—",
      pat: novoComp.pat.trim() || `PAT-${String(Date.now()).slice(-6)}`,
    };
    setExtras({ ...extras, [sel.id]: [...(extras[sel.id] || []), c] });
    setCf({ q: "", tipo: "", status: "" });
    setNovoComp(null);
  };

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
const notificacoesRef = useRef(null);

const notificacoes = useMemo(
  () =>
    CHAMADOS.filter((c) => c.status === "Aberto")
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        titulo: `Chamado #${c.id}: ${c.titulo}`,
        tempo: c.data,
      })),
  [],
);

useEffect(() => {
  if (!mostrarNotificacoes) return;
  const onDown = (e) => {
    if (notificacoesRef.current && !notificacoesRef.current.contains(e.target))
      setMostrarNotificacoes(false);
  };
  const onKey = (e) => e.key === "Escape" && setMostrarNotificacoes(false);
  document.addEventListener("mousedown", onDown);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("mousedown", onDown);
    document.removeEventListener("keydown", onKey);
  };
}, [mostrarNotificacoes]);

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
        opts={Object.keys(TIPOS).map((t) => [t, t])}
      />
      <Select
        label="Bloco"
        value={f.bloco}
        onChange={set("bloco")}
        opts={blocos.map((b) => [b, b])}
      />
      <Select
        label="Andar"
        value={f.andar}
        onChange={set("andar")}
        opts={andares.map((a) => [String(a), andarLabel(a)])}
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
            <div className="topbar__notifications-wrap" ref={notificacoesRef}>
              <button
                type="button"
                className="topbar__icon-button"
                aria-label={
                  mostrarNotificacoes
                    ? "Fechar notificações"
                    : "Abrir notificações"
                }
                aria-expanded={mostrarNotificacoes}
                onClick={() => setMostrarNotificacoes((valor) => !valor)}
              >
                🕭
              </button>

              {mostrarNotificacoes && (
                <div
                  className="topbar__notifications"
                  role="menu"
                  aria-label="Notificações"
                >
                  <div className="topbar__notifications-header">
                    <strong>Notificações</strong>
                    <span>{notificacoes.length}</span>
                  </div>

                  {notificacoes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="topbar__notification-item"
                      onClick={() => setMostrarNotificacoes(false)}
                    >
                      <span>{item.titulo}</span>
                      <small>{item.tempo}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                    chamados={chamadosDe(a.id).length}
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
                  const { cor, Icon } = TIPOS[t];
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
                    chamados={chamadosDe(a.id).length}
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
                      ["chamados", ClipboardList, "Chamados"],
                      ["historico", History, "Histórico"],
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
                          opts={STATUS_COMP.map((s) => [s, s])}
                        />

                        <button
                          className="ambientes-btn"
                          onClick={() =>
                            setNovoComp({
                              nome: "",
                              tipo: "Computador",
                              status: "Funcionando",
                              pat: "",
                            })
                          }
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
                            {compsFiltrados.map((c) => (
                              <tr key={c.id ?? c.pat}>
                                <td>
                                  <span className="ambientes-comp-nome">
                                    <span className="ambientes-chip-ico">
                                      <c.Icon size={16} />
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
                            ))}
                          </tbody>
                        </table>
                        {compsFiltrados.length === 0 && (
                          <p className="ambientes-vazio">
                            {comps.length === 0
                              ? "Este ambiente ainda não tem componentes. Adicione o primeiro."
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
                      <Info l="Chamados" v={chamadosDe(sel.id).length} />
                      <Info l="Criado em" v={`${sel.criado} por ${sel.por}`} />
                    </div>
                  )}

                  {aba === "chamados" && (
                    <ListaChamados itens={chamadosDe(sel.id)} />
                  )}

                  {aba === "historico" && (
                    <ul className="ambientes-hist">
                      {[
                        ...chamadosDe(sel.id).map((c) => ({
                          t: `Chamado #${c.id}: ${c.titulo} (${c.status.toLowerCase()})`,
                          d: c.data,
                        })),
                        { t: `Ambiente criado por ${sel.por}`, d: sel.criado },
                      ].map((h, i) => (
                        <li key={i}>
                          <Calendar size={14} /> <span>{h.t}</span>
                          <time>{h.d}</time>
                        </li>
                      ))}
                    </ul>
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
                  <section className="ambientes-painel">
                    <h3>
                      Últimos chamados{" "}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setAba("chamados");
                        }}
                      >
                        Ver todos
                      </a>
                    </h3>
                    <ListaChamados
                      itens={chamadosDe(sel.id).slice(0, 3)}
                      mini
                    />
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
            onChange={setEdit}
            onCancel={() => setEdit(null)}
            onSubmit={salvarEdicao}
            salvar="Salvar alterações"
          />
        </Modal>
      )}

      {novoComp && (
        <Modal titulo="Adicionar componente" onClose={() => setNovoComp(null)}>
          <FormComponente
            valor={novoComp}
            onChange={setNovoComp}
            existentes={comps}
            onCancel={() => setNovoComp(null)}
            onSubmit={salvarComp}
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
  const { cor, Icon } = TIPOS[tipo];
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
      background: TIPOS[tipo].cor + "33",
      color: TIPOS[tipo].cor,
      borderColor: TIPOS[tipo].cor + "66",
    }}
  >
    {tipo}
  </span>
);
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

function CardAmbiente({ a, qtd, chamados, onOpen, compacto, ativo }) {
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
        <span>
          <ClipboardList size={15} /> {chamados}{" "}
          {chamados === 1 ? "chamado" : "chamados"}
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

function ListaChamados({ itens, mini }) {
  if (itens.length === 0)
    return <p className="ambientes-vazio">Nenhum chamado neste ambiente.</p>;
  const cls = { Aberto: "err", "Em andamento": "warn", Resolvido: "ok" };
  return (
    <ul className={`ambientes-chamados ${mini ? "mini" : ""}`}>
      {itens.map((c) => (
        <li key={c.id}>
          <a href="#" onClick={(e) => e.preventDefault()}>
            #{c.id}
          </a>
          <span>{c.titulo}</span>
          <span className={`ambientes-pill ${cls[c.status]}`}>{c.status}</span>
          <time>{c.data}</time>
        </li>
      ))}
    </ul>
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

function FormAmbiente({ valor, onChange, onCancel, onSubmit, salvar, edicao }) {
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
          {Object.keys(TIPOS).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <div className="ambientes-linha">
        <label>
          Bloco
          <select value={valor.bloco} onChange={up("bloco")}>
            {["Bloco A", "Bloco B", "Bloco C", "Bloco D", "Bloco E"].map(
              (b) => (
                <option key={b}>{b}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Andar
          <select value={valor.andar} onChange={up("andar")}>
            {[0, 1, 2, 3].map((a) => (
              <option key={a} value={a}>
                {andarLabel(a)}
              </option>
            ))}
          </select>
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

function FormComponente({ valor, onChange, existentes, onCancel, onSubmit }) {
  const up = (k) => (e) => onChange({ ...valor, [k]: e.target.value });
  const dup =
    !!valor.pat.trim() &&
    existentes.some(
      (c) => c.pat.toLowerCase() === valor.pat.trim().toLowerCase(),
    );
  const ok = !!valor.nome.trim() && !dup;
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
          placeholder="Ex.: Computador 06"
        />
      </label>
      <div className="ambientes-linha">
        <label>
          Tipo
          <select value={valor.tipo} onChange={up("tipo")}>
            {Object.keys(ICONES_COMP).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={valor.status} onChange={up("status")}>
            {STATUS_COMP.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Patrimônio
        <input
          value={valor.pat}
          onChange={up("pat")}
          placeholder="Deixe vazio para gerar automaticamente"
        />
      </label>
      {dup && (
        <p className="ambientes-erro">
          Já existe um componente com esse patrimônio neste ambiente.
        </p>
      )}
      <Acoes onCancel={onCancel} salvar="Adicionar componente" ok={ok} />
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
.ambientes-chamados,.ambientes-hist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ambientes-chamados li{display:grid;grid-template-columns:60px 1fr auto 90px;gap:12px;align-items:center;background:var(--sup2);border-radius:8px;padding:10px 12px}
.ambientes-chamados a{color:#5aa2ff;text-decoration:none;font-weight:600}.ambientes-chamados time,.ambientes-hist time{color:var(--mudo);font-size:12.5px;text-align:right}
.ambientes-chamados.mini li{grid-template-columns:auto 1fr;gap:4px 10px}.ambientes-chamados.mini .ambientes-pill{justify-self:start}.ambientes-chamados.mini time{text-align:left;grid-column:2}
.ambientes-hist li{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)}.ambientes-hist span{flex:1}
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
