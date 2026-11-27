import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CustomSelect from '../components/CustomSelect'
import { iniciais } from '../services/utils'
import userService from '../services/userServices'

const PERFIL_LABEL = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  funcionario: 'Funcionário',
}

const PERFIL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'admin', label: 'Administrador' },
]

const formInicial = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  perfil: '',
  telefone: '',
}

function mapearUsuario(usuario) {
  return {
    id: usuario.id_user,
    nome: usuario.user_nome || '',
    email: usuario.user_email || '',
    telefone: usuario.user_tel || '',
    perfil: usuario.user_tipo || '',
    ativo: usuario.user_ativo,
    imagem: usuario.user_imagem_url || null,
    criadoEm: usuario.criado_em || null,
  }
}

function extrairErro(error) {
  const mensagem = error?.response?.data?.message

  if (Array.isArray(mensagem)) {
    return mensagem.join(', ')
  }

  return mensagem || error?.message || 'Ocorreu um erro. Tente novamente.'
}

export default function Usuarios() {
  const { usuario: usuarioLogado, atualizarSessao } = useAuth()

  const [usuarios, setUsuarios] = useState([])

  const [form, setForm] = useState(formInicial)
  const [editId, setEditId] = useState('')

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [alterandoStatusId, setAlterandoStatusId] = useState(null)

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)
  const notificacoesRef = useRef(null)
  const [notificacoes] = useState([])

  // =====================================================
  // CARREGAR USUÁRIOS
  // =====================================================

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true)

      const dados = await userService.listarUsuarios()

      const lista = Array.isArray(dados)
        ? dados
        : dados?.usuarios || dados?.data || []

      setUsuarios(lista.map(mapearUsuario))
      setErro('')
    } catch (error) {
      setErro(extrairErro(error))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarUsuarios()
  }, [carregarUsuarios])

  // =====================================================
  // FECHAR NOTIFICAÇÕES AO CLICAR FORA
  // =====================================================

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setMostrarNotificacoes(false)
      }
    }

    document.addEventListener('click', fecharAoClicarFora)

    return () => {
      document.removeEventListener('click', fecharAoClicarFora)
    }
  }, [])

  // =====================================================
  // MENSAGENS
  // =====================================================

  function limparMensagens() {
    setErro('')
    setSucesso('')
  }

  // =====================================================
  // ALTERAR CAMPOS DO FORMULÁRIO
  // =====================================================

  function handleChange(event) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    limparMensagens()
  }

  // =====================================================
  // SELECIONAR USUÁRIO PARA EDIÇÃO
  // =====================================================

  function abrirEdicao(usuario) {
    setEditId(usuario.id)

    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      telefone: usuario.telefone,
    })

    limparMensagens()

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =====================================================
  // CANCELAR EDIÇÃO
  // =====================================================

  function cancelarEdicao() {
    setEditId('')
    setForm(formInicial)
    limparMensagens()
  }

  // =====================================================
  // CADASTRAR OU ATUALIZAR USUÁRIO
  // =====================================================

  async function handleSubmit(event) {
    event.preventDefault()
    limparMensagens()

    if (!editId && form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      setSalvando(true)

      if (editId) {
        // -----------------------------------------------
        // ATUALIZAR USUÁRIO
        // -----------------------------------------------

        const dadosUsuario = {
          user_nome: form.nome.trim(),
          user_email: form.email.trim(),
          user_tel: form.telefone.trim(),
          user_tipo: form.perfil,
        }

        await userService.atualizarUsuario(editId, dadosUsuario)

        const usuarioAtualizado = {
          id: Number(editId),
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone.trim(),
          perfil: form.perfil,
        }

        setUsuarios((atual) =>
          atual.map((usuario) =>
            usuario.id === Number(editId)
              ? { ...usuario, ...usuarioAtualizado }
              : usuario
          )
        )

        const idLogado = usuarioLogado?.id ?? usuarioLogado?.id_user

        if (Number(idLogado) === Number(editId)) {
          atualizarSessao({
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            perfil: usuarioAtualizado.perfil,
            telefone: usuarioAtualizado.telefone,
          })
        }

        setSucesso('Usuário atualizado com sucesso!')
      } else {
        // -----------------------------------------------
        // CADASTRAR USUÁRIO
        // -----------------------------------------------

        const dadosUsuario = {
          user_nome: form.nome.trim(),
          user_email: form.email.trim(),
          user_senha: form.senha,
          user_tel: form.telefone.trim(),
          user_tipo: form.perfil,
        }

        await userService.cadastrarUsuario(dadosUsuario)

        setSucesso('Usuário cadastrado com sucesso!')
      }

      // Limpar formulário e voltar ao cadastro
      setForm(formInicial)
      setEditId('')

      await carregarUsuarios()
    } catch (error) {
      setErro(extrairErro(error))
    } finally {
      setSalvando(false)
    }
  }

  // =====================================================
  // FORMATAR DATA
  // =====================================================

  function formatarData(data) {
    if (!data) return 'Não informado'

    const dataFormatada = new Date(data)
    if (Number.isNaN(dataFormatada.getTime())) return 'Não informado'

    return dataFormatada.toLocaleDateString('pt-BR')
  }

  // =====================================================
  // ATIVAR / INATIVAR USUÁRIO
  // =====================================================

  async function handleToggleAtivo(usuario) {
    limparMensagens()

    const vaiAtivar = usuario.ativo === false
    const acao = vaiAtivar ? 'ativar' : 'inativar'
    const confirmado = window.confirm(
      `Deseja realmente ${acao} o usuário "${usuario.nome}"?`
    )

    if (!confirmado) return

    try {
      setAlterandoStatusId(usuario.id)

      await userService.inativarUsuario(usuario.id)

      setSucesso(
        vaiAtivar
          ? `Usuário ${usuario.nome} ativado com sucesso.`
          : `Usuário ${usuario.nome} inativado com sucesso.`
      )

      await carregarUsuarios()
    } catch (error) {
      setErro(extrairErro(error))
    } finally {
      setAlterandoStatusId(null)
    }
  }

  // =====================================================
  // TELA
  // =====================================================

  return (
    <div className="pagina">

      {/* CABEÇALHO */}

      <header className="pagina__cabecalho">
        <div>
          <span className="rotulo-superior">
            Administração
          </span>

          <h1>Usuários</h1>

          <p className="esmaecido">
            Pessoas com acesso à central de chamados.
          </p>
        </div>

        <div className="topbar__acoes">
          <div
            className="topbar__notificacoes-wrap"
            ref={notificacoesRef}
          >
            <button
              type="button"
              className="topbar__simbolo-botao"
              aria-label="Notificações"
              aria-expanded={mostrarNotificacoes}
              onClick={() =>
                setMostrarNotificacoes((valor) => !valor)
              }
            >
              🕭
            </button>

            {mostrarNotificacoes && (
              <div
                className="topbar__notificacoes"
                role="menu"
                aria-label="Notificações"
              >
                <div className="topbar__notificacoes-cabecalho">
                  <strong>Notificações</strong>
                  <span>{notificacoes.length}</span>
                </div>

                {notificacoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="topbar__notificacao-item"
                  >
                    <span>{item.titulo}</span>
                    <small>{item.tempo}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}

      <div className="card__novousuario">

        <div className="card__cabecalho">
          <h2>
            {editId ? 'Editar usuário' : 'Novo usuário'}
          </h2>
        </div>

        <form
          className="formulario usuarios-novo-formulario"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="usuarios-formulario-grade">

            {/* COLUNA ESQUERDA */}
            <div className="usuarios-formulario-coluna">

              <label>
                Nome
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex.: Ana Souza"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="E-mail corporativo"
                  required
                />
              </label>

              <label>
                Telefone
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  required
                />
              </label>

            </div>

            {/* COLUNA DIREITA */}
            <div className="usuarios-formulario-coluna">

              <div className="usuarios-perfil-campo">
                <label htmlFor="usuarios-novo-perfil">
                  Perfil
                </label>

                <CustomSelect
                  id="usuarios-novo-perfil"
                  className="usuarios-perfil-select"
                  label="Perfil"
                  value={form.perfil}
                  options={PERFIL_OPTIONS}
                  onChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      perfil: value,
                    }))
                    limparMensagens()
                  }}
                />
              </div>

              {!editId && (
                <>
                  <label>
                    Senha inicial
                    <input
                      type="password"
                      name="senha"
                      value={form.senha}
                      onChange={handleChange}
                      placeholder="Digite uma senha"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={50}
                    />
                  </label>

                  <label>
                    Confirmar senha
                    <input
                      type="password"
                      name="confirmarSenha"
                      value={form.confirmarSenha}
                      onChange={handleChange}
                      placeholder="Digite a senha novamente"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={50}
                    />
                  </label>
                </>
              )}

            </div>

          </div>

          {/* MENSAGENS */}

          {erro && (
            <div className="acesso__erro">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="formulario__sucesso">
              {sucesso}
            </div>
          )}

          {/* BOTÕES */}

          <div className="formulario-novo-usuarios__acoes">

            {editId && (
              <button
                type="button"
                className="botao botao--transparente"
                onClick={cancelarEdicao}
                disabled={salvando}
              >
                Cancelar edição
              </button>
            )}

            <button
              type="submit"
              className="botao botao--principal"
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : editId
                  ? 'Salvar alterações'
                  : 'Salvar usuário'}
            </button>

          </div>

        </form>
      </div>

      {/* TABELA DE USUÁRIOS */}

      <div className="card__tabela card--tabela">

        <table className="tabela">

          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Data de criação</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>

            {carregando ? (
              <tr>
                <td colSpan={6}>
                  Carregando usuários...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (

                <tr key={u.id}>

                  {/* AVATAR */}
                  <td>
                    <div className="avatar avatar--pequeno">
                      {u.imagem ? (
                        <img
                          src={u.imagem}
                          alt={`Foto de ${u.nome}`}
                          className="usuario-avatar-img"
                        />
                      ) : (
                        iniciais(u.nome)
                      )}
                    </div>
                  </td>

                  {/* NOME CLICÁVEL */}

                  <td className="tabela__titulo">

                    <button
                      type="button"
                      className="tabela__usuario-link"
                      onClick={() => abrirEdicao(u)}
                      title="Clique para editar este usuário"
                    >
                      {u.nome}
                    </button>

                    {!u.ativo && (
                      <small className="esmaecido">
                        {' '}(Inativo)
                      </small>
                    )}

                  </td>

                  {/* E-MAIL */}

                  <td className="esmaecido">
                    {u.email}
                  </td>

                  {/* PERFIL */}

                  {/* PERFIL */}

                  <td>
                    <span className={`usuario-tipo usuario-tipo--${u.perfil}`}>
                      {PERFIL_LABEL[u.perfil] || u.perfil}
                    </span>
                  </td>

                  {/* DATA DE CRIAÇÃO */}
                  <td className="esmaecido">
                    {formatarData(u.criadoEm)}
                  </td>

                  {/* AÇÕES */}

                  <td>

                    <button
                      type="button"
                      className="botao botao--transparente"
                      onClick={() => abrirEdicao(u)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={`botao ${u.ativo === false ? 'botao--ativar' : 'botao--inativar'}`}
                      onClick={() => handleToggleAtivo(u)}
                      disabled={alterandoStatusId === u.id}
                      style={{ marginLeft: 15 }}
                    >
                      {alterandoStatusId === u.id
                        ? 'Aguarde...'
                        : u.ativo === false
                          ? 'Ativar'
                          : 'Inativar'}
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}
