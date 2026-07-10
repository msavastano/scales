import { useState } from 'react'
import { getTuning } from '../../lib/music/tuning'
import { useTuner } from './hooks/useTuner'
import { TunerMeter } from './components/TunerMeter'
import { StringIndicators } from './components/StringIndicators'
import { TuningSelector } from './components/TuningSelector'

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

      <TunerMeter reading={tuner.reading} listening={listening} />

      <StringIndicators
        tuning={tuning}
        activeStringIndex={tuner.reading?.stringIndex ?? null}
        inTune={tuner.reading?.inTune ?? false}
      />
    </section>
  )
}
