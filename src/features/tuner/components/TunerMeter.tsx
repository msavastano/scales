import { midiName } from '../../../lib/music/notes'
import type { TunerReading } from '../hooks/useTuner'

interface TunerMeterProps {
  reading: TunerReading | null
  listening: boolean
}

const TICKS = Array.from({ length: 11 }, (_, i) => -50 + i * 10)

/** Semicircular gauge: ±50 cents maps to ±45° of needle rotation. */
export function TunerMeter({ reading, listening }: TunerMeterProps) {
  const cents = reading?.cents ?? 0
  const angle = cents * 0.9
  const accent = reading ? (reading.inTune ? 'var(--color-tertiary)' : 'var(--color-primary)') : 'var(--color-outline-variant)'

  const hint = !reading
    ? listening
      ? 'Play a string…'
      : ''
    : reading.inTune
      ? 'In tune'
      : reading.cents > 0
        ? 'Tune down'
        : 'Tune up'

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col items-center">
      <svg viewBox="0 0 300 170" className="w-full max-w-md" role="img" aria-label="Tuning meter">
        {/* Tick marks along the arc */}
        {TICKS.map((tick) => {
          const major = tick % 50 === 0
          const r1 = major ? 118 : 124
          const rad = (tick * 0.9 * Math.PI) / 180
          const dx = Math.sin(rad)
          const dy = -Math.cos(rad)
          return (
            <g key={tick}>
              <line
                x1={150 + dx * r1}
                y1={150 + dy * r1}
                x2={150 + dx * 132}
                y2={150 + dy * 132}
                stroke={tick === 0 ? 'var(--color-tertiary)' : 'var(--color-outline-variant)'}
                strokeWidth={tick === 0 ? 2.5 : 1.5}
              />
              {major && (
                <text
                  x={150 + dx * 108}
                  y={150 + dy * 108 + 4}
                  textAnchor="middle"
                  className="fill-on-surface-variant font-mono"
                  fontSize="11"
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              )}
            </g>
          )
        })}

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${reading ? angle : 0}deg)`,
            transformOrigin: '150px 150px',
            transition: 'transform 80ms ease-out',
          }}
        >
          <line x1={150} y1={150} x2={150} y2={30} stroke={accent} strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={150} cy={150} r={7} fill={accent} />
      </svg>

      <div className="flex flex-col items-center -mt-2">
        <span className="font-display text-4xl font-bold tracking-tight" style={{ color: accent }}>
          {reading ? midiName(reading.targetMidi) : '—'}
        </span>
        <span className="font-mono text-label-sm text-on-surface-variant min-h-4 mt-1" aria-live="polite">
          {reading
            ? `${reading.cents > 0 ? '+' : ''}${Math.round(reading.cents)}¢ — ${hint}`
            : hint || ' '}
        </span>
      </div>
    </div>
  )
}
