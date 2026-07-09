import type { PitchClass } from './notes'
import { midiPitchClass } from './notes'
import type { ScaleDef } from './scales'
import type { Tuning } from './tuning'

/** Frets spanned by a box position beyond its anchor fret (anchor..anchor+SPAN) */
export const POSITION_SPAN = 4

export interface PatternNote {
  /** String index, 0 = lowest (6th) string */
  string: number
  /** Fret relative to the capo (0 = open string / at the capo) */
  fret: number
  /** Actual sounding pitch, capo included */
  midi: number
  /** Index into the scale's intervals (0 = root) */
  degree: number
  isRoot: boolean
}

export interface Position {
  index: number
  /** Lowest fret of the box, relative to the capo */
  anchorFret: number
  label: string
}

export function scalePitchClasses(rootPc: PitchClass, scale: ScaleDef): PitchClass[] {
  return scale.intervals.map((iv) => (rootPc + iv) % 12)
}

/**
 * One position per scale tone on the lowest string within the first 12 frets
 * above the capo. Each position is a box spanning anchorFret..anchorFret+SPAN.
 */
export function getPositions(
  rootPc: PitchClass,
  scale: ScaleDef,
  tuning: Tuning,
  capo: number
): Position[] {
  // The capo acts as the nut: rootPc is the shape's root, so the sounding
  // scale is transposed up by the capo and the shape stays identical.
  const pcs = scalePitchClasses((rootPc + capo) % 12, scale)
  const openPc = midiPitchClass(tuning.openMidi[0] + capo)
  const positions: Position[] = []
  for (let f = 0; f < 12; f++) {
    if (!pcs.includes((openPc + f) % 12)) continue
    const lo = capo + f
    const hi = lo + POSITION_SPAN
    positions.push({
      index: positions.length,
      anchorFret: f,
      label: `Position ${positions.length + 1} (frets ${lo}–${hi})`,
    })
  }
  return positions
}

/**
 * Build a box pattern: for each string, every scale tone inside the
 * anchor..anchor+SPAN fret window, ordered strictly ascending in pitch.
 */
export function buildPattern(
  rootPc: PitchClass,
  scale: ScaleDef,
  tuning: Tuning,
  capo: number,
  anchorFret: number
): PatternNote[] {
  // Same shape-root convention as getPositions: sounding root = rootPc + capo
  const pcs = scalePitchClasses((rootPc + capo) % 12, scale)
  const notes: PatternNote[] = []
  for (let s = 0; s < tuning.openMidi.length; s++) {
    const open = tuning.openMidi[s] + capo
    // Pitches reachable at the bottom of the next string's window belong to
    // that string — this keeps the fingering in the box and avoids unisons.
    const nextStringStart =
      s + 1 < tuning.openMidi.length ? tuning.openMidi[s + 1] + capo + anchorFret : Infinity
    for (let f = anchorFret; f <= anchorFret + POSITION_SPAN; f++) {
      const midi = open + f
      if (midi >= nextStringStart) break
      const degree = pcs.indexOf(midiPitchClass(midi))
      if (degree === -1) continue
      notes.push({ string: s, fret: f, midi, degree, isRoot: degree === 0 })
    }
  }
  return notes
}
