import { useState } from 'react'
import { db } from '../services/storage'
import { iniciais } from '../services/utils'

const PERFIL_LABEL = { admin: 'Administrador', tecnico: 'Técnico', usuario: 'Usuário' }

const formInicial = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'usuario',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(() => db.listarUsuarios())
  const [chamados] = useState(() => db.listarChamados())
  const [form, setForm] = useState(formInicial)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const chamadosPorUsuario = (id) => chamados.filter((c) => c.responsavelId === id || c.solicitanteId === id).length

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
    if (sucesso) setSucesso('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const resultado = db.criarUsuario(form)

    if (!resultado.ok) {
      setErro(resultado.erro)
      setSucesso('')
      return
    }

    setUsuarios(db.listarUsuarios())
    setForm(formInicial)
    setErro('')
    setSucesso(`Usuário criado com sucesso: ${resultado.usuario.nome}.`)
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Usuários</h1>
          <p className="muted">Pessoas com acesso à central de chamados.</p>
        </div>
      </header>

      <div className="card">
        <div className="card__header">
          <h2>Novo usuário</h2>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form__row">
            <label>
              Nome
              <input name="nome" value={form.nome} onChange={handleChange} placeholder="Ex.: Ana Souza" />
            </label>
            <label>
              Perfil
              <select name="perfil" value={form.perfil} onChange={handleChange}>
                <option value="usuario">Usuário</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>

          <div className="form__row">
            <label>
              E-mail
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="nome@torre.edu" />
            </label>
            <label>
              Senha inicial
              <input type="password" name="senha" value={form.senha} onChange={handleChange} placeholder="Digite uma senha" />
            </label>
          </div>

          {erro && <div className="login__erro">{erro}</div>}
          {sucesso && <div className="form__success">{sucesso}</div>}

          <div className="form__actions">
            <button type="submit" className="btn btn--primary">Salvar usuário</button>
          </div>
        </form>
      </div>

      <div className="card card--table">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Chamados vinculados</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td><span className="avatar avatar--sm">{iniciais(u.nome)}</span></td>
                <td className="table__title">{u.nome}</td>
                <td className="muted">{u.email}</td>
                <td><span className={`chip chip--${u.perfil}`}>{PERFIL_LABEL[u.perfil]}</span></td>
                <td className="muted">{chamadosPorUsuario(u.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
