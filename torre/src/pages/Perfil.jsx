import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../services/storage'
import { tempoRelativo } from '../services/utils'
import StatusBeacon from '../components/StatusBeacon'
import PriorityBadge from '../components/PriorityBadge'

const PERFIL_LABEL = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  usuario: 'Assistente Administrativa',
}

export default function Perfil() {
  const { usuario, atualizarSessao } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [perfilForm, setPerfilForm] = useState({ nome: '', email: '' })
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })
  const [perfilErro, setPerfilErro] = useState('')
  const [perfilSucesso, setPerfilSucesso] = useState('')
  const [senhaErro, setSenhaErro] = useState('')
  const [senhaSucesso, setSenhaSucesso] = useState('')

  useEffect(() => {
    if (usuario) {
      setPerfilForm({ nome: usuario.nome || '', email: usuario.email || '' })
    }
  }, [usuario])

  if (!usuario) return <Navigate to="/login" replace />

  const meusChamados = useMemo(() => {
    return db
      .listarChamados()
      .filter((chamado) => chamado.solicitanteId === usuario.id || chamado.responsavelId === usuario.id)
  }, [usuario.id])

  const total = meusChamados.length
  const abertos = meusChamados.filter((c) => c.status === 'aberto').length
  const andamento = meusChamados.filter((c) => c.status === 'em_andamento').length
  const concluidos = meusChamados.filter((c) => c.status === 'resolvido' || c.status === 'fechado').length
  const ultimoChamado = meusChamados[0]

  function handlePerfilChange(event) {
    const { name, value } = event.target
    setPerfilForm((atual) => ({ ...atual, [name]: value }))
  }

  function handleSenhaChange(event) {
    const { name, value } = event.target
    setSenhaForm((atual) => ({ ...atual, [name]: value }))
  }

  function handleSalvarPerfil(event) {
    event.preventDefault()
    const resultado = db.atualizarUsuario(usuario.id, {
      nome: perfilForm.nome,
      email: perfilForm.email,
    })

    if (!resultado.ok) {
      setPerfilErro(resultado.erro)
      setPerfilSucesso('')
      return
    }

    const dadosSessao = {
      nome: resultado.usuario.nome,
      email: resultado.usuario.email,
      telefone: resultado.usuario.telefone || '',
      setor: resultado.usuario.setor || '',
      cargo: resultado.usuario.cargo || '',
    }

    atualizarSessao(dadosSessao)
    setPerfilForm({
      nome: resultado.usuario.nome,
      email: resultado.usuario.email,
    })

    setPerfilErro('')
    setPerfilSucesso('Perfil atualizado com sucesso.')
    setEditMode(false)
  }

  function handleSalvarSenha(event) {
    event.preventDefault()
    const resultado = db.alterarSenha(usuario.id, senhaForm)

    if (!resultado.ok) {
      setSenhaErro(resultado.erro)
      setSenhaSucesso('')
      return
    }

    setSenhaErro('')
    setSenhaSucesso('Senha alterada com sucesso.')
    setSenhaForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })
  }

  function toggleEditMode() {
    setEditMode((atual) => !atual)
    setPerfilErro('')
    setPerfilSucesso('')
  }

  return (
    <div className="profile-shell">
      <section className="profile-section">
        <div className="section-title">
          <span className="section-title__icon">✎</span>
          <h3>Dados pessoais</h3>
        </div>

        <form className="profile-form" onSubmit={handleSalvarPerfil}>
          <div className="profile-form__grid">
            <label className="field-block">
              <span>Nome completo</span>
              <input
                type="text"
                name="nome"
                value={perfilForm.nome}
                onChange={handlePerfilChange}
                readOnly={!editMode}
              />
            </label>

            <label className="field-block">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                value={perfilForm.email}
                onChange={handlePerfilChange}
                readOnly={!editMode}
              />
            </label>

            <label className="field-block">
              <span>Telefone</span>
              <input type="text" value="(11) 98876-4410" readOnly />
            </label>

            <label className="field-block">
              <span>Setor</span>
              <input type="text" value="Secretaria Acadêmica" readOnly />
            </label>

            <label className="field-block">
              <span>Cargo</span>
              <input type="text" value={PERFIL_LABEL[usuario?.perfil] || usuario?.perfil || 'Usuário'} readOnly />
            </label>
          </div>

          {editMode && (
            <div className="profile-form__actions">
              <button type="submit" className="btn btn--primary">Salvar perfil</button>
            </div>
          )}

          {perfilErro && <p className="form-message form-message--error">{perfilErro}</p>}
          {perfilSucesso && <p className="form-message form-message--success">{perfilSucesso}</p>}
        </form>
      </section>

      <section className="profile-section">
        <div className="section-title">
          <span className="section-title__icon">▣</span>
          <h3>Meus dados</h3>
        </div>

        <div className="summary-grid">
          <div className="summary-card summary-card--total">
            <div className="summary-card__icon">▣</div>
            <div>
              <strong>{total}</strong>
              <span>Total enviados</span>
            </div>
          </div>

          <div className="summary-card summary-card--warning">
            <div className="summary-card__icon">◔</div>
            <div>
              <strong>{abertos}</strong>
              <span>Aberto</span>
            </div>
          </div>

          <div className="summary-card summary-card--info">
            <div className="summary-card__icon">◫</div>
            <div>
              <strong>{andamento}</strong>
              <span>Em andamento</span>
            </div>
          </div>

          <div className="summary-card summary-card--success">
            <div className="summary-card__icon">◉</div>
            <div>
              <strong>{concluidos}</strong>
              <span>Concluídos</span>
            </div>
          </div>
        </div>

        <div className="summary-meta">
          {ultimoChamado ? (
            <>Último chamado enviado: #{ultimoChamado.numero}</>
          ) : (
            'Ainda não há chamados registrados.'
          )}
        </div>
      </section>

      <section className="profile-section profile-security">
        <div className="section-title">
          <span className="section-title__icon">◌</span>
          <h3>Segurança</h3>
        </div>

        <form className="profile-security__form" onSubmit={handleSalvarSenha}>
          <div className="security-grid">
            <label className="field-block">
              <span>Senha atual</span>
              <input
                type="password"
                name="senhaAtual"
                value={senhaForm.senhaAtual}
                onChange={handleSenhaChange}
                placeholder="Digite a senha atual"
              />
            </label>

            <label className="field-block">
              <span>Nova senha</span>
              <input
                type="password"
                name="novaSenha"
                value={senhaForm.novaSenha}
                onChange={handleSenhaChange}
                placeholder="Nova senha"
              />
            </label>

            <label className="field-block">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                name="confirmarNovaSenha"
                value={senhaForm.confirmarNovaSenha}
                onChange={handleSenhaChange}
                placeholder="Confirmar nova senha"
              />
            </label>
          </div>

          <div className="profile-form__actions">
            <button type="submit" className="btn btn--primary profile-save">Alterar senha</button>
          </div>

          {senhaErro && <p className="form-message form-message--error">{senhaErro}</p>}
          {senhaSucesso && <p className="form-message form-message--success">{senhaSucesso}</p>}
        </form>
      </section>

      <div className="profile-history">
        <div className="section-title section-title--compact">
          <span className="section-title__icon">☰</span>
          <h3>Histórico de chamados</h3>
        </div>

        {meusChamados.length === 0 ? (
          <div className="empty empty--light">
            <strong>Você ainda não tem chamados</strong>
            <p>Quando abrir uma solicitação, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="profile-history__list">
            {meusChamados.map((chamado) => (
              <Link to={`/chamados/${chamado.id}`} key={chamado.id} className="profile-history__item">
                <div className="profile-history__status"><StatusBeacon status={chamado.status} comLabel={false} /></div>
                <div className="profile-history__meta">
                  <strong>{chamado.numero}</strong>
                  <span>{chamado.titulo}</span>
                </div>
                <div className="profile-history__priority"><PriorityBadge prioridade={chamado.prioridade} /></div>
                <div className="profile-history__time">{tempoRelativo(chamado.atualizadoEm)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
