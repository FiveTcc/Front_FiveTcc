import { useMemo } from 'react'
import { db } from '../services/storage'
import { iniciais } from '../services/utils'

const PERFIL_LABEL = { admin: 'Administrador', tecnico: 'Técnico', usuario: 'Usuário' }

export default function Usuarios() {
  const usuarios = useMemo(() => db.listarUsuarios(), [])
  const chamados = useMemo(() => db.listarChamados(), [])

  const chamadosPorUsuario = (id) => chamados.filter((c) => c.responsavelId === id || c.solicitanteId === id).length

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Usuários</h1>
          <p className="muted">Pessoas com acesso à central de chamados.</p>
        </div>
      </header>

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
