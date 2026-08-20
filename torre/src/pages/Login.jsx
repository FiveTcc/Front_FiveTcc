import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { usuario, login } = useAuth()
  const [email, setEmail] = useState('admin@torre.edu')
  const [senha, setSenha] = useState('admin123')
  const [erro, setErro] = useState('')

  if (usuario) return <Navigate to="/painel" replace />

  function handleSubmit(e) {
    e.preventDefault()
    const resultado = login(email, senha)
    if (!resultado.ok) setErro(resultado.erro)
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <span className="sidebar__brand-mark sidebar__brand-mark--lg" aria-hidden="true" />
          <h1>TORRE</h1>
          <p>Central de chamados de TI — visibilidade total, do abertura ao fechamento.</p>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </label>
          {erro && <p className="login__erro">{erro}</p>}
          <button type="submit" className="btn btn--primary">Entrar</button>
        </form>

      </div>

      <div className="login__side" aria-hidden="true">
        <div className="radar">
          <div className="radar__sweep" />
          {[1, 2, 3].map((n) => <div key={n} className="radar__ring" />)}
        </div>
      </div>
    </div>
  )
}
