import { describe, it, expect } from 'vitest'
import { midiFrequency } from './notes'
import { STANDARD_TUNING, DROP_D_TUNING, TUNINGS, getTuning } from './tuning'
import {
  frequencyToMidiFloat,
  centsFrom,
  foldCents,
  nearestNote,
  nearestString,
  IN_TUNE_CENTS,
} from './tuner'

describe('frequencyToMidiFloat', () => {
  it('maps A4 = 440 Hz to midi 69', () => {
    expect(frequencyToMidiFloat(440)).toBeCloseTo(69, 6)
  })

  it('maps octaves to 12 midi steps', () => {
    expect(frequencyToMidiFloat(220)).toBeCloseTo(57, 6)
    expect(frequencyToMidiFloat(880)).toBeCloseTo(81, 6)
  })

  it('maps low E (E2) to midi 40', () => {
    expect(frequencyToMidiFloat(midiFrequency(40))).toBeCloseTo(40, 6)
  })

  it('inverts midiFrequency across the fretboard range', () => {
    for (let midi = 36; midi <= 88; midi++) {
      expect(frequencyToMidiFloat(midiFrequency(midi))).toBeCloseTo(midi, 6)
    }
  })
})

describe('centsFrom', () => {
  it('is positive when sharp and negative when flat', () => {
    expect(centsFrom(445, 69)).toBeGreaterThan(0)
    expect(centsFrom(435, 69)).toBeLessThan(0)
  })

  it('measures a semitone as 100 cents', () => {
    expect(centsFrom(midiFrequency(70), 69)).toBeCloseTo(100, 6)
  })
})

describe('nearestNote', () => {
  it('finds exact pitches with ~0 cents', () => {
    const match = nearestNote(440)
    expect(match.midi).toBe(69)
    expect(match.cents).toBeCloseTo(0, 6)
  })

  it('reports sharp deviation', () => {
    const match = nearestNote(445)
    expect(match.midi).toBe(69)
    expect(match.cents).toBeCloseTo(19.56, 1)
  })

  it('rounds to the nearer note past the 50-cent boundary', () => {
    const quarterSharp = 440 * 2 ** (0.51 / 12)
    const match = nearestNote(quarterSharp)
    expect(match.midi).toBe(70)
    expect(match.cents).toBeCloseTo(-49, 0)
  })
})

describe('nearestString', () => {
  it('matches each open string exactly in standard tuning', () => {
    STANDARD_TUNING.openMidi.forEach((midi, i) => {
      const match = nearestString(midiFrequency(midi), STANDARD_TUNING)
      expect(match.stringIndex).toBe(i)
      expect(match.targetMidi).toBe(midi)
      expect(match.cents).toBeCloseTo(0, 4)
      expect(match.inTune).toBe(true)
    })
  })

  it('sticks with the low string when slightly sharp', () => {
    const match = nearestString(84, STANDARD_TUNING) // sharp of E2 (82.4 Hz)
    expect(match.stringIndex).toBe(0)
    expect(match.cents).toBeGreaterThan(0)
  })

  it('matches drop D low string', () => {
    const match = nearestString(midiFrequency(38), DROP_D_TUNING) // D2 = 73.4 Hz
    expect(match.stringIndex).toBe(0)
    expect(match.targetMidi).toBe(38)
    expect(match.inTune).toBe(true)
  })

  it('clamps display cents to ±50', () => {
    // E2 played against drop D: 200 cents sharp of D2, but E2 is still
    // nearest to string 0 (2 semitones) vs A2 (5 semitones)
    const match = nearestString(midiFrequency(40), DROP_D_TUNING)
    expect(match.stringIndex).toBe(0)
    expect(match.cents).toBe(50)
    expect(match.inTune).toBe(false)
  })

  it('keeps the G string when its 2nd harmonic takes over (G -> E4 regression)', () => {
    // A decaying G string's 392 Hz overtone must not read as the E4 string
    const match = nearestString(392, STANDARD_TUNING)
    expect(match.stringIndex).toBe(3)
    expect(match.targetMidi).toBe(55)
    expect(match.inTune).toBe(true)
  })

  it('maps dominant harmonics of each string back to that string', () => {
    const harmonics: Array<[number, number]> = [
      [82.41 * 2, 0], // low E 2nd
      [110 * 2, 1], // A 2nd
      [146.83 * 2, 2], // D 2nd
      [196 * 3, 3], // G 3rd
      [246.94 * 2, 4], // B 2nd
      [329.63 * 2, 5], // high E 2nd
    ]
    for (const [freq, stringIndex] of harmonics) {
      const match = nearestString(freq, STANDARD_TUNING)
      expect(match.stringIndex).toBe(stringIndex)
      expect(Math.abs(match.cents)).toBeLessThan(5)
    }
  })

  it('never reinterprets a note played near a real string', () => {
    // E4 is nearly A2's 3rd harmonic, but a played E4 must stay E4
    expect(nearestString(329.63, STANDARD_TUNING).stringIndex).toBe(5)
    const sharpE4 = nearestString(335, STANDARD_TUNING)
    expect(sharpE4.stringIndex).toBe(5)
    expect(sharpE4.cents).toBeGreaterThan(0)
  })

  it('decides inTune on the threshold', () => {
    const target = STANDARD_TUNING.openMidi[4] // B3
    const justIn = midiFrequency(target) * 2 ** ((IN_TUNE_CENTS - 1) / 1200)
    const justOut = midiFrequency(target) * 2 ** ((IN_TUNE_CENTS + 1) / 1200)
    expect(nearestString(justIn, STANDARD_TUNING).inTune).toBe(true)
    expect(nearestString(justOut, STANDARD_TUNING).inTune).toBe(false)
  })
})

describe('foldCents', () => {
  it('folds harmonic octaves onto the target', () => {
    expect(Math.abs(foldCents(392, 55))).toBeLessThan(1) // G4 vs G3
    expect(Math.abs(foldCents(196, 55))).toBeLessThan(1) // G3 vs G3
    expect(Math.abs(foldCents(82.41, 64))).toBeLessThan(2) // E2 vs E4
  })

  it('preserves the deviation sign across octaves', () => {
    const sharpOctaveUp = midiFrequency(57) * 2 ** (30 / 1200) // A3 +30 cents
    expect(foldCents(sharpOctaveUp, 45)).toBeCloseTo(30, 1)
    const flatOctaveUp = midiFrequency(57) * 2 ** (-30 / 1200)
    expect(foldCents(flatOctaveUp, 45)).toBeCloseTo(-30, 1)
  })

  it('stays within [-600, 600)', () => {
    for (const freq of [70, 130, 333, 777, 990]) {
      const folded = foldCents(freq, 55)
      expect(folded).toBeGreaterThanOrEqual(-600)
      expect(folded).toBeLessThan(600)
    }
  })
})

describe('TUNINGS', () => {
  it('registers five tunings with unique ids', () => {
    expect(TUNINGS).toHaveLength(5)
    expect(new Set(TUNINGS.map((t) => t.id)).size).toBe(5)
  })

  it('has six ascending strings per tuning', () => {
    for (const tuning of TUNINGS) {
      expect(tuning.openMidi).toHaveLength(6)
      for (let i = 1; i < 6; i++) {
        expect(tuning.openMidi[i]).toBeGreaterThan(tuning.openMidi[i - 1])
      }
    }
  })

  it('looks up tunings by id with a standard fallback', () => {
    expect(getTuning('drop-d')).toBe(DROP_D_TUNING)
    expect(getTuning('nope')).toBe(STANDARD_TUNING)
  })
})
