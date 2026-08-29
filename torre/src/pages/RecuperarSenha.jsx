import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim()) {
      setErro('Informe um e-mail válido.')
      return
    }

    setErro('')
    setCarregando(true)

    try {
     await api.post('auth/recuperar-senha', {
      email: email.trim(),
    })

    console.log(email)

      setEnviado(true)
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error)
      setErro(
        error.response?.data?.message ||
          'Não foi possível enviar as instruções. Tente novamente.'
      )
    } finally {
      setCarregando(false)
    }
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

             {erro && (
              <div className="recovery-error">
                {erro}
              </div>
            )}
            
            <button type="submit" className="btn btn--primary recovery-form__submit"
            disabled={carregando}
            >
              {
                carregando
                 ? 'Enviando...'
                : 'Enviar'
              }
              
            </button>
          </form>
        )}

        <Link to="/login" className="recovery-back">← Voltar para o login</Link>
      </div>
    </div>
  )
}
