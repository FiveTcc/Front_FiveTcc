import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import StatusBeacon from "../components/StatusBeacon";
import PriorityBadge from "../components/PriorityBadge";
import api from "../services/api";



export default function Perfil() {

  const { usuario, logout } = useAuth();

  
  

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
