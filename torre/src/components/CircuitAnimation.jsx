import React from 'react'

export default function CircuitAnimation({ className = '' }) {
  return (
    <div className={`pcb-anim relative w-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 260" fill="none" className="w-full" role="presentation">
        <rect x="8" y="8" width="384" height="244" rx="14" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2" />

        {[[26, 26], [374, 26], [26, 234], [374, 234]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" stroke="currentColor" strokeOpacity="0.3" />
        ))}

        <g stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round">
          <path id="tr1" pathLength="1" d="M8 70 H70 L100 100 H160" />
          <path id="tr2" pathLength="1" d="M8 190 H80 L110 160 H160" />
          <path id="tr3" pathLength="1" d="M392 70 H330 L300 100 H240" />
          <path id="tr4" pathLength="1" d="M392 190 H320 L290 160 H240" />
          <path id="tr5" pathLength="1" d="M200 8 V60 M200 200 V252" />
          <path id="tr6" pathLength="1" d="M60 118 H120 L140 138 V200 H210" />
          <path id="tr7" pathLength="1" d="M340 118 H280 L262 138 V200" />
        </g>

        <g stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.1">
          <rect x="40" y="36" width="54" height="16" rx="3" />
          <rect x="40" y="58" width="54" height="16" rx="3" />
          <rect x="306" y="36" width="54" height="16" rx="3" />
          <rect x="300" y="206" width="60" height="26" rx="4" />
          <rect x="44" y="206" width="42" height="26" rx="4" />
        </g>

        {[ [96, 44], [300, 44], [70, 219], [330, 219] ].map(([cx, cy], i) => (
          <circle key={`led-${cx}`} cx={cx} cy={cy} r="2.6" fill="currentColor" className="pcb-led" style={{ animationDelay: `${i * 1.3}s` }} />
        ))}

        <g>
          <rect x="160" y="92" width="80" height="76" rx="10" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4" fill="none" />
          <rect x="172" y="104" width="56" height="52" rx="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

          <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round">
            {[110, 124, 138, 152].map((y) => (
              <g key={y}>
                <path d={`M150 ${y} H160`} />
                <path d={`M240 ${y} H250`} />
              </g>
            ))}
            {[176, 192, 208, 224].map((x) => (
              <g key={x}>
                <path d={`M${x} 82 V92`} />
                <path d={`M${x} 168 V178`} />
              </g>
            ))}
          </g>
          <text x="200" y="136" textAnchor="middle" fill="currentColor" fillOpacity="0.9" fontSize="15" fontWeight="700" letterSpacing="2.5">N.O.S</text>
          <rect x="160" y="92" width="80" height="76" rx="10" stroke="currentColor" strokeWidth="1.4" className="pcb-chip-pulse" />
        </g>

        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.85">
          {['tr1','tr2','tr3','tr4','tr5','tr6','tr7'].map((id, i) => (
            <use key={id} href={`#${id}`} className="pcb-pulse" style={{ animationDelay: `${i * 0.85}s` }} />
          ))}
        </g>
      </svg>
    </div>
  )
}
