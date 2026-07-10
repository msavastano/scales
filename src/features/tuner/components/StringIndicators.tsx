import { midiName } from '../../../lib/music/notes'
import type { Tuning } from '../../../lib/music/tuning'
import { playNote } from '../../../lib/audio/synth'

interface StringIndicatorsProps {
  tuning: Tuning
  /** Auto-detected string being played, or null while silent */
  activeStringIndex: number | null
  inTune: boolean
}

/** Six open-string buttons, low to high. Tap one to hear its reference tone. */
export function StringIndicators({ tuning, activeStringIndex, inTune }: StringIndicatorsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {tuning.openMidi.map((midi, i) => {
        const active = activeStringIndex === i
        const ring = active
          ? inTune
            ? 'border-tertiary text-tertiary bg-tertiary/10'
            : 'border-primary text-primary bg-primary/10'
          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        return (
          <button
            key={i}
            type="button"
            onClick={() => playNote(midi, 1.2)}
            title={`Play reference ${midiName(midi)}`}
            aria-label={`Play reference tone ${midiName(midi)}, string ${6 - i}`}
            className={`w-14 h-14 rounded-full border-2 font-mono text-label-sm font-semibold cursor-pointer transition-colors ${ring}`}
          >
            {midiName(midi)}
          </button>
        )
      })}
    </div>
  )
}
