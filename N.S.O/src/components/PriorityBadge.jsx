import { PRIORIDADE_LABEL } from '../services/utils'

// Converte o código da prioridade em um rótulo visual padronizado.
export default function PriorityBadge({ prioridade }) {
  return <span className={`etiqueta etiqueta--${prioridade}`}>{PRIORIDADE_LABEL[prioridade] || prioridade}</span>
}
