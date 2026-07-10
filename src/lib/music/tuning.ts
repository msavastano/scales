export interface Tuning {
  id: string
  name: string
  /** Open-string MIDI notes, index 0 = lowest (6th) string */
  openMidi: number[]
}

/** E2 A2 D3 G3 B3 E4 */
export const STANDARD_TUNING: Tuning = {
  id: 'standard',
  name: 'Standard (EADGBE)',
  openMidi: [40, 45, 50, 55, 59, 64],
}

/** D2 A2 D3 G3 B3 E4 */
export const DROP_D_TUNING: Tuning = {
  id: 'drop-d',
  name: 'Drop D (DADGBE)',
  openMidi: [38, 45, 50, 55, 59, 64],
}

/** Eb2 Ab2 Db3 Gb3 Bb3 Eb4 */
export const HALF_STEP_DOWN_TUNING: Tuning = {
  id: 'half-step-down',
  name: 'Half-Step Down (Eb Standard)',
  openMidi: [39, 44, 49, 54, 58, 63],
}

/** D2 A2 D3 G3 A3 D4 */
export const DADGAD_TUNING: Tuning = {
  id: 'dadgad',
  name: 'DADGAD',
  openMidi: [38, 45, 50, 55, 57, 62],
}

/** D2 G2 D3 G3 B3 D4 */
export const OPEN_G_TUNING: Tuning = {
  id: 'open-g',
  name: 'Open G (DGDGBD)',
  openMidi: [38, 43, 50, 55, 59, 62],
}

export const TUNINGS: Tuning[] = [
  STANDARD_TUNING,
  DROP_D_TUNING,
  HALF_STEP_DOWN_TUNING,
  DADGAD_TUNING,
  OPEN_G_TUNING,
]

export function getTuning(id: string): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? STANDARD_TUNING
}
