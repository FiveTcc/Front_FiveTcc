// Camada de persistência simulada para o TCC.
// Usa localStorage como "banco de dados" local — troque por chamadas
// fetch/axios para uma API real quando o backend estiver pronto.

const DB_KEY = 'torre_db_v1'

const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Acesso e Permissões', 'Outros']
const PRIORIDADES = ['baixa', 'media', 'alta', 'critica']
const STATUS = ['aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado']

function codigo(n) {
  const ano = new Date().getFullYear()
  return `CH-${ano}-${String(n).padStart(4, '0')}`
}

function seed() {
  const usuarios = [
    { id: 'u1', nome: 'Marina Cavalcanti', email: 'admin@torre.edu', senha: 'admin123', perfil: 'admin' },
    { id: 'u2', nome: 'Diego Farias', email: 'tecnico@torre.edu', senha: 'tecnico123', perfil: 'tecnico' },
    { id: 'u3', nome: 'Renata Souza', email: 'renata@torre.edu', senha: 'usuario123', perfil: 'usuario' },
    { id: 'u4', nome: 'Paulo Nakamura', email: 'paulo@torre.edu', senha: 'usuario1234', perfil: 'usuario' },
  ]

  const agora = Date.now()
  const dia = 86400000

  const chamados = [
    {
      id: 'c1', numero: codigo(1),
      titulo: 'Notebook não liga após queda de energia',
      descricao: 'O equipamento do laboratório 3 não inicializa mais desde a última queda de energia. LED de força não acende.',
      categoria: 'Hardware', prioridade: 'alta', status: 'aberto',
      solicitanteId: 'u3', responsavelId: 'u2',
      criadoEm: agora - dia * 2, atualizadoEm: agora - dia * 2,
      comentarios: [
        { autorId: 'u2', texto: 'Chamado recebido, vou até o laboratório amanhã de manhã.', data: agora - dia * 1.5 },
      ],
    },
    {
      id: 'c2', numero: codigo(2),
      titulo: 'Acesso ao sistema acadêmico bloqueado',
      descricao: 'Não consigo mais logar no portal do aluno, aparece "credenciais inválidas" mesmo com a senha correta.',
      categoria: 'Acesso e Permissões', prioridade: 'critica', status: 'em_andamento',
      solicitanteId: 'u4', responsavelId: 'u2',
      criadoEm: agora - dia * 1, atualizadoEm: agora - dia * 0.3,
      comentarios: [
        { autorId: 'u2', texto: 'Identificamos bloqueio por tentativas excessivas. Redefinindo credenciais.', data: agora - dia * 0.4 },
      ],
    },
    {
      id: 'c3', numero: codigo(3),
      titulo: 'Instalação do pacote estatístico R no laboratório',
      descricao: 'Solicito instalação do R e RStudio nas máquinas do laboratório 5 para a disciplina de Bioestatística.',
      categoria: 'Software', prioridade: 'media', status: 'aguardando',
      solicitanteId: 'u3', responsavelId: null,
      criadoEm: agora - dia * 4, atualizadoEm: agora - dia * 3,
      comentarios: [],
    },
    {
      id: 'c4', numero: codigo(4),
      titulo: 'Wi-Fi instável no bloco B, 2º andar',
      descricao: 'A rede sem fio cai a cada 10 minutos aproximadamente, atrapalhando as aulas do período noturno.',
      categoria: 'Rede', prioridade: 'alta', status: 'em_andamento',
      solicitanteId: 'u4', responsavelId: 'u2',
      criadoEm: agora - dia * 6, atualizadoEm: agora - dia * 1,
      comentarios: [
        { autorId: 'u2', texto: 'Trocado o canal do AP-B204, monitorando estabilidade por 48h.', data: agora - dia * 1 },
      ],
    },
    {
      id: 'c5', numero: codigo(5),
      titulo: 'Projetor da sala 12 com imagem esverdeada',
      descricao: 'A imagem projetada está com uma predominância verde forte, dificultando a leitura de slides.',
      categoria: 'Hardware', prioridade: 'baixa', status: 'resolvido',
      solicitanteId: 'u3', responsavelId: 'u2',
      criadoEm: agora - dia * 10, atualizadoEm: agora - dia * 8,
      comentarios: [
        { autorId: 'u2', texto: 'Cabo VGA substituído. Projetor testado e funcionando normalmente.', data: agora - dia * 8 },
      ],
    },
    {
      id: 'c6', numero: codigo(6),
      titulo: 'Solicitação de segundo monitor',
      descricao: 'Gostaria de solicitar um segundo monitor para a estação de trabalho da coordenação.',
      categoria: 'Hardware', prioridade: 'baixa', status: 'fechado',
      solicitanteId: 'u4', responsavelId: 'u2',
      criadoEm: agora - dia * 20, atualizadoEm: agora - dia * 15,
      comentarios: [
        { autorId: 'u2', texto: 'Monitor entregue e instalado.', data: agora - dia * 15 },
      ],
    },
  ]

  return { usuarios, chamados, seq: 6 }
}

function read() {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const initial = seed()
    localStorage.setItem(DB_KEY, JSON.stringify(initial))
    return initial
  }
  try {
    return JSON.parse(raw)
  } catch {
    const initial = seed()
    localStorage.setItem(DB_KEY, JSON.stringify(initial))
    return initial
  }
}

function write(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export const db = {
  CATEGORIAS,
  PRIORIDADES,
  STATUS,

  resetSeed() {
    write(seed())
  },

  // ---- Usuários ----
  listarUsuarios() {
    return read().usuarios
  },
  autenticar(email, senha) {
    const usuario = read().usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    )
    return usuario || null
  },
  buscarUsuario(id) {
    return read().usuarios.find((u) => u.id === id) || null
  },

  // ---- Chamados ----
  listarChamados() {
    const data = read()
    return [...data.chamados].sort((a, b) => b.criadoEm - a.criadoEm)
  },
  buscarChamado(id) {
    return read().chamados.find((c) => c.id === id) || null
  },
  criarChamado({ titulo, descricao, categoria, prioridade, solicitanteId }) {
    const data = read()
    const seq = data.seq + 1
    const novo = {
      id: `c${seq}`,
      numero: codigo(seq),
      titulo,
      descricao,
      categoria,
      prioridade,
      status: 'aberto',
      solicitanteId,
      responsavelId: null,
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
      comentarios: [],
    }
    data.chamados.push(novo)
    data.seq = seq
    write(data)
    return novo
  },
  atualizarChamado(id, patch) {
    const data = read()
    const idx = data.chamados.findIndex((c) => c.id === id)
    if (idx === -1) return null
    data.chamados[idx] = { ...data.chamados[idx], ...patch, atualizadoEm: Date.now() }
    write(data)
    return data.chamados[idx]
  },
  adicionarComentario(id, { autorId, texto }) {
    const data = read()
    const idx = data.chamados.findIndex((c) => c.id === id)
    if (idx === -1) return null
    data.chamados[idx].comentarios.push({ autorId, texto, data: Date.now() })
    data.chamados[idx].atualizadoEm = Date.now()
    write(data)
    return data.chamados[idx]
  },
}
