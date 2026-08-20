import { STATUS_LABEL } from '../services/utils'

export default function StatusBeacon({ status, comLabel = true }) {
  return (
    <span className={`beacon beacon--${status}`}>
      <span className="beacon__dot" aria-hidden="true" />
      {comLabel && <span className="beacon__label">{STATUS_LABEL[status] || status}</span>}
    </span>
  )
}
