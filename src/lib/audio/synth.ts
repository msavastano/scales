import { midiFrequency } from '../music/notes'

let ctx: AudioContext | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Play a short guitar-ish pluck. Safe to call from a user-gesture handler or timer. */
export function playNote(midi: number, duration = 0.4): void {
  const ac = getContext()
  const t = ac.currentTime
  const freq = midiFrequency(midi)

  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq

  // A touch of second harmonic makes it less hollow
  const osc2 = ac.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = freq * 2

  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.35, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  const gain2 = ac.createGain()
  gain2.gain.setValueAtTime(0, t)
  gain2.gain.linearRampToValueAtTime(0.08, t + 0.005)
  gain2.gain.exponentialRampToValueAtTime(0.0005, t + duration * 0.6)

  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(Math.min(freq * 6, 8000), t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 400), t + duration)

  osc.connect(gain)
  osc2.connect(gain2)
  gain.connect(filter)
  gain2.connect(filter)
  filter.connect(ac.destination)

  osc.start(t)
  osc2.start(t)
  osc.stop(t + duration + 0.05)
  osc2.stop(t + duration + 0.05)
}
