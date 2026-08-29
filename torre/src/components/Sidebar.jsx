import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import logoNOS from "../icon/logoNOS.png";

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
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={logoNOS} alt="Logo N.O.S." className="sidebar__brand-logo" />
        <div>
          <strong>N.O.S.</strong>
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
          Chamados
        </NavLink>
        {usuario?.perfil === "admin" && (
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
          <span className="avatar">{usuario?.nome?.[0]}</span>
          <div>
            <strong>{usuario?.nome}</strong>
            <small>{usuario?.perfil}</small>
          </div>
        </div>

        <div className="sidebar__actions">
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
