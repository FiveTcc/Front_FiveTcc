import { STATUS_LABEL } from '../services/utils'

export default function StatusBeacon({ status, comLabel = true }) {
  const statusClass = String(status || '').toLowerCase().replace(/\s+/g, '_')

  return (
    <span className={`sinalizador sinalizador--${statusClass}`}>
      <span className="sinalizador__ponto" aria-hidden="true" />
      {comLabel && <span className="sinalizador__rotulo">{STATUS_LABEL[status] || status}</span>}
    </span>
  )
}
