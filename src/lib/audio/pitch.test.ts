import { describe, it, expect } from 'vitest'
import { computeRms, detectPitch, RMS_GATE } from './pitch'

/** Sum of sine partials: harmonics[k] is the amplitude of partial k+1. */
function synthTone(freq: number, sampleRate: number, harmonics: number[], n = 2048): Float32Array {
  const buf = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let sample = 0
    harmonics.forEach((amp, k) => {
      sample += amp * Math.sin((2 * Math.PI * freq * (k + 1) * i) / sampleRate)
    })
    buf[i] = sample
  }
  return buf
}

function centsError(detected: number, expected: number): number {
  return Math.abs(1200 * Math.log2(detected / expected))
}

const OPEN_STRINGS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]
const SAMPLE_RATES = [44100, 48000]

describe('computeRms', () => {
  it('measures a full-scale sine as ~0.707', () => {
    expect(computeRms(synthTone(440, 48000, [1]))).toBeCloseTo(Math.SQRT1_2, 2)
  })

  it('measures silence as 0', () => {
    expect(computeRms(new Float32Array(2048))).toBe(0)
  })
})

describe('detectPitch', () => {
  it.each(SAMPLE_RATES)('detects all open strings from pure sines at %d Hz', (sampleRate) => {
    for (const freq of OPEN_STRINGS) {
      const detected = detectPitch(synthTone(freq, sampleRate, [0.5]), sampleRate)
      expect(detected).not.toBeNull()
      expect(centsError(detected!, freq)).toBeLessThan(3)
    }
  })

  it('detects the fundamental when the 2nd harmonic dominates (low-string octave trap)', () => {
    const buf = synthTone(110, 48000, [0.3, 0.45])
    const detected = detectPitch(buf, 48000)
    expect(detected).not.toBeNull()
    expect(centsError(detected!, 110)).toBeLessThan(3)
  })

  it('detects the fundamental of a sawtooth-like low E', () => {
    const harmonics = Array.from({ length: 8 }, (_, k) => 0.5 / (k + 1))
    const detected = detectPitch(synthTone(82.41, 44100, harmonics), 44100)
    expect(detected).not.toBeNull()
    expect(centsError(detected!, 82.41)).toBeLessThan(3)
  })

  it('detects a quiet real-mic-level signal (AGC disabled)', () => {
    // Regression: an acoustic guitar into a laptop mic with autoGainControl
    // off arrives around RMS 0.002-0.01 and must not be gated as silence
    const quiet = synthTone(110, 48000, [0.008]) // RMS ≈ 0.0057
    const detected = detectPitch(quiet, 48000)
    expect(detected).not.toBeNull()
    expect(centsError(detected!, 110)).toBeLessThan(3)
  })

  it('detects a signal riding on a DC offset', () => {
    const buf = synthTone(110, 48000, [0.3])
    for (let i = 0; i < buf.length; i++) buf[i] += 0.25
    const detected = detectPitch(buf, 48000)
    expect(detected).not.toBeNull()
    expect(centsError(detected!, 110)).toBeLessThan(3)
  })

  it('returns null for silence', () => {
    expect(detectPitch(new Float32Array(2048), 48000)).toBeNull()
  })

  it('returns null below the RMS gate', () => {
    const quiet = synthTone(110, 48000, [RMS_GATE])
    expect(detectPitch(quiet, 48000)).toBeNull()
  })

  it('returns null for unpitched noise', () => {
    // Deterministic LCG noise so the test can't flake
    const buf = new Float32Array(2048)
    let seed = 42
    for (let i = 0; i < buf.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      buf[i] = (seed / 0xffffffff) * 2 - 1
    }
    expect(detectPitch(buf, 48000)).toBeNull()
  })
})
