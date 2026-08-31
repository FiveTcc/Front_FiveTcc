import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../services/storage'

export default function NovaSenha() {
  const [email, setEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    const emailLimpo = email.trim()
    const nova = novaSenha.trim()
    const confirmacao = confirmarSenha.trim()

    if (!emailLimpo) {
      setErro('Informe o e-mail cadastrado.')
      setSucesso('')
      return
    }

    if (!nova || nova.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      setSucesso('')
      return
    }

    if (nova !== confirmacao) {
      setErro('A confirmação da senha não confere com a nova senha.')
      setSucesso('')
      return
    }

    setErro('')
    setCarregando(true)

    const resultado = db.redefinirSenhaPorEmail(emailLimpo, nova, confirmacao)

    if (!resultado.ok) {
      setErro(resultado.erro)
      setSucesso('')
      setCarregando(false)
      return
    }

    setSucesso('Senha redefinida com sucesso. Você já pode voltar para o login.')
    setErro('')
    setEmail('')
    setNovaSenha('')
    setConfirmarSenha('')
    setCarregando(false)
  }

  return (
    <div className="login recovery-page">
      <div className="recovery-card">
        <span className="eyebrow">Acesso seguro</span>
        <h1>Definir nova senha</h1>
        <p className="muted">Crie uma nova senha para continuar com acesso ao sistema.</p>

        <form className="recovery-form recovery-form--reset" onSubmit={handleSubmit}>
          <label className="recovery-field">
            <span>E-mail cadastrado</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu.email@torre.edu"
              autoComplete="email"
            />
          </label>

          <label className="recovery-field">
            <span>Nova senha</span>
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Digite a nova senha"
              autoComplete="new-password"
            />
          </label>

          <label className="recovery-field">
            <span>Confirmar senha</span>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Confirme a nova senha"
              autoComplete="new-password"
            />
          </label>

          {erro && <div className="recovery-error">{erro}</div>}
          {sucesso && <div className="recovery-success">{sucesso}</div>}

          <button type="submit" className="btn btn--primary recovery-form__submit" disabled={carregando}>
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <Link to="/login" className="recovery-back">← Voltar para o login</Link>
      </div>
    </div>
  )
}
