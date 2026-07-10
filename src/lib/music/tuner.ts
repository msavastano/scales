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

/**
 * Signed cents from `midi` after shifting `freq` by whole octaves into
 * ±600 cents of it. Lets a harmonic-jumped reading still measure a fixed
 * target sensibly (e.g. 392 Hz vs G3 -> ~0 cents, not +1200).
 */
export function foldCents(freq: number, midi: number): number {
  return ((centsFrom(freq, midi) % 1200) + 1800) % 1200 - 600
}

export interface StringMatch {
  /** Index into tuning.openMidi (0 = lowest string) */
  stringIndex: number
  targetMidi: number
  /** Signed cents from the open-string pitch, clamped to -50..+50 for display */
  cents: number
  inTune: boolean
}

function matchString(freq: number, tuning: Tuning): { stringIndex: number; cents: number } {
  const midiFloat = frequencyToMidiFloat(freq)
  let stringIndex = 0
  for (let i = 1; i < tuning.openMidi.length; i++) {
    if (Math.abs(midiFloat - tuning.openMidi[i]) < Math.abs(midiFloat - tuning.openMidi[stringIndex])) {
      stringIndex = i
    }
  }
  return { stringIndex, cents: centsFrom(freq, tuning.openMidi[stringIndex]) }
}

/**
 * Pick the string being tuned. Prefers the string whose open pitch is closest
 * in log-frequency distance; when the frequency is far from every string it
 * is most likely an overtone the pitch detector latched onto as the pluck
 * decays (the G string's 2nd harmonic famously overtakes its fundamental),
 * so the sub-frequencies freq/2..freq/4 are tried and the closest fit wins.
 */
export function nearestString(freq: number, tuning: Tuning): StringMatch {
  let best = matchString(freq, tuning)
  if (Math.abs(best.cents) > 100) {
    for (const divisor of [2, 3, 4]) {
      const candidate = matchString(freq / divisor, tuning)
      if (Math.abs(candidate.cents) < Math.abs(best.cents)) best = candidate
    }
  }
  const { stringIndex, cents } = best
  return {
    stringIndex,
    targetMidi: tuning.openMidi[stringIndex],
    cents: Math.max(-50, Math.min(50, cents)),
    inTune: Math.abs(cents) <= IN_TUNE_CENTS,
  }
}
