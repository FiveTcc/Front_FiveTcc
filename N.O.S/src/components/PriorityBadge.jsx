import { PRIORIDADE_LABEL } from '../services/utils'

export default function PriorityBadge({ prioridade }) {
  return <span className={`etiqueta etiqueta--${prioridade}`}>{PRIORIDADE_LABEL[prioridade] || prioridade}</span>
}
