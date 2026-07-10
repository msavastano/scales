import { midiName } from '../../../lib/music/notes'
import type { Tuning } from '../../../lib/music/tuning'
import { playNote } from '../../../lib/audio/synth'

interface StringIndicatorsProps {
  tuning: Tuning
  /** Auto-detected string being played, or null while silent */
  activeStringIndex: number | null
  inTune: boolean
  /** Manually locked string index, or null in auto mode */
  lockedIndex: number | null
  /** Toggle the lock for a string (null = back to auto) */
  onLockChange: (index: number | null) => void
}

/**
 * Six open-string buttons, low to high. Tapping one plays its reference tone
 * and locks the meter to that string; tapping it again returns to auto.
 */
export function StringIndicators({
  tuning,
  activeStringIndex,
  inTune,
  lockedIndex,
  onLockChange,
}: StringIndicatorsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-3">
        {tuning.openMidi.map((midi, i) => {
          const locked = lockedIndex === i
          const active = activeStringIndex === i
          const ring = locked
            ? 'border-primary text-on-primary bg-primary'
            : active
              ? inTune
                ? 'border-tertiary text-tertiary bg-tertiary/10'
                : 'border-primary text-primary bg-primary/10'
              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                playNote(midi, 1.2)
                onLockChange(locked ? null : i)
              }}
              title={locked ? `Unlock ${midiName(midi)} (back to auto)` : `Tune ${midiName(midi)}`}
              aria-pressed={locked}
              aria-label={`String ${6 - i}, ${midiName(midi)}: play reference tone and ${
                locked ? 'return to automatic string detection' : 'lock the tuner to this string'
              }`}
              className={`w-14 h-14 rounded-full border-2 font-mono text-label-sm font-semibold cursor-pointer transition-colors ${ring}`}
            >
              {midiName(midi)}
            </button>
          )
        })}
      </div>
      <p className="font-mono text-label-sm text-outline">
        {lockedIndex !== null
          ? `LOCKED TO ${midiName(tuning.openMidi[lockedIndex])} — TAP IT AGAIN FOR AUTO`
          : 'AUTO-DETECTING — TAP A STRING TO LOCK IT'}
      </p>
    </div>
  )
}
