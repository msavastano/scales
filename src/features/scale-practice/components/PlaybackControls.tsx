import type { Playback, Direction } from '../hooks/usePlayback'
import { DIRECTIONS } from '../hooks/usePlayback'

interface PlaybackControlsProps {
  playback: Playback
  bpm: number
  direction: Direction
  loop: boolean
  muted: boolean
  onBpmChange: (bpm: number) => void
  onDirectionChange: (d: Direction) => void
  onLoopChange: (loop: boolean) => void
  onMutedChange: (muted: boolean) => void
}

export function PlaybackControls({
  playback,
  bpm,
  direction,
  loop,
  muted,
  onBpmChange,
  onDirectionChange,
  onLoopChange,
  onMutedChange,
}: PlaybackControlsProps) {
  return (
    <div className="controls-row playback">
      <div className="transport">
        <button
          className="btn primary"
          onClick={playback.isPlaying ? playback.pause : playback.play}
          aria-label={playback.isPlaying ? 'Pause' : 'Play'}
        >
          {playback.isPlaying ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button className="btn" onClick={playback.stop} aria-label="Stop">
          ■ Stop
        </button>
        <button className="btn" onClick={playback.stepBack} aria-label="Step back">
          ◀ Step
        </button>
        <button className="btn" onClick={playback.stepForward} aria-label="Step forward">
          Step ▶
        </button>
      </div>

      <label className="control bpm">
        <span>
          Speed: <strong>{bpm} BPM</strong>
        </span>
        <input
          type="range"
          min={40}
          max={240}
          step={5}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
        />
      </label>

      <label className="control">
        <span>Direction</span>
        <select value={direction} onChange={(e) => onDirectionChange(e.target.value as Direction)}>
          {DIRECTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="control checkbox">
        <input type="checkbox" checked={loop} onChange={(e) => onLoopChange(e.target.checked)} />
        <span>Loop</span>
      </label>

      <label className="control checkbox">
        <input type="checkbox" checked={muted} onChange={(e) => onMutedChange(e.target.checked)} />
        <span>Mute</span>
      </label>
    </div>
  )
}
