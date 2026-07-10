import { midiFrequency } from '../music/notes'

let ctx: AudioContext | null = null
let master: DynamicsCompressorNode | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Shared output bus: a gentle compressor keeps boosted low notes from clipping. */
function getMaster(ac: AudioContext): DynamicsCompressorNode {
  if (!master) {
    master = ac.createDynamicsCompressor()
    master.threshold.value = -14
    master.knee.value = 20
    master.ratio.value = 3
    master.attack.value = 0.003
    master.release.value = 0.25
    master.connect(ac.destination)
  }
  return master
}

/**
 * Human hearing is far less sensitive to low frequencies (equal-loudness
 * contours), so equal-amplitude notes sound quieter at the bottom of the
 * neck and get louder up the scale. Boost the lows and trim the highs
 * (~6 dB per octave around E4, tuned so the A-weighted level of rendered
 * notes is nearly flat across E2-G5) to keep perceived volume even.
 */
function loudnessCompensation(freq: number): number {
  // Hearing sensitivity falls off faster below ~300 Hz, so the boost curve
  // is steeper below the reference than the trim above it.
  const comp = freq < 330 ? Math.pow(330 / freq, 1.25) : 330 / freq
  return Math.min(6.5, Math.max(0.5, comp))
}

/** Play a short guitar-ish pluck. Safe to call from a user-gesture handler or timer. */
export function playNote(midi: number, duration = 0.4): void {
  const ac = getContext()
  const t = ac.currentTime
  const freq = midiFrequency(midi)
  const level = loudnessCompensation(freq)
  // Small speakers barely reproduce fundamentals below ~200 Hz, so low notes
  // also get their harmonics boosted — that's where they remain audible.
  const harmonicBoost = Math.min(3, Math.max(1, 500 / freq))

  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq

  // A touch of second harmonic makes it less hollow
  const osc2 = ac.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = freq * 2

  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.35 * level, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  const gain2 = ac.createGain()
  gain2.gain.setValueAtTime(0, t)
  gain2.gain.linearRampToValueAtTime(0.08 * level * harmonicBoost, t + 0.005)
  gain2.gain.exponentialRampToValueAtTime(0.0005, t + duration * 0.6)

  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  // Keep a floor on the cutoff so low notes retain upper harmonics
  filter.frequency.setValueAtTime(Math.min(Math.max(freq * 6, 2500), 8000), t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 900), t + duration)

  const out = getMaster(ac)
  osc.connect(gain)
  osc2.connect(gain2)
  gain.connect(filter)
  gain2.connect(filter)
  filter.connect(out)

  osc.start(t)
  osc2.start(t)
  osc.stop(t + duration + 0.05)
  osc2.stop(t + duration + 0.05)

  // Very low notes get a third harmonic so there's energy in the range
  // both ears and small speakers respond to.
  if (freq < 200) {
    const osc3 = ac.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.value = freq * 3
    const gain3 = ac.createGain()
    gain3.gain.setValueAtTime(0, t)
    gain3.gain.linearRampToValueAtTime(0.05 * level * harmonicBoost, t + 0.005)
    gain3.gain.exponentialRampToValueAtTime(0.0005, t + duration * 0.6)
    osc3.connect(gain3)
    gain3.connect(filter)
    osc3.start(t)
    osc3.stop(t + duration + 0.05)
  }
}
