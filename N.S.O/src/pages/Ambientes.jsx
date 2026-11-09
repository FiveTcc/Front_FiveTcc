import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect";
// import "../styles/Ambientes.module.css";
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

/* ---------- Formatação e configuração visual ---------- */

// Converte o andar recebido da API para um número consistente.
const normalizarAndar = (valor) => {
  const numero = Number(
    String(valor ?? 0)
      .toString()
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(numero) ? numero : 0;
};

// Exibe o térreo com nome próprio e os demais andares em formato ordinal.
const andarLabel = (n) => {
  const andar = normalizarAndar(n);
  return andar === 0 ? "Térreo" : `${andar}º Andar`;
};

// Relaciona cada tipo de componente ao ícone usado nos cartões.
const ICONES_COMP = {
  Computador: Monitor,
  Impressora: Printer,
  Projetor: Projector,
  Rede: Network,
  Áudio: Speaker,
  Climatização: Wind,
  Outro: Package,
};

// Adapta os campos do componente para os cartões e filtros da página.
function normalizarComponente(item) {
  const componente = item?.componente || item || {};
  return {
    ...componente,
    id: componente.compo_id ?? componente.id_comp ?? componente.id,
    nome: componente.compo_nome ?? componente.nome ?? "",
    tipo:
      componente.compo_tipo_nome ??
      componente.compo_tipo ??
      componente.tipo ??
      "",
    pat:
      componente.compo_patrimonio ??
      componente.patrimonio ??
      componente.pat ??
      "—",
    status: componente.compo_status ?? componente.status ?? "—",
    manut:
      componente.compo_ultima_manutencao ??
      componente.ultima_manutencao ??
      componente.manut ??
      "—",
  };
}

// Interpreta formatos booleanos e textuais de status enviados pela API.
function normalizarStatusAmbiente(valor) {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1 || valor > 0;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    if (
      ["ativo", "active", "true", "1", "habilitado", "enabled"].includes(texto)
    )
      return true;
    if (
      [
        "inativo",
        "inactive",
        "false",
        "0",
        "desabilitado",
        "disabled",
      ].includes(texto)
    )
      return false;
    return (
      texto.includes("ativo") ||
      texto.includes("enabled") ||
      texto.includes("true")
    );
  }
  return false;
}

// Verifica se o status do ambiente corresponde ao filtro selecionado.
function atendeFiltroStatus(valor, filtro) {
  if (!filtro) return true;
  const statusAtual = normalizarStatusAmbiente(valor);
  return (filtro === "ativo") === statusAtual;
}
/* ---------- Página: renderizada dentro do <Outlet /> do layout ---------- */

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
  // Obtém a quantidade de componentes a partir dos formatos conhecidos.
  const qtdDe = (a) =>
    Number(
      a?.comps ??
        a?.componentes_count ??
        a?.quantidade_componentes ??
        a?.qtd_componentes ??
        a?.total_componentes ??
        a?.componentes?.length ??
        0,
    );
  // Cria atualizadores de filtro que aceitam eventos ou valores diretos.
  const set = (k) => (v) => {
    const valor =
      v && typeof v === "object" && "target" in v ? v.target.value : v;
    setF((cur) => ({ ...cur, [k]: valor }));
  };

  // Carrega os ambientes e complementa cada um com seus componentes.
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
            andar: normalizarAndar(item.amb_andar ?? item.andar ?? 0),
            ativo: normalizarStatusAmbiente(
              item.amb_status ?? item.amb_ativo ?? item.status ?? item.ativo,
            ),
            criado:
              item.amb_data_criacao ?? item.criado_em ?? item.criado ?? "—",
            por: item.usuario?.nome ?? item.por ?? "—",
            comps: Number(
              item.componentes_count ??
                item.comps ??
                item.quantidade_componentes ??
                item.qtd_componentes ??
                item.total_componentes ??
                (Array.isArray(item.componentes)
                  ? item.componentes.length
                  : 0) ??
                0,
            ),
            componentes: Array.isArray(item.componentes)
              ? item.componentes
              : [],
            desc: item.amb_descricao ?? item.descricao ?? item.desc ?? "—",
          }));

        if (!montado) return;

        const listaComContagem = await Promise.all(
          lista.map(async (ambiente) => {
            if (!ambiente.nome) return ambiente;

            try {
              const respostaComponentes =
                await componenteService.buscarPorAmbiente(ambiente.nome);
              const dadosComponentes = Array.isArray(respostaComponentes)
                ? respostaComponentes
                : respostaComponentes?.componentes ||
                  respostaComponentes?.data ||
                  respostaComponentes?.componente ||
                  [];
              const componentes = (
                Array.isArray(dadosComponentes)
                  ? dadosComponentes
                  : [dadosComponentes]
              )
                .filter(Boolean)
                .map(normalizarComponente);

              return {
                ...ambiente,
                comps: componentes.length,
                componentes,
              };
            } catch (error) {
              console.warn(
                `Não foi possível carregar contagem de componentes do ambiente ${ambiente.nome}:`,
                error,
              );
              return ambiente;
            }
          }),
        );

        setAmbientes(listaComContagem);
        setSelId((atual) => atual ?? listaComContagem[0]?.id ?? null);
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

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);

  // troque pelos dados reais (API/contexto) quando tiver
  const notificacoes = [
    { id: 1, titulo: "Novo chamado aberto", tempo: "há 5 min" },
    { id: 2, titulo: "Chamado concluído", tempo: "há 1 h" },
  ];

  // fecha ao clicar fora ou apertar Esc
  // Sincroniza os detalhes do ambiente selecionado com a lista carregada.
  useEffect(() => {
    const fechar = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      if (e.type === "mousedown" && notificacoesRef.current?.contains(e.target))
        return;
      setMostrarNotificacoes(false);
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, []);

  const filtrados = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return ambientes.filter((a) => {
      const nome = String(a.nome ?? "").toLowerCase();
      const bloco = String(a.bloco ?? "").toLowerCase();
      const tipo = String(a.tipo ?? "").toLowerCase();

      const atendeTexto = !q || [nome, bloco, tipo].some((s) => s.includes(q));
      const atendeTipo = !f.tipo || String(a.tipo ?? "") === String(f.tipo);
      const atendeBloco = !f.bloco || String(a.bloco ?? "") === String(f.bloco);
      const atendeStatus = atendeFiltroStatus(a.ativo, f.status);

      return atendeTexto && atendeTipo && atendeBloco && atendeStatus;
    });
  }, [ambientes, f]);

  const blocos = [...new Set(ambientes.map((a) => a.bloco))].sort();
  const tiposAmbiente = [
    ...new Set(ambientes.map((a) => a.tipo).filter(Boolean)),
  ].sort();
  const contTipos = tiposAmbiente
    .map((t) => [t, ambientes.filter((a) => a.tipo === t).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const sel = ambientes.find((a) => a.id === selId) || filtrados[0];
  // Atualiza os dados auxiliares quando o ambiente selecionado muda.
  useEffect(() => {
    if (!sel?.nome) {
      setComponentes([]);
      return undefined;
    }

    let montado = true;
    setCarregandoComponentes(true);
    componenteService
      .buscarPorAmbiente(sel.nome)
      .then((resposta) => {
        const dados = Array.isArray(resposta)
          ? resposta
          : resposta?.componentes ||
            resposta?.data ||
            resposta?.componente ||
            [];
        const lista = (Array.isArray(dados) ? dados : [dados])
          .filter(Boolean)
          .map(normalizarComponente);

        if (montado) {
          setComponentes(lista);
          setAmbientes((atual) =>
            atual.map((a) =>
              a.id === sel.id
                ? { ...a, comps: lista.length, componentes: lista }
                : a,
            ),
          );
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

  // Atualiza a lista de tipos disponíveis para cadastro de componentes.
  useEffect(() => {
    componenteTipoService
      .listarComponenteTipo()
      .then((resposta) => {
        const dados = Array.isArray(resposta)
          ? resposta
          : resposta?.tipos || resposta?.data || [];
        setTiposComponentes(
          (Array.isArray(dados) ? dados : [dados]).filter(Boolean),
        );
      })
      .catch((error) =>
        console.error("Erro ao carregar tipos de componentes:", error),
      );
  }, []);

  const comps = componentes;
  const totalComponentesDoAmbiente = Number(sel?.comps ?? comps.length ?? 0);
  const tiposComponente = [
    ...new Set(comps.map((c) => c.tipo).filter(Boolean)),
  ].sort();
  const statusComponentes = [
    ...new Set(comps.map((c) => c.status).filter(Boolean)),
  ].sort();
  const compsFiltrados = comps.filter((c) => {
    const nome = String(c.nome ?? "").toLowerCase();
    const tipo = String(c.tipo ?? "").toLowerCase();
    const status = String(c.status ?? "").toLowerCase();
    const busca = String(cf.q ?? "")
      .trim()
      .toLowerCase();

    const atendeBusca = !busca || nome.includes(busca) || tipo.includes(busca);
    const atendeTipo = !cf.tipo || String(c.tipo ?? "") === String(cf.tipo);
    const atendeStatus =
      !cf.status || status === String(cf.status).toLowerCase();

    return atendeBusca && atendeTipo && atendeStatus;
  });

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
          andar: normalizarAndar(
            criado.amb_andar ?? criado.andar ?? novo.andar,
          ),
          ativo: normalizarStatusAmbiente(
            criado.amb_status ??
              criado.amb_ativo ??
              criado.status ??
              criado.ativo,
          ),
          comps: 0,
          componentes: [],
          desc:
            criado.amb_descricao ??
            criado.descricao ??
            novo.desc?.trim() ??
            "—",
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
    const nome = String(novoComponente?.nome ?? "").trim();
    const tipoId = Number(novoComponente?.tipoId);
    const idAmbiente = Number(sel?.id);

    if (
      !nome ||
      !novoComponente?.tipoId ||
      !Number.isFinite(tipoId) ||
      !Number.isFinite(idAmbiente) ||
      salvandoComponente
    )
      return;

    try {
      setSalvandoComponente(true);
      const payload = {
        compo_nome: nome,
        compo_tipo_id: tipoId,
        id_amb: idAmbiente,
      };

      await componenteService.cadastrarComponente(payload);
      setNovoComponente(null);
      setCf({ q: "", tipo: "", status: "" });
      const resposta = await componenteService.buscarPorAmbiente(sel.nome);
      const dados = Array.isArray(resposta)
        ? resposta
        : resposta?.componentes || resposta?.data || [];
      const lista = (Array.isArray(dados) ? dados : [dados])
        .filter(Boolean)
        .map(normalizarComponente);
      setComponentes(lista);
      setAmbientes((atual) =>
        atual.map((a) =>
          a.id === sel.id
            ? { ...a, comps: lista.length, componentes: lista }
            : a,
        ),
      );
    } catch (error) {
      console.error("Erro ao cadastrar componente:", error);
      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Não foi possível cadastrar o componente.";
      setErro(mensagem);
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
              andar: normalizarAndar(edit.andar),
              ativo: normalizarStatusAmbiente(edit.ativo),
              desc: edit.desc.trim(),
            }
          : a,
      ),
    );
    setEdit(null);
  };

  const Filtros = (
    <div className="filtros ambientes-filtros">
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
        className="botao botao--principal"
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
        + Novo ambiente
      </button>
    </div>
  );

  return (
    <div className="pagina pagina--ambientes ambientes">
      <header className="pagina__cabecalho">
        <div>
          <h1>Ambientes</h1>
          <p className="atenuado">
            {modo === "grade"
              ? "Gerencie os ambientes cadastrados no sistema."
              : "Gerencie os ambientes cadastrados no sistema e visualize seus componentes."}
          </p>
        </div>
      </header>

      <div className="barra-superior ambientes-barra-superior">
        <div className="barra-superior__busca" aria-label="Buscar ambientes">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={f.q}
            onChange={set("q")}
            placeholder="Buscar por nome, bloco ou tipo..."
            aria-label="Buscar ambientes"
          />
        </div>
        <div className="barra-superior__acoes">
          <div className="barra-superior__notificacoes-wrap" ref={notificacoesRef}>
            <button
              type="button"
              className="barra-superior__icone-botao"
              aria-label="Notificações"
              onClick={() => setMostrarNotificacoes((valor) => !valor)}
            >
              🕭
            </button>

            {mostrarNotificacoes && (
              <div
                className="barra-superior__notificacoes"
                role="menu"
                aria-label="Notificações"
              >
                <div className="barra-superior__notificacoes-cabecalho">
                  <strong>Notificações</strong>
                  <span>{notificacoes.length}</span>
                </div>

                {notificacoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="barra-superior__notificacao-item"
                  >
                    <span>{item.titulo}</span>
                    <small>{item.tempo}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {carregando && <p className="ambientes-vazio">Carregando ambientes...</p>}
      {erro && <p className="ambientes-erro">{erro}</p>}

      {modo === "grade" ? (
        <>
          {Filtros}
          <div className="ambientes-grade-wrap">
            <div>
              {filtrados.length === 0 && (
                <p className="ambientes-vazio">
                  Nenhum ambiente encontrado. Limpe os filtros ou cadastre um
                  novo ambiente.
                </p>
              )}
              <div className="cartao__ambientes cartao__ambientes--grade ambientes-grade">
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
              <div className="ambientes-indicadores-chave">
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
                        className="ambientes-etiqueta-icone"
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
          {Filtros}
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
              <section className="ambientes-painel ambientes-detalhe">
                <div className="ambientes-detalhe-cabecalho">
                  <Thumb tipo={sel.tipo} size={128} />
                  <div className="ambientes-detalhe-informacao">
                    <h2>{sel.nome}</h2>
                    <div className="ambientes-tags">
                      <Tag tipo={sel.tipo} />
                      <Status ativo={sel.ativo} />
                    </div>
                    <p className="ambientes-local">
                      <MapPin size={14} /> {sel.bloco} · {andarLabel(sel.andar)}
                    </p>
                    <p className="ambientes-descricao">{sel.desc}</p>
                  </div>
                  <button
                    className="botao botao--vazado ambientes-botao-sec"
                    onClick={abrirEdicao}
                  >
                    <Pencil size={15} /> Editar
                  </button>
                  <button className="ambientes-icone" aria-label="Mais ações">
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
                      className={aba === k ? "ativo" : ""}
                      onClick={() => setAba(k)}
                    >
                      <Icon size={17} /> {nome}
                    </button>
                  ))}
                </div>

                {aba === "componentes" && (
                  <>
                    <div className="filtros ambientes-componente-filtros">
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
                        onChange={(v) => setCf((cur) => ({ ...cur, tipo: v }))}
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
                        className="botao botao--principal ambientes-botao"
                        onClick={() =>
                          setNovoComponente({
                            nome: "",
                            tipoId: tiposComponentes[0]?.id_compo_tipo ?? "",
                            patrimonio: "",
                          })
                        }
                        disabled={tiposComponentes.length === 0}
                      >
                        <Plus size={16} /> Adicionar componente
                      </button>
                    </div>
                    <div className="ambientes-tabela-wrap">
                      <table className="tabela ambientes-tabela">
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
                            const Icon =
                              c.Icon || ICONES_COMP[c.tipo] || Package;
                            return (
                              <tr key={c.id ?? c.pat}>
                                <td>
                                  <span className="ambientes-componente-nome">
                                    <span className="ambientes-etiqueta-icone">
                                      <Icon size={16} />
                                    </span>
                                    {c.nome}
                                  </span>
                                </td>
                                <td className="ambientes-mudo">{c.tipo}</td>
                                <td>{c.pat}</td>
                                <td>
                                  <span
                                    className={`ambientes-etiqueta ${c.status === "Funcionando" ? "ok" : c.status === "Com problema" ? "erro" : "aviso"}`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td>{c.manut}</td>
                                <td>
                                  <button
                                    className="ambientes-icone"
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
                        <p className="ambientes-vazio">
                          Carregando componentes...
                        </p>
                      )}
                      {!carregandoComponentes &&
                        compsFiltrados.length === 0 && (
                          <p className="ambientes-vazio">
                            {comps.length === 0
                              ? "Este ambiente ainda não tem componentes cadastrados."
                              : "Nenhum componente encontrado com esses filtros."}
                          </p>
                        )}
                    </div>
                  </>
                )}

                {aba === "visao" && (
                  <div className="ambientes-visao">
                    <Info l="Nome" v={sel.nome} />
                    <Info l="Tipo" v={sel.tipo} />
                    <Info l="Bloco" v={sel.bloco} />
                    <Info l="Andar" v={andarLabel(sel.andar)} />
                    <Info l="Status" v={sel.ativo ? "Ativo" : "Inativo"} />
                    <Info l="Componentes" v={totalComponentesDoAmbiente} />
                    <Info
                      l="Criado em"
                      v={
                        sel.por
                          ? `${formatarDataAmbiente(sel.criado)} por ${sel.por}`
                          : formatarDataAmbiente(sel.criado)
                      }
                    />
                  </div>
                )}
              </section>
            )}

            {sel && (
              <aside className="ambientes-coluna-direita">
                <section className="ambientes-painel">
                  <h3>
                    <ClipboardList size={18} /> Informações do Ambiente
                  </h3>
                  <Info l="Nome" v={sel.nome} />
                  <Info l="Tipo" v={sel.tipo} />
                  <Info l="Bloco" v={sel.bloco} />
                  <Info l="Andar" v={andarLabel(sel.andar)} />
                  <Info l="Componentes" v={totalComponentesDoAmbiente} />
                  <div className="ambientes-informacao">
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

// Renderiza um seletor com abertura, seleção e navegação controladas.
function Select({
  label,
  value,
  onChange,
  opts,
  allLabel,
  className = "Todos",
}) {
  const options = [["", allLabel], ...opts];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selectedLabel = opts.find(([v]) => v === value)?.[1] ?? "Selecione";

  return (
    <div className={`selecao-personalizada ${className}`.trim()} ref={ref}>
      <span className="selecao-personalizada__rotulo">{label}</span>

      <div className="selecao-personalizada__campo">
        <button
          type="button"
          className={`selecao-personalizada__acionador ${open ? "esta-aberto" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{selectedLabel}</span>
          <span className="selecao-personalizada__seta">▾</span>
        </button>

        {open && (
          <div
            className="selecao-personalizada__menu"
            role="listbox"
            aria-label={label}
          >
            {opts.map(([v, text]) => (
              <button
                key={v}
                type="button"
                role="option"
                aria-selected={value === v}
                className={`selecao-personalizada__opcao ${value === v ? "esta-selecionado" : ""}`}
                onClick={() => {
                  onChange({ target: { value: v } });
                  setOpen(false);
                }}
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// Escolhe o ícone e o estilo correspondentes ao tipo do ambiente.
function Thumb({ tipo, size = 72 }) {
  const { cor, Icon } = tipoConfig(tipo);
  return (
    <div
      className="ambientes-miniatura"
      style={{
        width: size,
        height: size * 0.85,
        background: `linear-gradient(135deg, ${cor}55, var(--surface-3))`,
        color: cor,
      }}
    >
      <Icon size={size * 0.38} />
    </div>
  );
}

// Exibe uma etiqueta visual para o tipo do ambiente.
const Tag = ({ tipo }) => (
  <span
    className="ambientes-etiqueta"
    style={{
      background: tipoConfig(tipo).cor + "33",
      color: tipoConfig(tipo).cor,
      borderColor: tipoConfig(tipo).cor + "66",
    }}
  >
    {tipo}
  </span>
);

// Retorna as cores e o ícone apropriados para cada tipo de ambiente.
function tipoConfig(tipo = "") {
  const cores = ["#3b82f6", "#8b5cf6", "#f59e0b", "#14b8a6", "#64748b"];
  const indice =
    [...tipo].reduce((total, caractere) => total + caractere.charCodeAt(0), 0) %
    cores.length;
  return { cor: cores[indice], Icon: MapPin };
}
// Mostra o estado ativo ou inativo do ambiente.
const Status = ({ ativo }) => (
  <span className={`ambientes-etiqueta ${ativo ? "ok" : "erro-sol"}`}>
    {ativo ? "Ativo" : "Inativo"}
  </span>
);

// Formata a data de criação de um ambiente ou retorna um valor padrão.
function formatarDataAmbiente(valor) {
  if (!valor || valor === "—") return "—";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

// Apresenta um rótulo e seu valor como um item informativo.
const Info = ({ l, v }) => (
  <div className="ambientes-informacao">
    <small>{l}</small>
    <span>{v}</span>
  </div>
);

// Apresenta um indicador resumido com ícone, valor e legenda.
function Kpi({ Icon, cor, n, label }) {
  return (
    <div className="ambientes-indicador-chave">
      <span
        className="ambientes-indicador-chave-icone"
        style={{ background: cor + "26", color: cor }}
      >
        <Icon size={20} />
      </span>
      <b>{n}</b>
      <small className="selecao-personalizada__rotulo">{label}</small>
    </div>
  );
}

// Exibe o resumo de um ambiente e permite abrir sua página de detalhe.
function CardAmbiente({ a, qtd, onOpen, compacto, ativo }) {
  return (
    <article
      className={`cartao ambientes-cartao ${compacto ? "compacto" : ""} ${ativo ? "ativo" : ""}`}
      tabIndex={0}
      role="button"
      aria-label={`Abrir ${a.nome}`}
      onClick={onOpen}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())
      }
    >
      <div className="ambientes-cartao-topo">
        <Thumb tipo={a.tipo} size={compacto ? 72 : 76} />
        <div className="ambientes-cartao-informacao">
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
      <div className="ambientes-cartao-meta">
        <span>
          <Monitor size={15} /> {qtd} {qtd === 1 ? "componente" : "componentes"}
        </span>
      </div>
      {!compacto && (
        <div className="ambientes-cartao-meta fino">
          <span>
            <Calendar size={14} /> Criado em {formatarDataAmbiente(a.criado)}
          </span>
          <span>{a.por}</span>
        </div>
      )}
    </article>
  );
}

// Fornece a estrutura comum dos diálogos da página de ambientes.
function Modal({ titulo, onClose, children }) {
  // Fecha com ESC
  // Fecha o diálogo por clique externo ou pela tecla Escape.
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Trava a rolagem da página enquanto o modal estiver aberto
  // Impede a rolagem da página enquanto o diálogo está aberto.
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
    <div className="ambientes-janela-fundo" onClick={onClose}>
      <div className="ambientes-janela" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

// Agrupa os botões de cancelar e confirmar dos formulários.
function Acoes({ onCancel, salvar, ok }) {
  return (
    <div className="ambientes-janela-acoes">
      <button
        type="button"
        className="botao botao--vazado ambientes-botao-sec"
        onClick={onCancel}
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="botao botao--principal ambientes-botao"
        disabled={!ok}
      >
        {salvar}
      </button>
    </div>
  );
}

// Formulário para cadastrar um componente diretamente no ambiente.
function FormComponenteAmbiente({
  valor,
  tipos,
  salvando,
  onChange,
  onCancel,
  onSubmit,
}) {
  const up = (campo) => (event) =>
    onChange({ ...valor, [campo]: event.target.value });
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
      <Acoes
        onCancel={onCancel}
        salvar={salvando ? "Salvando..." : "Cadastrar componente"}
        ok={ok && !salvando}
      />
    </form>
  );
}

// Formulário compartilhado para cadastrar e editar ambientes.
function FormAmbiente({
  valor,
  onChange,
  onCancel,
  onSubmit,
  salvar,
  edicao,
  tipos,
}) {
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
        <span>Tipo</span>
        <CustomSelect
          value={valor.tipo}
          options={tipos}
          onChange={(v) => up("tipo")({ target: { value: v } })}
        />
      </label>
      <div className="ambientes-linha">
        <label>
          Bloco
          <input value={valor.bloco} onChange={up("bloco")} />
        </label>
        <label>
          Andar
          <input
            type="number"
            min="0"
            value={valor.andar}
            onChange={up("andar")}
          />
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
