import type { Tuning } from './tuning'

/** Fractional MIDI number for a frequency; 69 = A4 = 440 Hz. */
export function frequencyToMidiFloat(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}

/** Signed cents from the pitch of `midi` to `freq` (positive = sharp). */
export function centsFrom(freq: number, midi: number): number {
  return 100 * (frequencyToMidiFloat(freq) - midi)
}

export interface NoteMatch {
  midi: number
  /** Signed cents deviation, -50..+50 */
  cents: number
}

/** Nearest equal-tempered note and deviation in cents. */
export function nearestNote(freq: number): NoteMatch {
  const midi = Math.round(frequencyToMidiFloat(freq))
  return { midi, cents: centsFrom(freq, midi) }
}

/** Deviations within this many cents count as in tune. */
export const IN_TUNE_CENTS = 5

export interface StringMatch {
  /** Index into tuning.openMidi (0 = lowest string) */
  stringIndex: number
  targetMidi: number
  /** Signed cents from the open-string pitch, clamped to -50..+50 for display */
  cents: number
  inTune: boolean
}

/** Pick the string whose open pitch is closest in log-frequency (semitone) distance. */
export function nearestString(freq: number, tuning: Tuning): StringMatch {
  const midiFloat = frequencyToMidiFloat(freq)
  let stringIndex = 0
  for (let i = 1; i < tuning.openMidi.length; i++) {
    if (Math.abs(midiFloat - tuning.openMidi[i]) < Math.abs(midiFloat - tuning.openMidi[stringIndex])) {
      stringIndex = i
    }
  }
  const targetMidi = tuning.openMidi[stringIndex]
  const cents = centsFrom(freq, targetMidi)
  return {
    stringIndex,
    targetMidi,
    cents: Math.max(-50, Math.min(50, cents)),
    inTune: Math.abs(cents) <= IN_TUNE_CENTS,
  }
}
