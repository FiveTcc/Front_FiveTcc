import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import logoNOS from "../icon/logoNOS.png";

import userService from "../services/userServices";

const ICONS = {
  painel: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
      <path d="M12 13l4-4" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  perfil: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  ),
  chamados: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path d="M5 4h11l3 3v13H5z" strokeLinejoin="round" />
      <path d="M9 10h6M9 13.5h6M9 17h3.5" strokeLinecap="round" />
    </svg>
  ),
  usuarios: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path
        d="M16 8.5a2.7 2.7 0 1 1 0-5.4M19 19a4.6 4.6 0 0 0-3.8-4.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  relatorios: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path d="M6 18V9M12 18V5M18 18v-8" strokeLinecap="round" />
      <path d="M4 18h16" strokeLinecap="round" />
    </svg>
  ),
  ambientes: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path d="M4 20h16" strokeLinecap="round" />
      <path d="M6 20V5h8v15" strokeLinejoin="round" />
      <path d="M14 9h4v11" strokeLinejoin="round" />
      <path d="M9 9h2M9 12.5h2M9 16h2" strokeLinecap="round" />
    </svg>
  ),
};

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  } catch {
    return "light";
  }
}

function getNavLinkClassName({ isActive }) {
  return `sidebar__link${isActive ? " is-active" : ""}`;
}

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [FotoPerfil, setFotoPerfil] = useState("");

  const PERFIL_LABEL = {
    admin: "Administrador",
    tecnico: "Técnico",
    funcionario: "Funcionário",
  };

  useEffect(() => {
    async function buscarNome() {
      try {
        const response = await userService.buscarperfil();
        setNome(response.nome || response.user_nome || "");
        setCargo(
          response.user_tipo || response.cargo || response.user_cargo || "",
        );
        setFotoPerfil(response.FotoPerfil || response.user_imagem);
      } catch (err) {
        console.error(err);
      }
    }

    buscarNome();
  }, [usuario]);

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-toggle${menuAberto ? " is-open" : ""}`}
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-label={menuAberto ? "Esconder menu" : "Mostrar menu"}
        aria-expanded={menuAberto}
      >
        <span />
        <span />
        <span />
      </button>

    <aside className={`sidebar${menuAberto ? " sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <img src={logoNOS} alt="Logo N.O.S." className="sidebar__brand-logo" />
        <div>
          <strong>N.O.S</strong>
          <small>New Occurrence System</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/painel" className={getNavLinkClassName}>
          {ICONS.painel}
          DashBoard
        </NavLink>

        <NavLink to="/chamados" className={getNavLinkClassName}>
          {ICONS.chamados}
          Ocorrências
        </NavLink>

        <NavLink to="/ambientes" className={getNavLinkClassName}>
          {ICONS.ambientes}
          Ambientes
        </NavLink>

        <NavLink to="/relatorios" className={getNavLinkClassName}>
          {ICONS.relatorios}
          Relatórios
        </NavLink>

        {cargo === "admin" && (
          <NavLink to="/usuarios" className={getNavLinkClassName}>
            {ICONS.usuarios}
            Usuários
          </NavLink>
        )}

        <NavLink to="/perfil" className={getNavLinkClassName}>
          {ICONS.perfil}
          Perfil
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          {FotoPerfil ? (
            <img
              src={FotoPerfil}
              alt="Foto de perfil"
              className="sidebar__avatar"
            />
          ) : (
            <span className="avatar">
              {(nome || usuario?.nome)?.[0]?.toUpperCase()}
            </span>
          )}

          <div>
            <strong>{nome || usuario?.nome}</strong>
            <small>
              {PERFIL_LABEL[cargo || usuario?.perfil] ||
                cargo ||
                usuario?.perfil}
            </small>
          </div>
        </div>

        <div className="sidebar__actions">
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
