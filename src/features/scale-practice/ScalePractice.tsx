import { useEffect, useMemo, useRef, useState } from 'react'
import { midiName, pitchClassName } from '../../lib/music/notes'
import { getScale } from '../../lib/music/scales'
import { STANDARD_TUNING } from '../../lib/music/tuning'
import { buildPattern, getPositions } from '../../lib/music/patterns'
import { playNote } from '../../lib/audio/synth'
import { usePlayback, type Direction } from './hooks/usePlayback'
import { Fretboard, type LabelMode } from './components/Fretboard'
import { ScaleSelects, BoardSettings } from './components/ScaleControls'
import { PlaybackControls } from './components/PlaybackControls'

export function ScalePractice() {
  const [rootPc, setRootPc] = useState(9) // A
  const [scaleId, setScaleId] = useState('minor-pentatonic')
  const [positionIndex, setPositionIndex] = useState(2) // classic fret-5 box for A
  const [capo, setCapo] = useState(0)
  const [bpm, setBpm] = useState(80)
  const [direction, setDirection] = useState<Direction>('asc')
  const [loop, setLoop] = useState(true)
  const [muted, setMuted] = useState(false)
  const [labelMode, setLabelMode] = useState<LabelMode>('degree')

  const scale = useMemo(() => getScale(scaleId), [scaleId])
  const positions = useMemo(
    () => getPositions(rootPc, scale, STANDARD_TUNING, capo),
    [rootPc, scale, capo]
  )
  const safePositionIndex = Math.min(positionIndex, positions.length - 1)
  const anchorFret = positions[safePositionIndex].anchorFret

  const pattern = useMemo(
    () => buildPattern(rootPc, scale, STANDARD_TUNING, capo, anchorFret),
    [rootPc, scale, capo, anchorFret]
  )

  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const patternRef = useRef(pattern)
  patternRef.current = pattern

  const playback = usePlayback({
    length: pattern.length,
    bpm,
    direction,
    loop,
    onNote: (i) => {
      const note = patternRef.current[i]
      if (note && !mutedRef.current) playNote(note.midi, Math.min(0.5, (60 / bpm) * 0.95))
    },
  })

  // Changing the pattern invalidates the highlighted note — reset playback
  const { stop } = playback
  useEffect(() => stop(), [pattern, stop])

  const soundingRoot = pitchClassName((rootPc + capo) % 12)
  const currentNote = playback.currentIndex !== null ? pattern[playback.currentIndex] : null

  return (
    <section className="space-y-8">
      {/* Hero panel: scale title + main selectors */}
      <div className="glass-panel p-6 rounded-xl flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-display-lg font-bold tracking-tight mb-2">
            {pitchClassName(rootPc)} {scale.name}
          </h1>
          <p className="text-on-surface-variant">
            {capo > 0 ? (
              <>
                Capo {capo} — sounds as{' '}
                <strong className="text-tertiary font-semibold">
                  {soundingRoot} {scale.name}
                </strong>
              </>
            ) : (
              'Pick a root and scale, then hit play.'
            )}
          </p>
        </div>
        <ScaleSelects
          rootPc={rootPc}
          scaleId={scaleId}
          onRootChange={setRootPc}
          onScaleChange={setScaleId}
        />
      </div>

      {/* Fretboard settings */}
      <BoardSettings
        positionIndex={safePositionIndex}
        positions={positions}
        capo={capo}
        labelMode={labelMode}
        onPositionChange={setPositionIndex}
        onCapoChange={setCapo}
        onLabelModeChange={setLabelMode}
      />

      {/* Fretboard */}
      <Fretboard
        pattern={pattern}
        scale={scale}
        capo={capo}
        currentIndex={playback.currentIndex}
        labelMode={labelMode}
        stringCount={STANDARD_TUNING.openMidi.length}
      />

      {/* Now-playing readout */}
      <p className="font-mono text-label-sm text-on-surface-variant min-h-4 px-2" aria-live="polite">
        {currentNote
          ? `NOW: ${midiName(currentNote.midi)} — STRING ${6 - currentNote.string}, FRET ${capo + currentNote.fret}`
          : ' '}
      </p>

      <PlaybackControls
        playback={playback}
        bpm={bpm}
        direction={direction}
        loop={loop}
        muted={muted}
        onBpmChange={setBpm}
        onDirectionChange={setDirection}
        onLoopChange={setLoop}
        onMutedChange={setMuted}
      />
    </section>
  )
}
