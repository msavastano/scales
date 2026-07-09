export interface ScaleDef {
  id: string
  name: string
  /** Semitone offsets from the root, starting at 0, strictly ascending, all < 12 */
  intervals: number[]
}

export const SCALES: ScaleDef[] = [
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor', name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic-minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
]

export function getScale(id: string): ScaleDef {
  const scale = SCALES.find((s) => s.id === id)
  if (!scale) throw new Error(`Unknown scale: ${id}`)
  return scale
}
