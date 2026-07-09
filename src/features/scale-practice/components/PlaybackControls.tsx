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
    <div className="fixed bottom-0 left-0 lg:left-16 right-0 glass-panel border-t border-outline-variant p-4 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Transport */}
        <div className="flex items-center gap-2">
          <button
            className="bg-primary-container hover:bg-primary hover:text-on-primary transition-colors text-on-primary-container rounded-lg px-6 py-3 flex items-center gap-2 font-semibold shadow-lg cursor-pointer"
            onClick={playback.isPlaying ? playback.pause : playback.play}
            aria-label={playback.isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined filled">
              {playback.isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span>{playback.isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            className="bg-surface-container hover:bg-surface-bright border border-outline-variant text-on-surface rounded-lg px-4 py-3 flex items-center transition-colors cursor-pointer"
            onClick={playback.stop}
            aria-label="Stop"
          >
            <span className="material-symbols-outlined filled">stop</span>
          </button>
          <div className="flex border border-outline-variant rounded-lg overflow-hidden">
            <button
              className="bg-surface-container hover:bg-surface-bright text-on-surface px-3 py-3 border-r border-outline-variant transition-colors cursor-pointer flex items-center"
              onClick={playback.stepBack}
              aria-label="Step back"
            >
              <span className="material-symbols-outlined text-sm">skip_previous</span>
            </button>
            <button
              className="bg-surface-container hover:bg-surface-bright text-on-surface px-3 py-3 transition-colors cursor-pointer flex items-center"
              onClick={playback.stepForward}
              aria-label="Step forward"
            >
              <span className="material-symbols-outlined text-sm">skip_next</span>
            </button>
          </div>
        </div>

        {/* Speed */}
        <div className="flex flex-col flex-1 min-w-[200px] max-w-sm px-4">
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="bpm-slider" className="font-mono text-label-sm uppercase text-outline">
              Speed
            </label>
            <span className="font-mono text-label-sm font-bold text-on-surface">{bpm} BPM</span>
          </div>
          <input
            id="bpm-slider"
            className="slider w-full"
            type="range"
            min={40}
            max={240}
            step={5}
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
          />
        </div>

        {/* Direction + toggles */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="font-mono text-label-sm uppercase text-outline">Direction</label>
            <div className="relative">
              <select
                value={direction}
                onChange={(e) => onDirectionChange(e.target.value as Direction)}
                className="appearance-none bg-surface-container border border-outline-variant text-on-surface rounded px-3 py-1.5 pr-7 font-mono text-label-sm outline-none focus:border-primary cursor-pointer"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-1 top-1.5 text-sm pointer-events-none text-on-surface-variant">
                arrow_drop_down
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => onLoopChange(e.target.checked)}
              className="h-4 w-4 rounded accent-primary-container"
            />
            <span className="font-mono text-label-sm text-on-surface group-hover:text-primary transition-colors">
              Loop
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => onMutedChange(e.target.checked)}
              className="h-4 w-4 rounded accent-primary-container"
            />
            <span className="font-mono text-label-sm text-on-surface group-hover:text-primary transition-colors">
              Mute
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
