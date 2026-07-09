import { useCallback, useEffect, useRef, useState } from 'react'

export type Direction = 'asc' | 'desc' | 'updown'

export const DIRECTIONS: { id: Direction; name: string }[] = [
  { id: 'asc', name: 'Ascending' },
  { id: 'desc', name: 'Descending' },
  { id: 'updown', name: 'Up & Down' },
]

interface PlaybackOptions {
  /** Number of notes in the pattern */
  length: number
  bpm: number
  direction: Direction
  loop: boolean
  /** Called with the pattern index each time a note fires (playback or manual step) */
  onNote: (index: number) => void
}

/** One full pass through the pattern for a direction, as pattern indices */
function buildPass(length: number, direction: Direction): number[] {
  const up = Array.from({ length }, (_, i) => i)
  if (direction === 'asc') return up
  if (direction === 'desc') return [...up].reverse()
  return [...up, ...up.slice(1, -1).reverse(), 0]
}

export interface Playback {
  isPlaying: boolean
  /** Index into the pattern of the highlighted note, or null when idle */
  currentIndex: number | null
  play: () => void
  pause: () => void
  stop: () => void
  stepForward: () => void
  stepBack: () => void
}

export function usePlayback(options: PlaybackOptions): Playback {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  const optionsRef = useRef(options)
  optionsRef.current = options
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

  const passPosRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextTimeRef = useRef(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const { length, bpm, direction, loop, onNote } = optionsRef.current
    if (length === 0) {
      setIsPlaying(false)
      return
    }
    const pass = buildPass(length, direction)
    if (passPosRef.current >= pass.length) {
      if (!loop) {
        setIsPlaying(false)
        return
      }
      passPosRef.current = 0
    }
    const index = pass[passPosRef.current]
    passPosRef.current += 1
    setCurrentIndex(index)
    onNote(index)

    // Drift-corrected scheduling against the wall clock
    const interval = 60000 / bpm
    nextTimeRef.current += interval
    const delay = Math.max(0, nextTimeRef.current - performance.now())
    timerRef.current = setTimeout(tick, delay)
  }, [])

  const play = useCallback(() => {
    if (optionsRef.current.length === 0) return
    clearTimer()
    setIsPlaying(true)
    nextTimeRef.current = performance.now()
    tick()
  }, [clearTimer, tick])

  const pause = useCallback(() => {
    clearTimer()
    setIsPlaying(false)
  }, [clearTimer])

  const stop = useCallback(() => {
    clearTimer()
    setIsPlaying(false)
    setCurrentIndex(null)
    passPosRef.current = 0
  }, [clearTimer])

  const step = useCallback((delta: 1 | -1) => {
    const { length, onNote } = optionsRef.current
    if (length === 0) return
    const base = currentIndexRef.current ?? (delta === 1 ? -1 : length)
    const next = Math.min(length - 1, Math.max(0, base + delta))
    // Keep automated playback in sync if resumed after manual steps (asc pass position)
    passPosRef.current = next
    setCurrentIndex(next)
    onNote(next)
  }, [])

  const stepForward = useCallback(() => step(1), [step])
  const stepBack = useCallback(() => step(-1), [step])

  useEffect(() => clearTimer, [clearTimer])

  return { isPlaying, currentIndex, play, pause, stop, stepForward, stepBack }
}
