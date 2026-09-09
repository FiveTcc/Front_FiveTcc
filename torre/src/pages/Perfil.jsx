import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import api from "../services/api";
import userService from "../services/userServices";

const PERFIL_LABEL = { admin: 'Administrador',  tecnico: 'Técnico', funcionario: 'Funcionário' };

export default function Perfil() {
  const { usuario, logout } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nome: "", email: "", telefone: "", setor: "" , cargo: ""});
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [perfilErro, setPerfilErro] = useState("");
  const [perfilSucesso, setPerfilSucesso] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      try {
        setCarregandoPerfil(true);
        const perfilData = await userService.buscarperfil();
        console.log("buscarperfil ->", perfilData);
        setPerfil(perfilData);
        setPerfilForm({
          nome: perfilData.nome || perfilData.user_nome || "",
          email: perfilData.email || perfilData.user_email || "",
          telefone: perfilData.telefone || perfilData.user_telefone || perfilData.user_tel || "",
          cargo: perfilData.user_tipo || perfilData.cargo || perfilData.user_cargo || ""
        });
      } catch (err) {
        console.error(err);
        setPerfilErro("Erro ao carregar perfil.");
      }
      finally {
        setCarregandoPerfil(false);
      }
    }

    carregarPerfil();
  }, []);

  function handlePerfilChange(event) {
    const { name, value } = event.target;
    setPerfilForm((prev) => ({ ...prev, [name]: value }));
    if (perfilErro) setPerfilErro("");
    if (perfilSucesso) setPerfilSucesso("");
  }

  function handleFotoPerfilChange(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    setFotoPerfil(URL.createObjectURL(arquivo));
  }

  async function handleSalvarPerfil(event) {
    event.preventDefault();

    try {
      const response = await api.put("/user/perfil", perfilForm);
      setPerfil(response.data || perfilForm);
      setPerfilSucesso("Perfil salvo com sucesso.");
      setPerfilErro("");
      setEditMode(false);
    } catch (error) {
      console.error(error);
      setPerfilErro(error?.response?.data?.message || error.message || "Erro ao salvar perfil.");
      setPerfilSucesso("");
    }
  }

  return (
    <div className="profile-shell">
      {carregandoPerfil && <p>Carregando perfil...</p>}
      <section className="profile-section">
        <div className="section-title">
          <span className="section-title__icon">✎</span>
          <h3>Dados pessoais</h3>
        </div>

        <div className="profile-photo">
          <div className="profile-photo__preview">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Foto de perfil" />
            ) : (
              <span>{(perfilForm.nome || usuario?.nome || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>

          <label className="btn btn--ghost profile-photo__button">
            Editar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoPerfilChange}
            />
          </label>
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
              <input type="text" name="telefone" value={perfilForm.telefone} onChange={handlePerfilChange} readOnly={!editMode} />
            </label>

        
            <label className="field-block">
              <span>Cargo</span>
              <input
                type="text"
                value={PERFIL_LABEL[perfilForm.cargo || perfil?.user_tipo || usuario?.perfil || usuario?.user_tipo] || perfilForm.cargo || perfil?.user_tipo || usuario?.perfil || usuario?.user_tipo || "Usuário"}
                readOnly
              />
            </label>
          </div>

          {!editMode && (
            <div className="profile-form__actions">
              <button type="button" className="btn" onClick={() => setEditMode(true)}>
                Editar perfil
              </button>
            </div>
          )}

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
            <p className="form-message form-message--success">{perfilSucesso}</p>
          )}
        </form>
      </section>
    </div>
  );
}
