/** Detection range: below drop-tuning D2 (73 Hz) up past high fretted notes. */
export const MIN_FREQ = 60
export const MAX_FREQ = 1000
/**
 * Buffers quieter than this RMS are treated as silence. Kept near digital
 * silence: with autoGainControl disabled, real mics deliver an acoustic
 * guitar at RMS 0.002–0.01, and the NSDF below is amplitude-normalized, so
 * the clarity threshold — not level — is what rejects noise.
 */
export const RMS_GATE = 0.001
/** Minimum NSDF peak value to accept a reading as pitched. */
export const CLARITY_THRESHOLD = 0.85

export function computeRms(buf: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

/**
 * Detect the fundamental frequency of a time-domain buffer in Hz, or null
 * when the signal is too quiet or has no clear pitch.
 *
 * McLeod-style NSDF (normalized square difference) autocorrelation:
 * plain autocorrelation picks the octave above on guitar signals whose 2nd
 * harmonic beats the fundamental (typical on the low E string), so peaks are
 * normalized to [-1, 1] and the *first* key maximum within 90% of the global
 * maximum wins. Parabolic interpolation refines the lag to sub-sample
 * precision (well under a cent).
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  // Remove DC offset (common on real mics): a signal riding on an offset
  // keeps the NSDF positive at every lag, which yields no peaks at all.
  let mean = 0
  for (let i = 0; i < buf.length; i++) mean += buf[i]
  mean /= buf.length
  if (mean !== 0) {
    const centered = new Float32Array(buf.length)
    for (let i = 0; i < buf.length; i++) centered[i] = buf[i] - mean
    buf = centered
  }

  if (computeRms(buf) < RMS_GATE) return null

  const minLag = Math.floor(sampleRate / MAX_FREQ)
  const maxLag = Math.min(Math.ceil(sampleRate / MIN_FREQ), buf.length - 1)
  if (minLag < 1 || maxLag <= minLag) return null

  // NSDF: n(tau) = 2 * sum(x[i] * x[i+tau]) / sum(x[i]^2 + x[i+tau]^2)
  const nsdf = new Float32Array(maxLag + 1)
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0
    let norm = 0
    for (let i = 0; i + tau < buf.length; i++) {
      acf += buf[i] * buf[i + tau]
      norm += buf[i] * buf[i] + buf[i + tau] * buf[i + tau]
    }
    nsdf[tau] = norm > 0 ? (2 * acf) / norm : 0
  }

  // Key maxima: the highest point of each region between a positive-going
  // zero crossing and the following negative-going one.
  const peaks: number[] = []
  let tau = minLag
  while (tau <= maxLag && nsdf[tau] > 0) tau++ // skip the lag-0 lobe still positive at minLag
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau] <= 0) tau++
    let best = -1
    while (tau <= maxLag && nsdf[tau] > 0) {
      if (best === -1 || nsdf[tau] > nsdf[best]) best = tau
      tau++
    }
    if (best !== -1) peaks.push(best)
  }
  if (peaks.length === 0) return null

  let globalMax = -Infinity
  for (const p of peaks) globalMax = Math.max(globalMax, nsdf[p])
  if (globalMax < CLARITY_THRESHOLD) return null

  // First peak close to the global max — defends against octave-up errors
  const chosen = peaks.find((p) => nsdf[p] >= 0.9 * globalMax)
  if (chosen === undefined) return null

  // Parabolic interpolation around the chosen lag for sub-sample precision
  let lag = chosen
  if (chosen > minLag && chosen < maxLag) {
    const a = nsdf[chosen - 1]
    const b = nsdf[chosen]
    const c = nsdf[chosen + 1]
    const denom = a - 2 * b + c
    if (denom !== 0) lag = chosen + (0.5 * (a - c)) / denom
  }

  const freq = sampleRate / lag
  if (freq < MIN_FREQ || freq > MAX_FREQ) return null
  return freq
}
