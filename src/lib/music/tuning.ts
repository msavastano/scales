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
