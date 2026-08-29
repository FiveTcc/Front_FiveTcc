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
  const [foto, setFoto] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [openSelect, setOpenSelect] = useState(null)

  const prioridadeLabels = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica',
  }

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
      anexos: [foto, ...arquivos].filter(Boolean).map((arquivo) => ({
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
      })),
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

        <label className="form__description">
          Descrição
          <textarea
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Conte o que aconteceu, quando começou e o que já foi tentado…"
            required
          />
        </label>

        <div className="form__attachments">
          <span>Anexos</span>
          <div className="form__attachment-actions">
            <label className="btn btn--ghost form__file-button">
              Tirar foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
              />
            </label>
            <label className="btn btn--ghost form__file-button">
              Enviar arquivos
              <input
                type="file"
                multiple
                onChange={(e) => setArquivos(Array.from(e.target.files || []))}
              />
            </label>
          </div>
          {(foto || arquivos.length > 0) && (
            <p className="form__attachments-list">
              {[foto, ...arquivos].filter(Boolean).map((arquivo) => arquivo.name).join(', ')}
            </p>
          )}
        </div>

        <div className="form__row">
          <div className="custom-select">
            <span className="custom-select__label">Categoria</span>
            <button
              type="button"
              className={`custom-select__trigger ${openSelect === 'categoria' ? 'is-open' : ''}`}
              onClick={() => setOpenSelect((current) => current === 'categoria' ? null : 'categoria')}
            >
              <span>{categoria}</span>
              <span className="custom-select__caret">▾</span>
            </button>
            {openSelect === 'categoria' && (
              <div className="custom-select__menu" role="listbox" aria-label="Categoria">
                {db.CATEGORIAS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`custom-select__option ${categoria === option ? 'is-selected' : ''}`}
                    onClick={() => {
                      setCategoria(option)
                      setOpenSelect(null)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="custom-select">
            <span className="custom-select__label">Prioridade</span>
            <button
              type="button"
              className={`custom-select__trigger ${openSelect === 'prioridade' ? 'is-open' : ''}`}
              onClick={() => setOpenSelect((current) => current === 'prioridade' ? null : 'prioridade')}
            >
              <span>{prioridadeLabels[prioridade]}</span>
              <span className="custom-select__caret">▾</span>
            </button>
            {openSelect === 'prioridade' && (
              <div className="custom-select__menu" role="listbox" aria-label="Prioridade">
                {Object.entries(prioridadeLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`custom-select__option ${prioridade === value ? 'is-selected' : ''}`}
                    onClick={() => {
                      setPrioridade(value)
                      setOpenSelect(null)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>Abrir chamado</button>
        </div>
      </form>
    </div>
  )
}
