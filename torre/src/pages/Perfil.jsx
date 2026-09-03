import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/storage";
import { tempoRelativo } from "../services/utils";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";

const PERFIL_LABEL = {
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Assistente Administrativa",
};

export default function Perfil() {
  const { usuario, atualizarSessao } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nome: "", email: "" });
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  });
  const [perfilErro, setPerfilErro] = useState("");
  const [perfilSucesso, setPerfilSucesso] = useState("");
  const [senhaErro, setSenhaErro] = useState("");
  const [senhaSucesso, setSenhaSucesso] = useState("");

  useEffect(() => {
    if (usuario) {
      setPerfilForm({ nome: usuario.nome || "", email: usuario.email || "" });
    }
  }, [usuario]);

  if (!usuario) return <Navigate to="/login" replace />;

  const meusChamados = useMemo(() => {
    return db
      .listarChamados()
      .filter(
        (chamado) =>
          chamado.solicitanteId === usuario.id ||
          chamado.responsavelId === usuario.id,
      );
  }, [usuario.id]);

  const total = meusChamados.length;
  const abertos = meusChamados.filter((c) => c.status === "aberto").length;
  const andamento = meusChamados.filter(
    (c) => c.status === "em_andamento",
  ).length;
  const concluidos = meusChamados.filter(
    (c) => c.status === "resolvido" || c.status === "fechado",
  ).length;
  const ultimoChamado = meusChamados[0];

  function handlePerfilChange(event) {
    const { name, value } = event.target;
    setPerfilForm((atual) => ({ ...atual, [name]: value }));
  }

  function handleSenhaChange(event) {
    const { name, value } = event.target;
    setSenhaForm((atual) => ({ ...atual, [name]: value }));
  }

  function handleSalvarPerfil(event) {
    event.preventDefault();
    const resultado = db.atualizarUsuario(usuario.id, {
      nome: perfilForm.nome,
      email: perfilForm.email,
    });

    if (!resultado.ok) {
      setPerfilErro(resultado.erro);
      setPerfilSucesso("");
      return;
    }

    const dadosSessao = {
      nome: resultado.usuario.nome,
      email: resultado.usuario.email,
      telefone: resultado.usuario.telefone || "",
      setor: resultado.usuario.setor || "",
      cargo: resultado.usuario.cargo || "",
    };

    atualizarSessao(dadosSessao);
    setPerfilForm({
      nome: resultado.usuario.nome,
      email: resultado.usuario.email,
    });

    setPerfilErro("");
    setPerfilSucesso("Perfil atualizado com sucesso.");
    setEditMode(false);
  }

  function handleSalvarSenha(event) {
    event.preventDefault();
    const resultado = db.alterarSenha(usuario.id, senhaForm);

    if (!resultado.ok) {
      setSenhaErro(resultado.erro);
      setSenhaSucesso("");
      return;
    }

    setSenhaErro("");
    setSenhaSucesso("Senha alterada com sucesso.");
    setSenhaForm({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
  }

  function toggleEditMode() {
    setEditMode((atual) => !atual);
    setPerfilErro("");
    setPerfilSucesso("");
  }

  return (
    <div className="profile-shell">
      <section className="profile-section">
        <div className="section-title">
          <span className="section-title__icon">✎</span>
          <h3>Dados pessoais</h3>
        </div>

        <form className="profile-form" onSubmit={handleSalvarPerfil}>
          <div className="profile-form__grid">
            <label className="field-block">
              <span>Nome completo</span>
              <input
                type="text"
                name="nome"
                value={perfilForm.nome}
                onChange={handlePerfilChange}
                readOnly={!editMode}
              />
            </label>

            <label className="field-block">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                value={perfilForm.email}
                onChange={handlePerfilChange}
                readOnly={!editMode}
              />
            </label>

            <label className="field-block">
              <span>Telefone</span>
              <input type="text" value="(11) 98876-4410" readOnly />
            </label>

            <label className="field-block">
              <span>Setor</span>
              <input type="text" value="Secretaria Acadêmica" readOnly />
            </label>

            <label className="field-block">
              <span>Cargo</span>
              <input
                type="text"
                value={
                  PERFIL_LABEL[usuario?.perfil] || usuario?.perfil || "Usuário"
                }
                readOnly
              />
            </label>
          </div>

          {editMode && (
            <div className="profile-form__actions">
              <button type="submit" className="btn btn--primary">
                Salvar perfil
              </button>
            </div>
          )}

          {perfilErro && (
            <p className="form-message form-message--error">{perfilErro}</p>
          )}
          {perfilSucesso && (
            <p className="form-message form-message--success">
              {perfilSucesso}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
