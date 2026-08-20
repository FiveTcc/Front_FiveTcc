import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../services/storage'
import { tempoRelativo } from '../services/utils'
import StatusBeacon from '../components/StatusBeacon'
import PriorityBadge from '../components/PriorityBadge'

export default function Chamados() {
  const todos = useMemo(() => db.listarChamados(), [])
  const usuarios = useMemo(() => db.listarUsuarios(), [])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas')

  const usuarioPorId = (id) => usuarios.find((u) => u.id === id)

  const filtrados = todos.filter((c) => {
    const buscaOk = (c.titulo + c.numero + c.categoria).toLowerCase().includes(busca.toLowerCase())
    const statusOk = filtroStatus === 'todos' || c.status === filtroStatus
    const prioridadeOk = filtroPrioridade === 'todas' || c.prioridade === filtroPrioridade
    return buscaOk && statusOk && prioridadeOk
  })

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <span className="eyebrow">{filtrados.length} de {todos.length}</span>
          <h1>Chamados</h1>
          <p className="muted">Acompanhe, filtre e priorize as solicitações abertas.</p>
        </div>
        <Link to="/chamados/novo" className="btn btn--primary">+ Novo chamado</Link>
      </header>

      <div className="filters">
        <input
          type="search"
          placeholder="Buscar por título, código ou categoria…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="filters__search"
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
        </select>
        <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)}>
          <option value="todas">Todas as prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>

      <div className="card card--table">
        {filtrados.length === 0 ? (
          <div className="empty">
            <strong>Nenhum chamado encontrado</strong>
            <p>Ajuste os filtros ou abra um novo chamado para começar.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Código</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const responsavel = usuarioPorId(c.responsavelId)
                return (
                  <tr key={c.id}>
                    <td><StatusBeacon status={c.status} comLabel={false} /></td>
                    <td>
                      <Link to={`/chamados/${c.id}`} className="table__code">{c.numero}</Link>
                    </td>
                    <td>
                      <Link to={`/chamados/${c.id}`} className="table__title">{c.titulo}</Link>
                    </td>
                    <td className="muted">{c.categoria}</td>
                    <td><PriorityBadge prioridade={c.prioridade} /></td>
                    <td className="muted">{responsavel ? responsavel.nome : 'Não atribuído'}</td>
                    <td className="muted">{tempoRelativo(c.atualizadoEm)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
