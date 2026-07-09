import { describe, expect, it } from 'vitest'
import { midiFrequency, midiName, midiPitchClass } from './notes'
import { getScale, SCALES } from './scales'
import { STANDARD_TUNING } from './tuning'
import { buildPattern, getPositions, scalePitchClasses } from './patterns'

describe('notes', () => {
  it('computes frequencies (A4 = 440)', () => {
    expect(midiFrequency(69)).toBeCloseTo(440)
    expect(midiFrequency(57)).toBeCloseTo(220)
    expect(midiFrequency(40)).toBeCloseTo(82.407, 2)
  })

  it('names midi notes', () => {
    expect(midiName(69)).toBe('A4')
    expect(midiName(40)).toBe('E2')
    expect(midiName(61)).toBe('C#4')
  })
})

describe('scales', () => {
  it('defines the expected scale sizes', () => {
    expect(getScale('major').intervals).toHaveLength(7)
    expect(getScale('minor-pentatonic').intervals).toHaveLength(5)
    expect(getScale('blues').intervals).toHaveLength(6)
  })

  it('C major contains only naturals', () => {
    const pcs = scalePitchClasses(0, getScale('major'))
    expect(pcs).toEqual([0, 2, 4, 5, 7, 9, 11])
  })
})

describe('getPositions', () => {
  it('yields one position per scale tone', () => {
    for (const scale of SCALES) {
      const positions = getPositions(9, scale, STANDARD_TUNING, 0)
      expect(positions).toHaveLength(scale.intervals.length)
    }
  })

  it('anchors A minor pentatonic position 1 at fret 0 (open G on low E... actually A at 5 exists)', () => {
    const positions = getPositions(9, getScale('minor-pentatonic'), STANDARD_TUNING, 0)
    // A minor pentatonic pcs: A C D E G -> on low E string frets 0(E),3(G),5(A),8(C),10(D)
    expect(positions.map((p) => p.anchorFret)).toEqual([0, 3, 5, 8, 10])
  })
})

describe('buildPattern', () => {
  const amp = getScale('minor-pentatonic')

  it('contains only scale pitch classes', () => {
    for (const scale of SCALES) {
      for (const pos of getPositions(4, scale, STANDARD_TUNING, 0)) {
        const pcs = scalePitchClasses(4, scale)
        const pattern = buildPattern(4, scale, STANDARD_TUNING, 0, pos.anchorFret)
        for (const note of pattern) {
          expect(pcs).toContain(midiPitchClass(note.midi))
        }
      }
    }
  })

  it('is strictly ascending in pitch', () => {
    const pattern = buildPattern(9, amp, STANDARD_TUNING, 0, 5)
    for (let i = 1; i < pattern.length; i++) {
      expect(pattern[i].midi).toBeGreaterThan(pattern[i - 1].midi)
    }
  })

  it('produces the classic A minor pentatonic box at fret 5', () => {
    const pattern = buildPattern(9, amp, STANDARD_TUNING, 0, 5)
    // Two notes per string, frets 5/8 or 5/7
    expect(pattern).toHaveLength(12)
    expect(pattern[0]).toMatchObject({ string: 0, fret: 5, isRoot: true })
    expect(pattern.map((n) => n.fret)).toEqual([5, 8, 5, 7, 5, 7, 5, 7, 5, 8, 5, 8])
  })

  it('capo transposes pitch but keeps the same shape', () => {
    const open = buildPattern(9, amp, STANDARD_TUNING, 0, 5)
    const capoed = buildPattern(9, amp, STANDARD_TUNING, 2, 5)
    expect(capoed.map((n) => [n.string, n.fret])).toEqual(open.map((n) => [n.string, n.fret]))
    expect(capoed.map((n) => n.midi)).toEqual(open.map((n) => n.midi + 2))
  })

  it('midi matches string/fret/capo arithmetic', () => {
    const pattern = buildPattern(2, getScale('blues'), STANDARD_TUNING, 3, 7)
    for (const note of pattern) {
      expect(note.midi).toBe(STANDARD_TUNING.openMidi[note.string] + 3 + note.fret)
    }
  })
})
