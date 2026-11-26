import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import ocorrenciaService from "../services/ocorrenciaService";
import userService from "../services/userServices";
import atribuicaoTecnicoService from "../services/atribuicaoTecnicoService";

import { formatarData, iniciais } from "../services/utils";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";
import CustomSelect from "../components/CustomSelect";

const STATUS_LABEL = {
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

// Extrai listas de diferentes formatos de resposta da API
function extrairLista(resposta, propriedades = []) {
  const candidatos = [
    resposta,
    resposta?.data,
    resposta?.data?.data,
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) {
      return candidato;
    }

    if (candidato && typeof candidato === "object") {
      for (const propriedade of propriedades) {
        if (Array.isArray(candidato[propriedade])) {
          return candidato[propriedade];
        }
      }
    }
  }

  return [];
}

// Normaliza os dados da ocorrência
function normalizarOcorrencia(resposta) {
  const dados = resposta?.data?.data ?? resposta?.data ?? resposta;

  const ocorrencia =
    dados?.ocorrencia ||
    dados?.data?.ocorrencia ||
    dados ||
    {};

  const usuarioCriador =
    dados?.criado_por ||
    dados?.usuario ||
    dados?.user ||
    dados?.criador ||
    ocorrencia.criado_por ||
    ocorrencia.usuario ||
    ocorrencia.user ||
    ocorrencia.criador;

  return {
    ...ocorrencia,

    id: ocorrencia.id_ocor ?? ocorrencia.id,
    numero: ocorrencia.id_ocor ?? ocorrencia.numero,
    titulo: ocorrencia.ocor_nome ?? ocorrencia.titulo,
    status: ocorrencia.ocor_status ?? ocorrencia.status,
    prioridade: ocorrencia.ocor_prioridade ?? ocorrencia.prioridade,
    descricao: ocorrencia.ocor_obs ?? ocorrencia.descricao,

    id_user:
      ocorrencia.id_user ??
      ocorrencia.id_usuario ??
      ocorrencia.user_id ??
      ocorrencia.usuario_id ??
      ocorrencia.ocor_id_user ??
      ocorrencia.ocor_id_usuario ??
      ocorrencia.id_usu ??
      usuarioCriador?.id_user ??
      usuarioCriador?.id_usuario ??
      usuarioCriador?.user_id ??
      usuarioCriador?.id,

    criadoEm: ocorrencia.criado_em ?? ocorrencia.criadoEm,
    atualizadoEm: ocorrencia.atualizado_em ?? ocorrencia.atualizadoEm,

    comentarios: ocorrencia.comentarios || [],

    componente: dados?.componente || dados?.data?.componente,
    ambiente: dados?.ambiente || dados?.data?.ambiente,

    criador: usuarioCriador,

    criadorNome:
      dados?.user_nome ||
      dados?.usuario_nome ||
      dados?.nome_usuario ||
      ocorrencia.user_nome ||
      ocorrencia.usuario_nome ||
      ocorrencia.nome_usuario ||
      (typeof usuarioCriador === "string"
        ? usuarioCriador
        : undefined),
  };
}

// Nome do criador
function nomeCriador(chamado) {
  return (
    chamado.criadorNome ||
    chamado.criador?.nome ||
    chamado.criador?.user_nome ||
    chamado.criador?.usuario_nome ||
    chamado.criador?.nome_usuario ||
    chamado.criador?.name ||
    (chamado.id_user
      ? `Usuário ${chamado.id_user}`
      : "Usuário")
  );
}

// Nome do usuário
function nomeUsuario(usuario) {
  return (
    usuario?.nome ||
    usuario?.user_nome ||
    usuario?.usuario_nome ||
    "Usuário"
  );
}

// Obtém os dados do técnico dentro de um vínculo
function dadosTecnico(vinculo) {
  return (
    vinculo?.tecnico ||
    vinculo?.usuario ||
    vinculo?.user ||
    vinculo ||
    {}
  );
}

// Obtém o identificador do vínculo
function obterIdVinculo(vinculo) {
  return (
    vinculo?.id_ocor_user ??
    vinculo?.id_vinculo ??
    vinculo?.id_atribuicao ??
    vinculo?.id_atribuicao_tecnico ??
    vinculo?.id_atribuicaoTecnico ??
    vinculo?.atribuicao_id ??
    vinculo?.vinculo_id
  );
}

// Normaliza os dados das observações
function normalizarObservacao(item, index) {
  const autor =
    item?.usuario?.nome ||
    item?.usuario?.user_nome ||
    item?.usuario_nome ||
    item?.user_nome ||
    item?.autor ||
    item?.nome_usuario ||
    "Usuário";

  return {
    id: item?.id_obs ?? item?.id_observacao ?? item?.id ?? index,
    texto:
      item?.obs_texto ??
      item?.texto ??
      item?.ocor_obs ??
      item?.observacao ??
      "",
    data:
      item?.obs_criado_em ??
      item?.criado_em ??
      item?.criadoEm ??
      item?.data ??
      null,
    autor,
  };
}

export default function ChamadoDetalhe() {
  const { id } = useParams();
  const { usuario } = useAuth();

  // Dados da ocorrência
  const [chamado, setChamado] = useState(null);

  // Perfil
  const [nomePerfil, setNomePerfil] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");

  // Comentários
  const [comentario, setComentario] = useState("");

  // Carregamento e erros
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Atribuição de técnicos
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicosDisponiveis, setTecnicosDisponiveis] = useState([]);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState("");
  const [buscaTecnico, setBuscaTecnico] = useState("");

  const [carregandoTecnicos, setCarregandoTecnicos] = useState(false);
  const [salvandoVinculo, setSalvandoVinculo] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);

  const [erroVinculo, setErroVinculo] = useState("");
  const [sucessoVinculo, setSucessoVinculo] = useState("");

  const nomeLogado = nomePerfil || nomeUsuario(usuario);

  // Identificação do perfil
  const perfil = String(
    usuario?.user_tipo ||
    usuario?.role ||
    usuario?.perfil ||
    usuario?.cargo ||
    ""
  )
    .trim()
    .toLowerCase();

  const ehAdmin = perfil === "admin";
  const podeGerenciar = ["admin", "tecnico"].includes(perfil);

  // =====================================================
  // FILTRAR TÉCNICOS DISPONÍVEIS
  // =====================================================



  const tecnicosFiltrados = tecnicosDisponiveis.filter((disponivel) => {
    const nome = nomeUsuario(disponivel).toLowerCase();
    const termo = buscaTecnico.trim().toLowerCase();

    const idDisponivel =
      disponivel.id_user ??
      disponivel.id_usuario ??
      disponivel.id;

    const jaVinculado = tecnicos.some((vinculado) => {
      const tecnico = dadosTecnico(vinculado);

      const idVinculado =
        tecnico.id_user ??
        tecnico.id_usuario ??
        tecnico.id ??
        vinculado.id_user ??
        vinculado.user_id;

      return (
        idDisponivel != null &&
        idVinculado != null &&
        Number(idDisponivel) === Number(idVinculado)
      );
    });

    return !jaVinculado && nome.includes(termo);
  });

  // =====================================================
  // CARREGAR PERFIL DO USUÁRIO
  // =====================================================

  useEffect(() => {
    let montado = true;

    async function carregarPerfil() {
      try {
        const resposta = await userService.buscarperfil();

        const perfilResposta =
          resposta?.data?.usuario ||
          resposta?.data?.user ||
          resposta?.data ||
          resposta?.usuario ||
          resposta?.user ||
          resposta;

        const nome =
          perfilResposta?.nome ||
          perfilResposta?.user_nome ||
          perfilResposta?.usuario_nome ||
          "";

        const foto =
          perfilResposta?.FotoPerfil ||
          perfilResposta?.user_imagem_url ||
          perfilResposta?.user_imagem ||
          perfilResposta?.user_foto ||
          perfilResposta?.foto_perfil ||
          perfilResposta?.foto ||
          "";

        if (montado) {
          if (nome) setNomePerfil(nome);
          if (foto) setFotoPerfil(foto);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
      }
    }

    carregarPerfil();

    return () => {
      montado = false;
    };
  }, []);

  // =====================================================
  // CARREGAR OCORRÊNCIA
  // =====================================================

  useEffect(() => {
    let montado = true;

    async function carregar() {
      setCarregando(true);
      setErro("");

      try {
        const resposta =
          await ocorrenciaService.buscarOcorrenciaPorId(id);

        const chamadoCarregado = normalizarOcorrencia(resposta);

        const idUsuario =
          chamadoCarregado.id_user ??
          chamadoCarregado.id_usuario ??
          chamadoCarregado.user_id ??
          chamadoCarregado.usuarioId ??
          chamadoCarregado.usuario_id ??
          chamadoCarregado.criador?.id_user ??
          chamadoCarregado.criador?.id_usuario ??
          chamadoCarregado.criador?.user_id ??
          chamadoCarregado.criador?.id;

        if (idUsuario && !chamadoCarregado.criadorNome) {
          try {
            const respostaUsuario =
              await userService.buscarUsuarioPorId(idUsuario);

            const usuarioResposta =
              respostaUsuario?.usuario ||
              respostaUsuario?.user ||
              respostaUsuario?.data?.data?.usuario ||
              respostaUsuario?.data?.data?.user ||
              respostaUsuario?.data?.usuario ||
              respostaUsuario?.data?.user ||
              respostaUsuario?.data ||
              respostaUsuario;

            const usuarioEncontrado = Array.isArray(usuarioResposta)
              ? usuarioResposta[0]
              : usuarioResposta;

            chamadoCarregado.criadorNome =
              usuarioEncontrado?.user_nome ||
              usuarioEncontrado?.usuario_nome ||
              usuarioEncontrado?.nome_usuario ||
              usuarioEncontrado?.name ||
              usuarioEncontrado?.nome;
          } catch (error) {
            console.error("Erro ao buscar usuário criador:", error);
          }
        }

        // Carregar observações existentes
        try {
          const respostaObservacoes =
            await ocorrenciaService.listarObservacoes(id);

          const observacoes = extrairLista(respostaObservacoes, [
            "observacoes",
            "observacoes_ocorrencia",
            "data",
          ]);

          chamadoCarregado.comentarios = observacoes
            .map(normalizarObservacao)
            .filter((observacao) => observacao.texto);
        } catch (error) {
          console.error("Erro ao carregar observações:", error);
        }

        if (montado) {
          setChamado(chamadoCarregado);
        }
      } catch (error) {
        if (montado) {
          setErro("Não foi possível carregar a ocorrência.");
          console.error("Erro ao carregar ocorrência:", error);
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      montado = false;
    };
  }, [id]);

  // =====================================================
  // CARREGAR TÉCNICOS DA OCORRÊNCIA
  // =====================================================



  const carregarTecnicos = useCallback(async () => {
    setCarregandoTecnicos(true);
    setErroVinculo("");

    try {
      // 1. Buscar técnicos já vinculados à ocorrência
      try {
        const resposta =
          await atribuicaoTecnicoService.listarTecnicosDaOcorrencia(id);

        const lista = extrairLista(resposta, [
          "tecnicos",
          "vinculos",
          "atribuicoes",
          "usuarios",
        ]);

        setTecnicos(lista);
      } catch (error) {
        console.error("Erro ao carregar técnicos vinculados:", error);

        setTecnicos([]);

        setErroVinculo(
          "Não foi possível carregar os técnicos responsáveis."
        );
      }

      // 2. Buscar técnicos disponíveis para o administrador
      if (ehAdmin) {
        try {
          const respostaUsuarios = await userService.listarUsuarios();

          const usuarios = extrairLista(respostaUsuarios, [
            "usuarios",
            "users",
            "data",
          ]);

          const listaTecnicos = usuarios.filter((item) => {
            const tipo = String(
              item.user_tipo || item.role || item.perfil || ""
            )
              .trim()
              .toLowerCase();

            return tipo === "tecnico";
          });

          setTecnicosDisponiveis(listaTecnicos);
        } catch (error) {
          console.error("Erro ao carregar técnicos disponíveis:", error);

          setTecnicosDisponiveis([]);

          setErroVinculo((atual) =>
            atual ||
            "Não foi possível carregar os técnicos disponíveis."
          );
        }
      } else {
        setTecnicosDisponiveis([]);
      }
    } finally {
      setCarregandoTecnicos(false);
    }
  }, [id, ehAdmin]);


  useEffect(() => {
    if (id) {
      carregarTecnicos();
    }
  }, [id, carregarTecnicos]);

  // =====================================================
  // ATUALIZAR STATUS
  // =====================================================

  async function atualizarStatus(novoStatus) {
    try {
      await ocorrenciaService.alterarStatus(
        chamado.id,
        novoStatus
      );

      setChamado((atual) => ({
        ...atual,
        status: novoStatus,
      }));

      setErro("");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Não foi possível atualizar o status.");
    }
  }

  // =====================================================
  // ENVIAR COMENTÁRIO
  // =====================================================

  async function enviarComentario(event) {
    event.preventDefault();

    if (!comentario.trim()) return;

    setSalvando(true);

    try {
      await ocorrenciaService.adicionarObservacao(
        chamado.id,
        comentario.trim()
      );

      setChamado((atual) => ({
        ...atual,
        comentarios: [
          ...atual.comentarios,
          {
            texto: comentario.trim(),
            data: new Date().toISOString(),
            autor: nomeLogado,
          },
        ],
      }));

      setComentario("");
    } catch (error) {
      console.error("Erro ao adicionar observação:", error);
      setErro("Não foi possível adicionar a observação.");
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // VINCULAR TÉCNICO
  // =====================================================

  async function vincularTecnico() {
    if (!tecnicoSelecionado) {
      setErroVinculo("Selecione um técnico.");
      return;
    }

    setSalvandoVinculo(true);
    setErroVinculo("");
    setSucessoVinculo("");

    try {
      await atribuicaoTecnicoService.vincularTecnico(
        chamado.id,
        Number(tecnicoSelecionado)
      );

      setTecnicoSelecionado("");
      setBuscaTecnico("");

      setSucessoVinculo("Técnico vinculado com sucesso.");

      await carregarTecnicos();
    } catch (error) {
      console.error("Erro ao vincular técnico:", error);

      setErroVinculo(
        error.response?.data?.message ||
        "Não foi possível vincular o técnico."
      );
    } finally {
      setSalvandoVinculo(false);
    }
  }

  // =====================================================
  // DESVINCULAR TÉCNICO
  // =====================================================


  async function desvincularTecnico(vinculo) {
    const idVinculo = obterIdVinculo(vinculo);

    if (!idVinculo) {
      setErroVinculo(
        "Não foi possível identificar o ID do vínculo."
      );
      return;
    }

    const tecnico = dadosTecnico(vinculo);
    const nome = nomeUsuario(tecnico);

    const confirmar = window.confirm(
      `Deseja realmente desvincular ${nome} desta ocorrência?`
    );

    if (!confirmar) return;

    setErroVinculo("");
    setSucessoVinculo("");
    setDesvinculando(true);

    try {
      await atribuicaoTecnicoService.desvincularTecnico(idVinculo);

      setSucessoVinculo("Técnico desvinculado com sucesso.");

      await carregarTecnicos();
    } catch (error) {
      console.error("Erro ao desvincular técnico:", error);

      setErroVinculo(
        error.response?.data?.message ||
        "Não foi possível desvincular o técnico."
      );
    } finally {
      setDesvinculando(false);
    }
  }

  // =====================================================
  // ESTADOS DE CARREGAMENTO
  // =====================================================

  if (carregando) {
    return (
      <div className="pagina">
        <div className="vazio">
          Carregando ocorrência...
        </div>
      </div>
    );
  }

  if (erro && !chamado) {
    return (
      <div className="pagina">
        <div className="vazio">
          <strong>{erro}</strong>
        </div>
      </div>
    );
  }

  if (!chamado) return null;

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================

  return (
    <div className="pagina chamado-detalhe-pagina">

      <Link to="/ocorrencias" className="voltar-link">
        ← Voltar para Ocorrências
      </Link>

      {/* CABEÇALHO */}

      <header className="pagina__cabecalho chamado-cabecalho">
        <div>
          <span className="rotulo-superior">
            #{chamado.numero} ·{" "}
            {chamado.componente?.compo_nome || "Ocorrência"}
          </span>

          <h1>{chamado.titulo}</h1>

          <p className="esmaecido">
            Detalhes e histórico da ocorrência.
          </p>
        </div>

        <div className="chamado-cabecalho__etiquetas">
          <StatusBeacon status={chamado.status} />
          <PriorityBadge prioridade={chamado.prioridade} />
        </div>
      </header>

      {erro && (
        <p className="formulario__erro">
          {erro}
        </p>
      )}

      {/* DESCRIÇÃO */}

      <div className="card">
        <h2>Observação</h2>

        <p className="chamado-descricao">
          {chamado.descricao || "—"}
        </p>
      </div>

      <div className="grade-2 grade-2--assimetrico">


        {/* HISTÓRICO */}

        <div className="card chamado-historico-card">
          <h2>Observação do Técnico</h2>

          {/* LISTA DE OBSERVAÇÕES */}
          <div className="chamado-historico-rolagem">
            <ul className="linha-do-tempo">

              <li className="linha-do-tempo__item">
                <span className="linha-do-tempo__ponto" />

                <div className="linha-do-tempo__conteudo">
                  <strong>{nomeCriador(chamado)}</strong>
                  <span> abriu a ocorrência</span>

                  <time>
                    {formatarData(chamado.criadoEm)}
                  </time>
                </div>
              </li>

              {chamado.comentarios.map((item, index) => (
                <li
                  key={item.id ?? index}
                  className="linha-do-tempo__item"
                >
                  <span className="linha-do-tempo__ponto" />

                  <div className="linha-do-tempo__conteudo">
                    <strong>{item.autor || nomeLogado}</strong>

                    <p>
                      {item.texto || item.ocor_obs}
                    </p>

                    <time>
                      {formatarData(item.data || item.criado_em)}
                    </time>
                  </div>
                </li>
              ))}

            </ul>
          </div>

          {/* FORMULÁRIO DE COMENTÁRIO */}
          <div className="comentario-area">
            <h3>Adicionar observação</h3>

            <form
              className="comentario-formulario"
              onSubmit={enviarComentario}
            >
              {fotoPerfil ? (
                <img
                  className="avatar avatar--pequeno"
                  src={fotoPerfil}
                  alt={`Foto de ${nomeLogado}`}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="avatar avatar--observacao">
                  {iniciais(nomeLogado)}
                </span>
              )}

              <div className="comentario-formulario__campo">
                <input
                  type="text"
                  placeholder="Escreva uma observação..."
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  disabled={salvando}
                  maxLength={1000}
                />

                <button
                  type="submit"
                  className="botao botao--principal botao--pequeno"
                  disabled={salvando || !comentario.trim()}
                >
                  {salvando ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>


        {/* COLUNA LATERAL */}

        <aside>

          {/* DETALHES */}

          <div className="card">
            <h2>Detalhes</h2>

            <dl className="detalhe-lista">

              <div>
                <dt>Criado por</dt>
                <dd>{nomeCriador(chamado)}</dd>
              </div>

              <div>
                <dt>Componente</dt>
                <dd>
                  {chamado.componente?.compo_nome || "—"}
                </dd>
              </div>

              <div>
                <dt>Ambiente</dt>
                <dd>
                  {chamado.ambiente?.amb_nome || "—"}
                </dd>
              </div>

              <div>
                <dt>Aberto em</dt>
                <dd>{formatarData(chamado.criadoEm)}</dd>
              </div>

              <div>
                <dt>Última atualização</dt>
                <dd>
                  {formatarData(chamado.atualizadoEm)}
                </dd>
              </div>

            </dl>
          </div>


          {/* TÉCNICOS RESPONSÁVEIS */}

          <div className="card">
            <h2>Técnico(s) responsável(is)</h2>

            {/* LISTA DE TÉCNICOS JÁ VINCULADOS */}
            {carregandoTecnicos ? (
              <p className="esmaecido">
                Carregando técnicos...
              </p>
            ) : tecnicos.length === 0 ? (
              <p className="esmaecido">
                Nenhum técnico vinculado a esta ocorrência.
              </p>
            ) : (
              <div className="tecnicos-vinculados">
                {tecnicos.map((vinculo, index) => {
                  const tecnico = dadosTecnico(vinculo);
                  const nome = nomeUsuario(tecnico);

                  const idVinculo = obterIdVinculo(vinculo);

                  const idUsuario =
                    tecnico.id_user ??
                    tecnico.id_usuario ??
                    tecnico.id;

                  return (
                    <div
                      className="tecnico-vinculado"
                      key={idVinculo ?? idUsuario ?? index}
                    >
                      <div className="tecnico-vinculado__avatar">
                        {iniciais(nome)}
                      </div>

                      <div className="tecnico-vinculado__info">
                        <strong>{nome}</strong>
                        <span>Técnico</span>
                      </div>

                      {ehAdmin && (
                        <button
                          type="button"
                          className="tecnico-vinculado__remover"
                          onClick={() => desvincularTecnico(vinculo)}
                          disabled={!idVinculo || desvinculando}
                          title="Desvincular técnico"
                          aria-label={`Desvincular ${nome}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADICIONAR TÉCNICO - SOMENTE ADMIN */}
            {ehAdmin && (
              <div className="tecnico-vinculo-formulario">

                <div className="detalhe-status-filtro">
                  <label
                    htmlFor="busca-tecnico"
                    className="personalizado-selecao__rotulo"
                  >
                    Adicionar técnico
                  </label>

                  {/* CAMPO DE PESQUISA */}
                  <div className="tecnico-busca">
                    <input
                      id="busca-tecnico"
                      type="text"
                      className="tecnico-busca__input"
                      placeholder="Pesquisar técnico pelo nome..."
                      value={buscaTecnico}
                      autoComplete="off"
                      onChange={(event) => {
                        setBuscaTecnico(event.target.value);
                        setTecnicoSelecionado("");
                      }}
                      disabled={salvandoVinculo || carregandoTecnicos}
                    />

                    {buscaTecnico && (
                      <button
                        type="button"
                        className="tecnico-busca__limpar"
                        onClick={() => {
                          setBuscaTecnico("");
                          setTecnicoSelecionado("");
                        }}
                        aria-label="Limpar pesquisa"
                        disabled={salvandoVinculo}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* RESULTADOS DA PESQUISA */}
                  {buscaTecnico.trim() && (
                    <div className="tecnicos-resultados">
                      {tecnicosFiltrados.length > 0 ? (
                        tecnicosFiltrados.map((item) => {
                          const idItem =
                            item.id_user ??
                            item.id_usuario ??
                            item.id;

                          const selecionado =
                            Number(tecnicoSelecionado) === Number(idItem);

                          const nome = nomeUsuario(item);

                          return (
                            <button
                              type="button"
                              key={idItem}
                              className={`tecnico-resultado ${selecionado
                                ? "tecnico-resultado--selecionado"
                                : ""
                                }`}
                              onClick={() => {
                                setTecnicoSelecionado(String(idItem));
                                setBuscaTecnico(nome);
                              }}
                              disabled={salvandoVinculo}
                            >
                              <span className="tecnico-resultado__avatar">
                                {iniciais(nome)}
                              </span>

                              <span className="tecnico-resultado__nome">
                                {nome}
                              </span>

                              {selecionado && (
                                <span className="tecnico-resultado__check">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="tecnicos-resultados__vazio">
                          Nenhum técnico disponível encontrado.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTÃO DE VINCULAR */}
                <button
                  type="button"
                  className="botao botao--principal"
                  onClick={vincularTecnico}
                  disabled={
                    !tecnicoSelecionado ||
                    salvandoVinculo ||
                    carregandoTecnicos
                  }
                >
                  {salvandoVinculo
                    ? "Vinculando..."
                    : "+ Vincular técnico"}
                </button>
              </div>
            )}

            {/* MENSAGENS */}
            {erroVinculo && (
              <p className="formulario__erro">
                {erroVinculo}
              </p>
            )}

            {sucessoVinculo && (
              <p className="formulario__sucesso">
                {sucessoVinculo}
              </p>
            )}
          </div>

          {/* GERENCIAR STATUS */}

          {podeGerenciar && (
            <div className="card">
              <h2>Gerenciar</h2>

              <div className="detalhe-status-filtro">
                <span className="personalizado-selecao__rotulo">
                  Status
                </span>

                <CustomSelect
                  id="chamado-status"
                  label="Status"
                  className="selecao-personalizada--status usuarios-perfil-select"
                  value={chamado.status}
                  options={Object.entries(STATUS_LABEL).map(
                    ([valor, rotulo]) => ({
                      value: valor,
                      label: rotulo,
                    })
                  )}
                  onChange={(valor) =>
                    atualizarStatus(valor)
                  }
                />
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}