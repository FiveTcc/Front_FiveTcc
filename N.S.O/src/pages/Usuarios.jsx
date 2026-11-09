import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { iniciais } from '../services/utils'

const PERFIL_LABEL = { admin: 'Administrador', tecnico: 'Técnico', usuario: 'Usuário' }

const formInicial = {
  nome: '',
  email: '',
  senha: '',
  perfil: '',
  telefone: '',
  cargo: '',
}

// Exibe os usuários e os formulários administrativos disponíveis nesta tela.
export default function Usuarios() {
  const { usuario: usuarioLogado, atualizarSessao } = useAuth()
  const [usuarios] = useState([])
  const [chamados] = useState([])
  const [form, setForm] = useState(formInicial)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(formInicial)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)
  const [notificacoes] = useState([])
  // const [theme, setTheme] = useState('light')

  // Conta os chamados relacionados ao usuário informado.
  const chamadosPorUsuario = (id) => chamados.filter((c) => c.responsavelId === id || c.solicitanteId === id).length

  // Atualiza os campos do novo usuário e remove mensagens antigas.
  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
    if (sucesso) setSucesso('')
  }

  // Valida o formulário e informa se a criação pode ser concluída.
  function handleSubmit(event) {
    event.preventDefault()
    const resultado = { ok: false, erro: 'Conecte esta tela à API para criar usuários.' }

    if (!resultado.ok) {
      setErro(resultado.erro)
      setSucesso('')
      return
    }

    setForm(formInicial)
    setErro('')
    setSucesso(`Usuário criado com sucesso: ${resultado.usuario.nome}.`)
  }

  // Carrega os dados do usuário selecionado no formulário de edição.
  function abrirEdicao(usuario) {
    setEditId(usuario.id)
    setEditForm({
      nome: usuario.nome || '',
      email: usuario.email || '',
      senha: '',
      perfil: usuario.perfil || 'usuario',
      telefone: usuario.telefone || '',
      cargo: usuario.cargo || '',
    })
    setErro('')
    setSucesso('')
  }

  // Atualiza os campos em edição e limpa mensagens anteriores.
  function handleEditChange(event) {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    if (erro) setErro('')
    if (sucesso) setSucesso('')
  }

  // Envia as alterações do usuário e sincroniza a sessão se necessário.
  function handleEditSubmit(event) {
    event.preventDefault()
    const resultado = { ok: false, erro: 'Conecte esta tela à API para editar usuários.' }

    if (!resultado.ok) {
      setErro(resultado.erro)
      setSucesso('')
      return
    }

    setUsuarios((atual) =>
      atual.map((usuario) => (usuario.id === resultado.usuario.id ? resultado.usuario : usuario))
    )

    if (usuarioLogado?.id === resultado.usuario.id) {
      atualizarSessao({
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        perfil: resultado.usuario.perfil,
        telefone: resultado.usuario.telefone || '',
        setor: resultado.usuario.setor || '',
        cargo: resultado.usuario.cargo || '',
      })
    }

    setEditId('')
    setEditForm(formInicial)
    setErro('')
    setSucesso(`Dados de ${resultado.usuario.nome} atualizados com sucesso.`)
  }

  // Solicita a ativação ou inativação do usuário selecionado.
  function handleToggleAtivo(usuario) {
    const resultado = { ok: false, erro: 'Conecte esta tela à API para alterar o status do usuário.' }

    if (!resultado.ok) {
      setErro(resultado.erro)
      setSucesso('')
      return
    }

    setUsuarios((atual) => atual.map((u) => (u.id === resultado.usuario.id ? resultado.usuario : u)))
    setErro('')
    setSucesso(resultado.usuario.ativo ? `Usuário ${resultado.usuario.nome} ativado.` : `Usuário ${resultado.usuario.nome} inativado.`)
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecalho">
        <div>
          <span className="rotulo-superior">Administração</span>
          <h1>Usuários </h1> 
          <p className="atenuado">Pessoas com acesso à central de chamados.</p>
        </div>

        <div className="barra-superior__acoes">
          <div className="barra-superior__notificacoes-wrap">
            <button
              type="button"
              className="barra-superior__icone-botao"
              aria-label="Notificações"
              onClick={() => setMostrarNotificacoes((valor) => !valor)}
            >
              🕭
            </button>

            {mostrarNotificacoes && (
              <div
                className="barra-superior__notificacoes"
                role="menu"
                aria-label="Notificações"
              >
                <div className="barra-superior__notificacoes-cabecalho">
                  <strong>Notificações</strong>
                  <span>{notificacoes.length}</span>
                </div>

                {notificacoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="barra-superior__notificacao-item"
                  >
                    <span>{item.titulo}</span>
                    <small>{item.tempo}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* <button
            type="button"
            className="barra-superior__icone-botao"
            aria-label={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "dark" ? "light" : "dark"
              )
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button> */}
        </div>
      </header>


      <div className="cartao__novousuario">
        <div className="cartao__cabecalho">
          <h2>Novo usuário</h2>
        </div>

        <form className="formulario usuarios-novo-formulario" onSubmit={handleSubmit} autoComplete="off">
          <div className="formulario__linha">
            <label>
              Nome
              <input name="nome" value={form.nome} onChange={handleChange} placeholder="Ex.: Ana Souza" autoComplete="off" />
            </label>
            <label>
              Perfil
              <select name="perfil" value={form.perfil} onChange={handleChange} autoComplete="off">
                <option value="">Selecione</option>
                <option value="usuario">Usuário</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>

          <div className="formulario__linha">
            <label>
              E-mail
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="nome@torre.edu" autoComplete="off" />
            </label>
            <label>
              Senha inicial
              <input type="password" name="senha" value={form.senha} onChange={handleChange} placeholder="Digite uma senha" autoComplete="new-password" />
            </label>
          </div>

          <div className="formulario__linha">
            <label>
              Telefone
              <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" autoComplete="off" />
            </label>
            <label>
              Cargo
              <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Assistente Administrativa" autoComplete="off" />
            </label>
          </div>

          {erro && <div className="acesso__erro">{erro}</div>}
          {sucesso && <div className="formulario__sucesso">{sucesso}</div>}

          <div className="formulario-novo-usuarios__acoes">
            <button type="submit" className="botao botao--principal">Salvar usuário</button>
          </div>
        </form>
      </div>

      {editId && (
        <div className="cartao">
          <div className="cartao__cabecalho">
            <h2>Editar dados pessoais</h2>
          </div>

          <form className="formulario" onSubmit={handleEditSubmit}>
            <div className="formulario__linha">
              <label>
                Nome
                <input name="nome" value={editForm.nome} onChange={handleEditChange} />
              </label>
              <label>
                Perfil
                <select name="perfil" value={editForm.perfil} onChange={handleEditChange}>
                  <option value="">Selecione</option>
                  <option value="usuario">Usuário</option>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            </div>

            <div className="formulario__linha">
              <label>
                E-mail
                <input type="email" name="email" value={editForm.email} onChange={handleEditChange} />
              </label>

              <label>
                Cargo
                <input name="cargo" value={editForm.cargo} onChange={handleEditChange} />
              </label>
            </div>

            <div className="formulario__linha">
              <label>
                Telefone
                <input name="telefone" value={editForm.telefone} onChange={handleEditChange} />
              </label>
            </div>

            <div className="formulario__acoes">
              <button type="button" className="botao botao--vazado" onClick={() => { setEditId(''); setEditForm(formInicial) }}>Cancelar</button>
              <button type="submit" className="botao botao--principal">Salvar alterações</button>
            </div>
          </form>
        </div>
      )}

      <div className="cartao__tabela cartao--tabela">
        <table className="tabela">
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
                <td><span className="avatar avatar--pequeno">{iniciais(u.nome)}</span></td>
                <td className="tabela__titulo">{u.nome}</td>
                <td className="atenuado">{u.email}</td>
                <td><span className={`etiqueta etiqueta--${u.perfil}`}>{PERFIL_LABEL[u.perfil]}</span></td>
                <td className="atenuado">{chamadosPorUsuario(u.id)}</td>
                <td>
                  <button type="button" className="botao botao--vazado" onClick={() => abrirEdicao(u)}>
                    Editar
                  </button>
                  <button type="button" className="botao botao--perigo" onClick={() => handleToggleAtivo(u)} style={{ marginLeft: 8 }}>
                    {u.ativo === false ? 'Ativar' : 'Inativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
