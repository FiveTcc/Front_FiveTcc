export const STATUS_LABEL = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const PRIORIDADE_LABEL = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export function formatarData(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function tempoRelativo(timestamp) {
  const diffMs = Date.now() - timestamp
  const diffH = Math.round(diffMs / 3600000)
  if (diffH < 1) return 'há poucos minutos'
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `há ${diffD}d`
}

export function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(' ')
  const primeiras = partes[0]?.[0] || ''
  const ultimas = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeiras + ultimas).toUpperCase()
}
