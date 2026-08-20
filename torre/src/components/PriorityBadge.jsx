import { PRIORIDADE_LABEL } from '../services/utils'

export default function PriorityBadge({ prioridade }) {
  return <span className={`badge badge--${prioridade}`}>{PRIORIDADE_LABEL[prioridade] || prioridade}</span>
}
