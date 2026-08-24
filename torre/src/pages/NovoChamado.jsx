import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/storage'
import { useAuth } from '../contexts/AuthContext'

export default function NovoChamado() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState(db.CATEGORIAS[0])
  const [prioridade, setPrioridade] = useState('media')
  const [enviando, setEnviando] = useState(false)
  

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !descricao.trim()) return
    setEnviando(true)
    const criado = db.criarChamado({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria,
      prioridade,
      solicitanteId: usuario.id,
    })
    navigate(`/chamados/${criado.id}`)
  }

  return (
    <div className="page page--narrow">
      <header className="page__header">
        <div>
          <span className="eyebrow">Abertura</span>
          <h1>Novo chamado</h1>
          <p className="muted">Descreva o problema com o máximo de detalhe possível para agilizar o atendimento.</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Título
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Impressora do RH sem tinta"
            required
          />
        </label>

        <label>
          Descrição
          <textarea
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Conte o que aconteceu, quando começou e o que já foi tentado…"
            required
          />
        </label>

        <div className="form__row">
          <label>
            Categoria
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {db.CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            Prioridade
            <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </label>
        </div>

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>Abrir chamado</button>
        </div>
      </form>
    </div>
  )
}
