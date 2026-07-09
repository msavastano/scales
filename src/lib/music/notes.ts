/** Pitch class: 0 = C, 1 = C#, ... 11 = B */
export type PitchClass = number

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export function pitchClassName(pc: PitchClass): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12]
}

export function midiPitchClass(midi: number): PitchClass {
  return ((midi % 12) + 12) % 12
}

/** e.g. midi 69 -> "A4" */
export function midiName(midi: number): string {
  return `${pitchClassName(midiPitchClass(midi))}${Math.floor(midi / 12) - 1}`
}

/** Frequency in Hz, equal temperament, A4 (midi 69) = 440 */
export function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Label for an interval in semitones above the root, e.g. 3 -> "b3" */
export const INTERVAL_LABELS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'] as const
