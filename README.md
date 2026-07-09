# Scales 🎸

A guitar practice app. The first feature is **Scale Practice**: pick a root,
scale, position, and capo, then step through the scale on an interactive
fretboard — visually and audibly — at any tempo.

## Features

### Scale Practice
- **Scales**: Major, Natural/Harmonic/Melodic Minor, Major/Minor Pentatonic, Blues — in all 12 keys
- **Box positions**: playable fingering patterns generated across the neck
- **Playback**: play/pause/stop, manual step forward/back, 40–240 BPM,
  ascending/descending/up-and-down, looping, synthesized note audio (mutable)
- **Capo**: patterns shift with the capo and the sounding key is shown
- **Labels**: toggle between scale degrees and note names

## Development

```sh
npm install
npm run dev      # start dev server
npm test         # run unit tests (vitest)
npm run build    # typecheck + production build
```

## Architecture

Built with React + Vite + TypeScript, organized for adding more features:

```
src/
├── app/                  # shell — header, nav, feature registry (features.ts)
├── features/
│   └── scale-practice/   # feature module: components + hooks
└── lib/                  # shared, feature-agnostic libraries
    ├── music/            # notes, scales, tunings, pattern generation
    └── audio/            # Web Audio synth
```

To add a feature: create `src/features/<name>/`, then register it in
`src/app/features.ts`. Music-theory and audio utilities in `src/lib` are
reusable across features.
