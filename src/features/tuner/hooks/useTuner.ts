import { useCallback, useEffect, useRef, useState } from 'react'
import type { Tuning } from '../../../lib/music/tuning'
import { nearestString } from '../../../lib/music/tuner'
import { computeRms, detectPitch } from '../../../lib/audio/pitch'

export type TunerStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unavailable' | 'error'

export interface TunerReading {
  /** Median-smoothed detected frequency in Hz */
  frequency: number
  /** Index into tuning.openMidi of the auto-detected string */
  stringIndex: number
  targetMidi: number
  /** Signed cents from the target, clamped to -50..+50 */
  cents: number
  inTune: boolean
}

export interface Tuner {
  status: TunerStatus
  /** Latest reading, or null while silent */
  reading: TunerReading | null
  /** Smoothed mic input level (RMS, ~0..1) while listening */
  level: number
  /** Call from a click handler (needs a user gesture for mic access) */
  start: () => Promise<void>
  stop: () => void
}

const FFT_SIZE = 2048
/** Consecutive detections required before publishing a reading */
const ATTACK_FRAMES = 2
/** Consecutive silent frames required before clearing the reading */
const RELEASE_FRAMES = 15
/** Median window over recent detections, in frames */
const MEDIAN_WINDOW = 5

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export function useTuner(tuning: Tuning): Tuner {
  const [status, setStatus] = useState<TunerStatus>('idle')
  const [reading, setReading] = useState<TunerReading | null>(null)
  const [level, setLevel] = useState(0)
  const levelRef = useRef(0)

  const tuningRef = useRef(tuning)
  tuningRef.current = tuning

  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const bufRef = useRef(new Float32Array(FFT_SIZE))
  const recentRef = useRef<number[]>([])
  const hitsRef = useRef(0)
  const missesRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    analyserRef.current = null
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
    recentRef.current = []
    hitsRef.current = 0
    missesRef.current = 0
    levelRef.current = 0
    setLevel(0)
    setReading(null)
    setStatus('idle')
  }, [])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = ctxRef.current
    if (!analyser || !ctx) return

    const buf = bufRef.current
    analyser.getFloatTimeDomainData(buf)

    // Exponentially smoothed input level so the UI can show signal arriving
    levelRef.current = levelRef.current * 0.8 + computeRms(buf) * 0.2
    setLevel(levelRef.current)

    const freq = detectPitch(buf, ctx.sampleRate)

    if (freq !== null) {
      missesRef.current = 0
      hitsRef.current += 1
      recentRef.current.push(freq)
      if (recentRef.current.length > MEDIAN_WINDOW) recentRef.current.shift()
      if (hitsRef.current >= ATTACK_FRAMES) {
        const smoothed = median(recentRef.current)
        setReading({ frequency: smoothed, ...nearestString(smoothed, tuningRef.current) })
      }
    } else {
      hitsRef.current = 0
      missesRef.current += 1
      if (missesRef.current >= RELEASE_FRAMES) {
        recentRef.current = []
        setReading(null)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    let stream: MediaStream
    try {
      // Browser defaults (echo cancellation etc.) mangle sustained tones
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('unavailable')
      else setStatus('error')
      return
    }

    const ctx = new AudioContext()
    // Safari can consume the gesture during the getUserMedia await, leaving
    // the context suspended — the analyser would then read only zeros.
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {})
    const source = ctx.createMediaStreamSource(stream)
    // Attenuate upper harmonics and pick noise before analysis
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 1200
    lowpass.Q.value = 0.7
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    source.connect(lowpass)
    lowpass.connect(analyser)

    ctxRef.current = ctx
    streamRef.current = stream
    analyserRef.current = analyser
    setStatus('listening')
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  // Release the mic when the screen unmounts
  useEffect(() => stop, [stop])

  return { status, reading, level, start, stop }
}
