import { STATUS_LABEL } from '../services/utils'

// Exibe o status da ocorrência com indicador visual e rótulo opcional.
export default function StatusBeacon({ status, comLabel = true }) {
  // Normaliza o valor para compor a classe CSS correspondente.
  const statusClass = String(status || '').toLowerCase().replace(/\s+/g, '_')

  return (
    <span className={`indicador indicador--${statusClass}`}>
      <span className="indicador__ponto" aria-hidden="true" />
      {comLabel && <span className="indicador__rotulo">{STATUS_LABEL[status] || status}</span>}
    </span>
  )
}
