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

export interface MicDevice {
  deviceId: string
  label: string
}

export interface Tuner {
  status: TunerStatus
  /** Latest reading, or null while silent */
  reading: TunerReading | null
  /** Smoothed mic input level (RMS, ~0..1) while listening */
  level: number
  /** Available audio inputs (populated once permission is granted) */
  devices: MicDevice[]
  /** Label of the microphone currently being captured */
  activeLabel: string | null
  /** True when the mic is open but delivering only digital silence */
  noSignal: boolean
  /** Call from a click handler (needs a user gesture for mic access) */
  start: () => Promise<void>
  stop: () => void
  /** Switch to a different input device while listening */
  selectDevice: (deviceId: string) => Promise<void>
}

const FFT_SIZE = 2048
/** Consecutive detections required before publishing a reading */
const ATTACK_FRAMES = 2
/** Consecutive silent frames required before clearing the reading */
const RELEASE_FRAMES = 15
/** Median window over recent detections, in frames */
const MEDIAN_WINDOW = 5
/**
 * A live mic always has a noise floor above this; a stream stuck below it is
 * delivering digital silence (wrong device, muted driver, OS-level block).
 */
const SILENCE_RMS = 1e-6
/** Frames of digital silence (~3 s) before declaring no-signal */
const SILENCE_FRAMES = 180

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export function useTuner(tuning: Tuning): Tuner {
  const [status, setStatus] = useState<TunerStatus>('idle')
  const [reading, setReading] = useState<TunerReading | null>(null)
  const [level, setLevel] = useState(0)
  const [devices, setDevices] = useState<MicDevice[]>([])
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [noSignal, setNoSignal] = useState(false)

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
  const levelRef = useRef(0)
  const deviceIdRef = useRef<string | null>(null)
  const silentFramesRef = useRef(0)
  const triedFallbackRef = useRef(false)

  const teardownCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.onmute = null
      track.onunmute = null
      track.stop()
    })
    streamRef.current = null
    analyserRef.current = null
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    teardownCapture()
    recentRef.current = []
    hitsRef.current = 0
    missesRef.current = 0
    levelRef.current = 0
    silentFramesRef.current = 0
    setLevel(0)
    setReading(null)
    setNoSignal(false)
    setStatus('idle')
  }, [teardownCapture])

  /**
   * Open (or reopen) the mic and rebuild the analysis graph. `raw` disables
   * the browser's echo cancellation / noise suppression / AGC — preferred for
   * a tuner, but some drivers deliver a silent track on the raw path, so the
   * watchdog below retries with `raw: false`.
   */
  const openMic = useCallback(async (raw: boolean): Promise<boolean> => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceIdRef.current ? { deviceId: { exact: deviceIdRef.current } } : {}),
          ...(raw ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : {}),
        },
      })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('unavailable')
      else setStatus('error')
      return false
    }

    teardownCapture()

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
    silentFramesRef.current = 0

    const track = stream.getAudioTracks()[0]
    setActiveLabel(track?.label || null)
    if (track) {
      // Chrome mutes the track when the OS stops delivering audio frames
      track.onmute = () => setNoSignal(true)
      track.onunmute = () => setNoSignal(false)
    }

    // Labels are only populated once permission has been granted
    void navigator.mediaDevices
      .enumerateDevices()
      .then((all) =>
        setDevices(
          all
            .filter((d) => d.kind === 'audioinput' && d.deviceId)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }))
        )
      )
      .catch(() => {})

    return true
  }, [teardownCapture])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = ctxRef.current
    if (!analyser || !ctx) {
      // Mid-reopen (fallback/device switch): keep the loop alive
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const buf = bufRef.current
    analyser.getFloatTimeDomainData(buf)
    const rms = computeRms(buf)

    // Exponentially smoothed input level so the UI can show signal arriving
    levelRef.current = levelRef.current * 0.8 + rms * 0.2
    setLevel(levelRef.current)

    // Watchdog: an open stream stuck at digital silence means the capture
    // path is broken, not that the player is between notes
    if (rms < SILENCE_RMS) {
      silentFramesRef.current += 1
      if (silentFramesRef.current === SILENCE_FRAMES) {
        if (!triedFallbackRef.current) {
          // Retry once with the browser's default (processed) capture path
          triedFallbackRef.current = true
          void openMic(false)
        } else {
          setNoSignal(true)
        }
      }
    } else {
      silentFramesRef.current = 0
      setNoSignal(false)
    }

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
  }, [openMic])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    triedFallbackRef.current = false
    setNoSignal(false)
    if (!(await openMic(true))) return
    setStatus('listening')
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [openMic, tick])

  const selectDevice = useCallback(
    async (deviceId: string) => {
      deviceIdRef.current = deviceId
      triedFallbackRef.current = false
      setNoSignal(false)
      if (streamRef.current) await openMic(true)
    },
    [openMic]
  )

  // Release the mic when the screen unmounts
  useEffect(() => stop, [stop])

  return { status, reading, level, devices, activeLabel, noSignal, start, stop, selectDevice }
}
