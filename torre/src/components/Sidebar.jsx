import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

const ICONS = {
  painel: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
      <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
      <path d="M12 13l4-4" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  chamados: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
      <path d="M5 4h11l3 3v13H5z" strokeLinejoin="round" />
      <path d="M9 10h6M9 13.5h6M9 17h3.5" strokeLinecap="round" />
    </svg>
  ),
  usuarios: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path d="M16 8.5a2.7 2.7 0 1 1 0-5.4M19 19a4.6 4.6 0 0 0-3.8-4.5" strokeLinecap="round" />
    </svg>
  ),
}

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true" />
        <div>
          <strong>TORRE</strong>
          <small>controle de chamados</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/painel" className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
          {ICONS.painel}
          Painel
        </NavLink>
        <NavLink to="/chamados" className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
          {ICONS.chamados}
          Chamados
        </NavLink>
        {usuario?.perfil === 'admin' && (
          <NavLink to="/usuarios" className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
            {ICONS.usuarios}
            Usuários
          </NavLink>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="avatar">{usuario?.nome?.[0]}</span>
          <div>
            <strong>{usuario?.nome}</strong>
            <small>{usuario?.perfil}</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn--ghost btn--sm" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === 'dark' ? 'Escuro' : 'Claro'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={logout}>Sair</button>
        </div>
      </div>
    </aside>
  )
}
