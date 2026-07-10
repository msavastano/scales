import { useState } from 'react'
import { getTuning } from '../../lib/music/tuning'
import { useTuner } from './hooks/useTuner'
import { TunerMeter } from './components/TunerMeter'
import { StringIndicators } from './components/StringIndicators'
import { TuningSelector } from './components/TuningSelector'
import { MicSelector } from './components/MicSelector'

/** Map RMS to a bar width: -60 dBFS -> 0%, 0 dBFS -> 100% */
function levelPercent(rms: number): number {
  if (rms <= 0) return 0
  const db = 20 * Math.log10(rms)
  return Math.max(0, Math.min(100, 100 + (db / 60) * 100))
}

const STATUS_MESSAGES: Record<string, string> = {
  denied: "Microphone access was denied. Allow it in your browser's site settings and try again.",
  unavailable: "No microphone found, or this page isn't served over HTTPS.",
  error: 'Something went wrong opening the microphone. Try again.',
}

export function Tuner() {
  const [tuningId, setTuningId] = useState('standard')
  const tuning = getTuning(tuningId)
  const tuner = useTuner(tuning)

  const listening = tuner.status === 'listening'
  const failure = STATUS_MESSAGES[tuner.status]

  return (
    <section className="space-y-8">
      {/* Hero panel: title + tuning select + mic toggle */}
      <div className="glass-panel p-6 rounded-xl flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-display-lg font-bold tracking-tight mb-2">
            Tuner
          </h1>
          <p className="text-on-surface-variant">
            {listening
              ? 'Listening — play a string and watch the needle.'
              : 'Pick a tuning, start the mic, and pluck a string. Tap a note button to hear its reference tone.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto">
          <TuningSelector tuningId={tuningId} onChange={setTuningId} />
          <button
            type="button"
            onClick={() => (listening ? tuner.stop() : void tuner.start())}
            disabled={tuner.status === 'requesting'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-label-sm font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait ${
              listening
                ? 'bg-primary text-on-primary hover:opacity-90'
                : 'bg-surface-container text-on-surface border border-outline hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {listening ? 'mic_off' : 'mic'}
            </span>
            {tuner.status === 'requesting'
              ? 'Waiting for permission…'
              : listening
                ? 'Stop'
                : 'Start tuning'}
          </button>
        </div>
      </div>

      {failure && (
        <div className="glass-panel rounded-xl p-4 border border-error/40 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">mic_off</span>
          <p className="text-sm">{failure}</p>
        </div>
      )}

      {listening && tuner.noSignal && (
        <div className="glass-panel rounded-xl p-4 border border-error/40 text-error flex items-start gap-3">
          <span className="material-symbols-outlined">volume_off</span>
          <div className="text-sm space-y-1">
            <p>
              The microphone is open but no sound is arriving. Try a different microphone below,
              and check your system sound settings — make sure the right input device is selected
              and its input volume is turned up.
            </p>
            {tuner.activeLabel && (
              <p className="text-on-surface-variant">
                Listening to: <span className="font-mono">{tuner.activeLabel}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <TunerMeter reading={tuner.reading} listening={listening} />

      {listening && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-2">
          <div className="flex items-center gap-3 flex-1 min-w-48" aria-hidden="true">
            <span className="material-symbols-outlined text-outline text-xl">mic</span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100"
                style={{ width: `${levelPercent(tuner.level)}%` }}
              />
            </div>
            <span className="font-mono text-label-sm text-outline">INPUT</span>
          </div>
          {tuner.devices.length > 1 && (
            <MicSelector
              devices={tuner.devices}
              activeLabel={tuner.activeLabel}
              onChange={(id) => void tuner.selectDevice(id)}
            />
          )}
        </div>
      )}

      <StringIndicators
        tuning={tuning}
        activeStringIndex={tuner.reading?.stringIndex ?? null}
        inTune={tuner.reading?.inTune ?? false}
      />
    </section>
  )
}
