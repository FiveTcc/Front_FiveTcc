import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setEnviado(true)
  }

  return (
    <div className="login recovery-page">
      <div className="recovery-card">
        <span className="eyebrow">Acesso seguro</span>
        <h1>Recuperar senha</h1>
        <p className="muted">
          Informe seu e-mail corporativo e enviaremos as instruções para redefinir sua senha.
        </p>

        {enviado ? (
          <div className="recovery-message" role="status">
            Se o e-mail estiver cadastrado, você receberá as instruções em instantes.
          </div>
        ) : (
          <form className="recovery-form" onSubmit={handleSubmit}>
            <label className="recovery-field">
              <span>E-mail corporativo</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu.email@torre.edu"
                required
              />
            </label>
            <button type="submit" className="btn btn--primary recovery-form__submit">
              Enviar instruções
            </button>
          </form>
        )}

        <Link to="/login" className="recovery-back">← Voltar para o login</Link>
      </div>
    </div>
  )
}
