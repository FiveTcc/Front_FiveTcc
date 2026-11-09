import { STATUS_LABEL } from '../services/utils'

// Exibe o status da ocorrência com indicador visual e rótulo opcional.
export default function StatusBeacon({ status, comLabel = true }) {
  // Normaliza o valor para compor a classe CSS correspondente.
  const statusClass = String(status || '').toLowerCase().replace(/\s+/g, '_')

  return (
    <span className={`beacon beacon--${statusClass}`}>
      <span className="beacon__dot" aria-hidden="true" />
      {comLabel && <span className="beacon__label">{STATUS_LABEL[status] || status}</span>}
    </span>
  )
}
