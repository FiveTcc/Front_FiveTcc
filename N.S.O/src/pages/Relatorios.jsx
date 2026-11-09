import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  formatarData,
} from "../services/utils";

const PERFIL_LABEL = {
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Usuário",
};

const PERMISSOES = {
  admin: [
    "geral",
    "periodo",
    "ambiente",
    "prioridade",
    "status",
    "tecnicos",
    "tempo",
    "usuarios",
    "historico",
    "exportar",
  ],
  tecnico: ["proprio", "pendentes", "andamento", "concluidos", "tempo"],
  usuario: ["meus", "abertos", "status", "historico"],
};


// Converte um intervalo em milissegundos para horas ou dias.
function formatarHoras(valor) {
  if (!Number.isFinite(valor) || valor <= 0) return "0h";
  const horas = valor / 60 / 60 / 1000;
  if (horas < 24) return `${horas.toFixed(1)}h`;
  const dias = horas / 24;
  return `${dias.toFixed(1)}d`;
}

// Calcula o tempo médio entre abertura e atualização dos chamados concluídos.
function calcularMediaHoras(chamados) {
  const resolvidos = chamados.filter((chamado) =>
    ["resolvido", "fechado"].includes(chamado.status),
  );
  if (!resolvidos.length) return 0;

  const totalHoras = resolvidos.reduce((acumulado, chamado) => {
    const tempo =
      Number(chamado.atualizadoEm || chamado.criadoEm) -
      Number(chamado.criadoEm);
    return acumulado + tempo;
  }, 0);

  return totalHoras / resolvidos.length;
}

// Apresenta indicadores e históricos conforme o perfil de acesso do usuário.
export default function Relatorios() {
  const { usuario } = useAuth();
  const perfil = usuario?.perfil || "usuario";
  const acessos = PERMISSOES[perfil] || PERMISSOES.usuario;
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const [mensagemExportacao, setMensagemExportacao] = useState("");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacoesRef = useRef(null);

  const notificacoes = [];

  // Fecha as notificações ao clicar fora do painel.
  useEffect(() => {
    function handleClickFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  // Restringe a lista aos chamados visíveis para o perfil atual.
  const chamados = [];
  const chamadosVisiveis = useMemo(() => {
    if (perfil !== "usuario") return chamados;
    return chamados.filter((chamado) => chamado.solicitanteId === usuario?.id);
  }, [chamados, perfil, usuario?.id]);
  const usuarios = [];

  const usuarioMap = useMemo(
    () => Object.fromEntries(usuarios.map((item) => [item.id, item])),
    [usuarios],
  );

  // Agrupa os chamados por período, ambiente, prioridade e status.
  const chamadosPorPeriodo = useMemo(() => {
    const agora = Date.now();
    const intervalo = {
      "7 dias": 7 * 24 * 60 * 60 * 1000,
      "30 dias": 30 * 24 * 60 * 60 * 1000,
      "90 dias": 90 * 24 * 60 * 60 * 1000,
    };

    return Object.entries(intervalo).map(([label, valor]) => ({
      label,
      total: chamadosVisiveis.filter(
        (chamado) => agora - Number(chamado.criadoEm) <= valor,
      ).length,
    }));
  }, [chamadosVisiveis]);

  const chamadosPorAmbiente = useMemo(
    () =>
      Object.entries(
        chamadosVisiveis.reduce((acumulado, chamado) => {
          const chave = chamado.categoria || "Outros";
          acumulado[chave] = (acumulado[chave] || 0) + 1;
          return acumulado;
        }, {}),
      ).map(([label, total]) => ({ label, total })),
    [chamadosVisiveis],
  );

  const chamadosPorPrioridade = useMemo(
    () =>
      Object.entries(PRIORIDADE_LABEL).map(([valor, label]) => ({
        label,
        total: chamadosVisiveis.filter(
          (chamado) => chamado.prioridade === valor,
        ).length,
      })),
    [chamadosVisiveis],
  );

  const chamadosPorStatus = useMemo(
    () =>
      Object.entries(STATUS_LABEL).map(([valor, label]) => ({
        label,
        total: chamadosVisiveis.filter((chamado) => chamado.status === valor)
          .length,
      })),
    [chamadosVisiveis],
  );

  // Resume o volume de atendimento e as resoluções por técnico.
  const tecnicos = useMemo(() => {
    return usuarios
      .filter(
        (usuarioAtual) =>
          usuarioAtual.perfil === "tecnico" || usuarioAtual.perfil === "admin",
      )
      .map((usuarioAtual) => {
        const atendidos = chamadosVisiveis.filter(
          (chamado) => chamado.responsavelId === usuarioAtual.id,
        );
        const resolvidos = atendidos.filter((chamado) =>
          ["resolvido", "fechado"].includes(chamado.status),
        ).length;
        const emAndamento = atendidos.filter(
          (chamado) => chamado.status === "em_andamento",
        ).length;

        return {
          nome: usuarioAtual.nome,
          atendidos: atendidos.length,
          resolvidos,
          emAndamento,
        };
      })
      .sort((a, b) => b.atendidos - a.atendidos);
  }, [chamadosVisiveis, usuarios]);

  // Conta e ordena os chamados abertos por cada usuário.
  const chamadosPorUsuario = useMemo(
    () =>
      usuarios
        .map((usuarioAtual) => ({
          nome: usuarioAtual.nome,
          total: chamadosVisiveis.filter(
            (chamado) => chamado.solicitanteId === usuarioAtual.id,
          ).length,
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total),
    [chamadosVisiveis, usuarios],
  );

  const mediaAtendimentoMs = calcularMediaHoras(chamadosVisiveis);

  // Separa os registros mais recentes para compor o histórico da tela.
  const historico = useMemo(
    () =>
      [...chamadosVisiveis]
        .sort(
          (a, b) =>
            Number(b.atualizadoEm || b.criadoEm) -
            Number(a.atualizadoEm || a.criadoEm),
        )
        .slice(0, 8),
    [chamadosVisiveis],
  );

  const meusChamados = useMemo(
    () =>
      chamadosVisiveis.filter(
        (chamado) =>
          chamado.solicitanteId === usuario?.id ||
          chamado.responsavelId === usuario?.id,
      ),
    [chamadosVisiveis, usuario?.id],
  );

  const meusChamadosData = meusChamados.length
    ? meusChamados
        .slice()
        .sort(
          (a, b) =>
            Number(b.atualizadoEm || b.criadoEm) -
            Number(a.atualizadoEm || a.criadoEm),
        )
    : [];

  const meusChamadosResumo = {
    abertos: meusChamadosData.filter((chamado) =>
      ["aberto", "aguardando"].includes(chamado.status),
    ).length,
    andamento: meusChamadosData.filter(
      (chamado) => chamado.status === "em_andamento",
    ).length,
    concluido: meusChamadosData.filter((chamado) =>
      ["resolvido", "fechado"].includes(chamado.status),
    ).length,
  };

  const tempoMedioUsuario = calcularMediaHoras(meusChamadosData);

  // Monta uma página HTML autônoma com os indicadores e agrupamentos atuais.
  function gerarHtmlRelatorio() {
    const resumo = [
      ["Total", chamadosVisiveis.length],
      [
        "Abertos",
        chamadosVisiveis.filter((item) =>
          ["aberto", "em_andamento", "aguardando"].includes(item.status),
        ).length,
      ],
      [
        "Resolvidos",
        chamadosVisiveis.filter((item) =>
          ["resolvido", "fechado"].includes(item.status),
        ).length,
      ],
      ["Tempo médio", formatarHoras(mediaAtendimentoMs)],
    ];

    // Cria a seção de itens de cada agrupamento no relatório exportado.
    const renderLista = (titulo, itens) => {
      if (!itens.length) return "";
      return `
        <section class="rel-html__group">
          <h3>${titulo}</h3>
          <div class="rel-html__list">
            ${itens
              .map(
                (item) => `
                  <div class="rel-html__row">
                    <span>${item.label}</span>
                    <strong>${item.total}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `;
    };

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Relatório ${PERFIL_LABEL[perfil] || "Usuário"}</title>
          <style>
            :root {
              --bg: #f4f7fb;
              --surface: #ffffff;
              --surface-2: #edf3ff;
              --text: #152033;
              --muted: #5e6a82;
              --border: #dfe7f2;
              --primary: #3b82f6;
              --shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: var(--bg);
              color: var(--text);
              font-family: Arial, Helvetica, sans-serif;
              padding: 32px;
            }
            .rel-html { max-width: 1100px; margin: 0 auto; }
            .rel-html__header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 24px;
            }
            .rel-html__header h1 {
              margin: 0 0 8px;
              font-size: 2rem;
            }
            .rel-html__header p {
              margin: 0;
              color: var(--muted);
            }
            .rel-html__summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
              gap: 16px;
              margin-bottom: 24px;
            }
            .rel-html__card {
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 18px;
              box-shadow: var(--shadow);
              padding: 18px 20px;
            }
            .rel-html__card span {
              display: block;
              color: var(--muted);
              font-size: 0.8rem;
              margin-bottom: 8px;
            }
            .rel-html__card strong {
              font-size: 1.8rem;
            }
            .rel-html__grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 20px;
              margin-bottom: 20px;
            }
            .rel-html__group {
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 18px;
              box-shadow: var(--shadow);
              padding: 20px;
            }
            .rel-html__group h3 {
              margin: 0 0 16px;
              font-size: 1.1rem;
            }
            .rel-html__list {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .rel-html__row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              padding: 10px 12px;
              border-radius: 10px;
              background: var(--surface-2);
            }
            .rel-html__row small {
              color: var(--muted);
            }
            .rel-html__status {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 999px;
              background: rgba(59,130,246,0.12);
              color: var(--primary);
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <div class="rel-html">
            <header class="rel-html__header">
              <div>
                <h1>${PERFIL_LABEL[perfil] || "Usuário"}</h1>
                <p>Visão consolidada dos chamados por perfil de acesso.</p>
              </div>
            </header>


            <section class="rel-html__summary">
              ${resumo
                .map(
                  ([label, valor]) => `
                    <div class="rel-html__card">
                      <span>${label}</span>
                      <strong>${valor}</strong>
                    </div>
                  `,
                )
                .join("")}
            </section>

            <section class="rel-html__grid">
              ${renderLista("Status", chamadosPorStatus)}
              ${renderLista("Prioridade", chamadosPorPrioridade)}
            </section>

            ${acessos.includes("periodo") ? renderLista("Ocorrências por período", chamadosPorPeriodo) : ""}
            ${acessos.includes("ambiente") ? renderLista("Ocorrências por ambiente", chamadosPorAmbiente) : ""}
            ${
              acessos.includes("usuarios")
                ? renderLista(
                    "Usuários",
                    chamadosPorUsuario.map((item) => ({
                      label: item.nome,
                      total: item.total,
                    })),
                  )
                : ""
            }
            ${
              acessos.includes("historico")
                ? `
              <section class="rel-html__group">
                <h3>Histórico</h3>
                <div class="rel-html__list">
                  ${historico
                    .map((chamado) => {
                      const solicitante = usuarioMap[chamado.solicitanteId];
                      const responsavel = usuarioMap[chamado.responsavelId];
                      return `
                        <div class="rel-html__row">
                          <div>
                            <strong>${chamado.numero}</strong><br />
                            <small>${chamado.titulo}</small>
                          </div>
                          <div>
                            <span class="rel-html__status">${STATUS_LABEL[chamado.status] || chamado.status}</span>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              </section>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `;
  }

  // Gera e baixa os dados no formato solicitado pelo usuário.
  function exportarRelatorio(tipo = "csv") {
    const dadosExportacao = {
      perfil,
      geradoEm: new Date().toISOString(),
      resumo: {
        total: chamadosVisiveis.length,
        abertos: chamadosVisiveis.filter((item) =>
          ["aberto", "em_andamento", "aguardando"].includes(item.status),
        ).length,
        resolvidos: chamadosVisiveis.filter((item) =>
          ["resolvido", "fechado"].includes(item.status),
        ).length,
      },
      periodo: acessos.includes("periodo") ? chamadosPorPeriodo : [],
      ambiente: acessos.includes("ambiente") ? chamadosPorAmbiente : [],
      prioridade: acessos.includes("prioridade") ? chamadosPorPrioridade : [],
      status: acessos.includes("status") ? chamadosPorStatus : [],
      tecnicos: acessos.includes("tecnicos") ? tecnicos : [],
      usuarios: acessos.includes("usuarios") ? chamadosPorUsuario : [],
      historico: acessos.includes("historico") ? historico : [],
    };

    const baixar = (conteudo, nomeArquivo, mimeType) => {
      const blob = new Blob([conteudo], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivo;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMensagemExportacao(`Arquivo exportado: ${nomeArquivo}`);
      window.setTimeout(() => setMensagemExportacao(""), 2500);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    if (tipo === "json") {
      baixar(
        JSON.stringify(dadosExportacao, null, 2),
        `relatorio-${perfil}.json`,
        "application/json;charset=utf-8;",
      );
      return;
    }

    if (["word", "ppt", "pdf", "html"].includes(tipo)) {
      baixar(
        gerarHtmlRelatorio(),
        `relatorio-${perfil}.html`,
        "text/html;charset=utf-8;",
      );
      return;
    }

    const linhas = [];
    const cabecalho = ["Categoria", "Descrição"];
    linhas.push(cabecalho.join(","));

    if (acessos.includes("geral")) {
      linhas.push(
        ["Total de chamados", dadosExportacao.resumo.total].join(","),
      );
      linhas.push(["Abertos", dadosExportacao.resumo.abertos].join(","));
      linhas.push(["Resolvidos", dadosExportacao.resumo.resolvidos].join(","));
    }

    if (acessos.includes("periodo")) {
      dadosExportacao.periodo.forEach((item) =>
        linhas.push(["Período", `${item.label}: ${item.total}`].join(",")),
      );
    }

    if (acessos.includes("ambiente")) {
      dadosExportacao.ambiente.forEach((item) =>
        linhas.push(["Ambiente", `${item.label}: ${item.total}`].join(",")),
      );
    }

    if (acessos.includes("prioridade")) {
      dadosExportacao.prioridade.forEach((item) =>
        linhas.push(["Prioridade", `${item.label}: ${item.total}`].join(",")),
      );
    }

    if (acessos.includes("status")) {
      dadosExportacao.status.forEach((item) =>
        linhas.push(["Status", `${item.label}: ${item.total}`].join(",")),
      );
    }

    const csv = linhas.join("\n");
    baixar(csv, `relatorio-${perfil}.csv`, "text/csv;charset=utf-8;");
  }

  const metricasBase = [
    { label: "Total", valor: chamadosVisiveis.length, destaque: true },
    {
      label: "Abertos",
      valor: chamadosVisiveis.filter((item) =>
        ["aberto", "em_andamento", "aguardando"].includes(item.status),
      ).length,
    },
    {
      label: "Resolvidos",
      valor: chamadosVisiveis.filter((item) =>
        ["resolvido", "fechado"].includes(item.status),
      ).length,
    },
    {
      label: "Tempo médio dos chamados",
      valor: formatarHoras(mediaAtendimentoMs),
    },
  ];

  return (
    <div className="page page--reports">
      <header className="page__header">
        <div>
          {/* <span className="eyebrow">Relatórios</span> */}
          <h1>{PERFIL_LABEL[perfil] || "Usuário"}</h1>
          <p className="muted">
            Visão consolidada dos chamados por perfil de acesso.
          </p>
        </div>

        {mensagemExportacao && (
          <div className="report-export__status">{mensagemExportacao}</div>
        )}

        <div className="topbar__actions">
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
        </div>

        {acessos.includes("exportar") && (
          <div className="report-export">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setMenuExportarAberto((ativo) => !ativo)}
            >
              Exportar
            </button>

            {menuExportarAberto && (
              <div className="report-export__menu">
                <button
                  type="button"
                  onClick={() => {
                    exportarRelatorio("Excel");
                    setMenuExportarAberto(false);
                  }}
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportarRelatorio("word");
                    setMenuExportarAberto(false);
                  }}
                >
                  Word
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportarRelatorio("pdf");
                    setMenuExportarAberto(false);
                  }}
                >
                  PDF
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <section className="report-container">
        <section className="report-summary">
          {metricasBase.map((item) => (
            <div
              key={item.label}
              className={`report-summary__card ${item.destaque ? "is-featured" : ""}`}
            >
              <span>{item.label}</span>
              <strong>{item.valor}</strong>
            </div>
          ))}
        </section>

        {acessos.includes("geral") && (
          <div className="card">
            <div className="card__header">
              <h2>Relatório geral de ocorrências</h2>
            </div>

            <div className="report-grid">
              <div className="report-list">
                <h3>Por status</h3>
                {chamadosPorStatus.map((item) => (
                  <div key={item.label} className="report-row">
                    <span>{item.label}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>

              <div className="report-list">
                <h3>Por prioridade</h3>
                {chamadosPorPrioridade.map((item) => (
                  <div key={item.label} className="report-row">
                    <span>{item.label}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {acessos.includes("periodo") && (
          <div className="card">
            <div className="card__header">
              <h2>Ocorrências por período</h2>
            </div>
            <div className="report-list report-list--compact">
              {chamadosPorPeriodo.map((item) => (
                <div key={item.label} className="report-row">
                  <span>{item.label}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("ambiente") && (
          <div className="card">
            <div className="card__header">
              <h2>Ocorrências por ambiente</h2>
            </div>
            <div className="report-list report-list--compact">
              {chamadosPorAmbiente.map((item) => (
                <div key={item.label} className="report-row">
                  <span>{item.label}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("prioridade") && (
          <div className="card">
            <div className="card__header">
              <h2>Ocorrências por prioridade</h2>
            </div>
            <div className="report-list report-list--compact">
              {chamadosPorPrioridade.map((item) => (
                <div key={item.label} className="report-row">
                  <span>{item.label}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("status") && (
          <div className="card__relatorios">
            <div className="card__header">
              <h2>Ocorrências por status</h2>
            </div>
            <div className="report-list report-list--compact">
              {chamadosPorStatus.map((item) => (
                <div key={item.label} className="report-row">
                  <span>{item.label}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("tecnicos") && (
          <div className="card">
            <div className="card__header">
              <h2>Desempenho dos técnicos</h2>
            </div>
            <div className="report-list report-list--compact">
              {tecnicos.map((item) => (
                <div key={item.nome} className="report-row">
                  <span>{item.nome}</span>
                  <strong>{item.atendidos} chamados</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("usuarios") && (
          <div className="card">
            <div className="card__header">
              <h2>Usuários que abriram chamados</h2>
            </div>
            <div className="report-list report-list--compact">
              {chamadosPorUsuario.map((item) => (
                <div key={item.nome} className="report-row">
                  <span>{item.nome}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {acessos.includes("proprio") && (
          <div className="card">
            <div className="card__header">
              <h2>Seus chamados</h2>
            </div>
            <div className="report-grid">
              <div className="report-list">
                <h3>Resumo</h3>
                <div className="report-row">
                  <span>Pendentes</span>
                  <strong>{meusChamadosResumo.abertos}</strong>
                </div>
                <div className="report-row">
                  <span>Em andamento</span>
                  <strong>{meusChamadosResumo.andamento}</strong>
                </div>
                <div className="report-row">
                  <span>Concluídos</span>
                  <strong>{meusChamadosResumo.concluido}</strong>
                </div>
              </div>
              <div className="report-list">
                <h3>Tempo médio</h3>
                <div className="report-metric report-metric--compact">
                  <strong>{formatarHoras(tempoMedioUsuario)}</strong>
                  <span>média do seu atendimento</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* {acessos.includes("meus") && (
        <div className="card">
          <div className="card__header">
            <h2>Meus chamados</h2>
          </div>
          <div className="report-list report-list--compact">
            {meusChamadosData.length ? (
              meusChamadosData.slice(0, 6).map((chamado) => (
                <div
                  key={chamado.id}
                  className="report-row report-row--history"
                >
                  <div>
                    <span>{chamado.numero}</span>
                    <small>{chamado.titulo}</small>
                  </div>
                  <strong>
                    {STATUS_LABEL[chamado.status] || chamado.status}
                  </strong>
                </div>
              ))
            ) : (
              <p className="muted">
                Ainda não há chamados vinculados ao seu usuário.
              </p>
            )}
          </div>
        </div>
      )} */}

      {acessos.includes("historico") && (
        <div className="card_historico">
          <div className="card__header">
            <h2>Histórico completo</h2>
          </div>
          <div className="report-history">
            {historico.map((chamado) => {
              const solicitante = usuarioMap[chamado.solicitanteId];
              const responsavel = usuarioMap[chamado.responsavelId];
              return (
                <div key={chamado.id} className="report-history__item">
                  <div>
                    <strong>{chamado.numero}</strong>
                    <span>{chamado.titulo}</span>
                  </div>
                  <div>
                    <small>Solicitante: {solicitante?.nome || "—"}</small>
                    <small>
                      Responsável: {responsavel?.nome || "Não atribuído"}
                    </small>
                  </div>
                  <div>
                    <small>
                      {STATUS_LABEL[chamado.status] || chamado.status}
                    </small>
                    <small>{chamado.categoria}</small>
                  </div>
                  <time>
                    {formatarData(
                      Number(chamado.atualizadoEm || chamado.criadoEm),
                    )}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
