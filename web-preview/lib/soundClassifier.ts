export type SoundCategory =
  | "silence"
  | "speech"
  | "alarm"
  | "doorbell"
  | "baby_cry"
  | "dog_bark"
  | "music"
  | "loud_noise";

export interface Detection {
  category: SoundCategory;
  label: string;
  confidence: number;
  urgency: "low" | "medium" | "high";
  vibrationPattern: number[];
  icon: string;
  timestamp: number;
}

export interface AudioFeatures {
  rms: number;
  peak: number;
  dominantHz: number;
  spectralCentroidHz: number;
  zeroCrossingRate: number;
  lowBand: number;
  midBand: number;
  highBand: number;
  bandSpread: number;
}

const CATEGORY_META: Record<
  SoundCategory,
  Omit<Detection, "confidence" | "timestamp">
> = {
  silence: {
    category: "silence",
    label: "Quiet",
    urgency: "low",
    vibrationPattern: [],
    icon: "◦",
  },
  speech: {
    category: "speech",
    label: "Someone is speaking",
    urgency: "low",
    vibrationPattern: [80, 60, 80],
    icon: "◉",
  },
  alarm: {
    category: "alarm",
    label: "Alarm / Siren",
    urgency: "high",
    vibrationPattern: [300, 100, 300, 100, 300, 100, 300],
    icon: "▲",
  },
  doorbell: {
    category: "doorbell",
    label: "Doorbell / Knock",
    urgency: "medium",
    vibrationPattern: [150, 80, 150],
    icon: "◆",
  },
  baby_cry: {
    category: "baby_cry",
    label: "Baby crying",
    urgency: "high",
    vibrationPattern: [200, 100, 200, 100, 400],
    icon: "♥",
  },
  dog_bark: {
    category: "dog_bark",
    label: "Dog barking",
    urgency: "medium",
    vibrationPattern: [100, 60, 100, 60, 100],
    icon: "✦",
  },
  music: {
    category: "music",
    label: "Music playing",
    urgency: "low",
    vibrationPattern: [60, 40, 60],
    icon: "♪",
  },
  loud_noise: {
    category: "loud_noise",
    label: "Loud noise nearby",
    urgency: "medium",
    vibrationPattern: [250, 120, 250],
    icon: "◈",
  },
};

export function extractFeatures(
  timeDomain: Float32Array,
  freqDomain: Uint8Array,
  sampleRate: number,
): AudioFeatures {
  // RMS and peak from time-domain samples (already -1..1)
  let sumSq = 0;
  let peak = 0;
  let zeroCrossings = 0;
  let prev = timeDomain[0] ?? 0;
  for (let i = 0; i < timeDomain.length; i++) {
    const v = timeDomain[i];
    sumSq += v * v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    if ((v >= 0 && prev < 0) || (v < 0 && prev >= 0)) zeroCrossings++;
    prev = v;
  }
  const rms = Math.sqrt(sumSq / timeDomain.length);
  const zeroCrossingRate = zeroCrossings / timeDomain.length;

  // Frequency-domain features. freqDomain[i] is 0..255 magnitude for bin i.
  // Bin i corresponds to (i * sampleRate / (2 * freqDomain.length)) Hz.
  const nyquist = sampleRate / 2;
  const hzPerBin = nyquist / freqDomain.length;

  let weightedSum = 0;
  let magnitudeSum = 0;
  let dominantBin = 0;
  let dominantMag = 0;
  let low = 0,
    mid = 0,
    high = 0;
  let lowCount = 0,
    midCount = 0,
    highCount = 0;

  for (let i = 1; i < freqDomain.length; i++) {
    const mag = freqDomain[i];
    const hz = i * hzPerBin;
    weightedSum += mag * hz;
    magnitudeSum += mag;
    if (mag > dominantMag) {
      dominantMag = mag;
      dominantBin = i;
    }
    if (hz < 500) {
      low += mag;
      lowCount++;
    } else if (hz < 2000) {
      mid += mag;
      midCount++;
    } else {
      high += mag;
      highCount++;
    }
  }

  const spectralCentroidHz = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  const dominantHz = dominantBin * hzPerBin;

  const lowBand = lowCount ? low / lowCount / 255 : 0;
  const midBand = midCount ? mid / midCount / 255 : 0;
  const highBand = highCount ? high / highCount / 255 : 0;

  // A rough measure of how spread the energy is across the spectrum.
  const bands = [lowBand, midBand, highBand];
  const mean = (lowBand + midBand + highBand) / 3;
  const variance =
    bands.reduce((acc, b) => acc + (b - mean) ** 2, 0) / bands.length;
  const bandSpread = 1 - Math.min(1, Math.sqrt(variance) * 3);

  return {
    rms,
    peak,
    dominantHz,
    spectralCentroidHz,
    zeroCrossingRate,
    lowBand,
    midBand,
    highBand,
    bandSpread,
  };
}

// Rules-based classifier. Each rule returns a score in [0,1] for its category;
// the highest-scoring category above the confidence floor wins.
export function classify(f: AudioFeatures): Detection {
  const scores: Partial<Record<SoundCategory, number>> = {};

  // Silence — very low RMS regardless of other features.
  if (f.rms < 0.008) scores.silence = 1;

  // Speech — mid-frequency energy dominates, moderate ZCR, moderate loudness.
  if (f.rms > 0.015 && f.rms < 0.2) {
    const centroidFit = clamp01(1 - Math.abs(f.spectralCentroidHz - 1400) / 1400);
    const midDominance = clamp01(f.midBand / Math.max(0.05, f.lowBand + f.highBand));
    const zcrFit = clamp01(1 - Math.abs(f.zeroCrossingRate - 0.08) / 0.08);
    scores.speech = 0.4 * centroidFit + 0.35 * midDominance + 0.25 * zcrFit;
  }

  // Alarm / siren — very loud, narrow high-mid band, sustained, low band spread.
  if (f.rms > 0.12 && f.dominantHz > 700 && f.dominantHz < 3500) {
    const loudness = clamp01((f.rms - 0.12) / 0.4);
    const narrow = 1 - f.bandSpread;
    scores.alarm = 0.5 * loudness + 0.5 * narrow;
  }

  // Doorbell / knock — sharp peak, short attack, high peak-to-rms ratio.
  const crest = f.peak / Math.max(0.001, f.rms);
  if (crest > 6 && f.peak > 0.4) {
    scores.doorbell = clamp01((crest - 6) / 10) * 0.7 + 0.3;
  }

  // Baby cry — high fundamental (300–600 Hz), high harmonic energy, sustained loudness.
  if (f.rms > 0.05 && f.dominantHz > 300 && f.dominantHz < 700) {
    const highHarmonics = clamp01(f.highBand * 2.5);
    const pitchFit = 1 - Math.abs(f.dominantHz - 450) / 450;
    scores.baby_cry = 0.5 * highHarmonics + 0.5 * clamp01(pitchFit);
  }

  // Dog bark — impulsive, low-mid frequency, moderate-to-loud.
  if (f.rms > 0.08 && f.dominantHz > 150 && f.dominantHz < 900 && crest > 3.5) {
    const impulsive = clamp01((crest - 3.5) / 6);
    const bandFit = clamp01(f.lowBand + f.midBand);
    scores.dog_bark = 0.5 * impulsive + 0.5 * bandFit;
  }

  // Music — broad spectral spread, sustained energy, moderate loudness.
  if (f.rms > 0.04 && f.bandSpread > 0.55) {
    scores.music = 0.5 * f.bandSpread + 0.5 * clamp01(f.rms * 3);
  }

  // Loud noise fallback — anything above a loudness threshold that didn't fit well.
  if (f.rms > 0.1) scores.loud_noise = clamp01((f.rms - 0.1) / 0.5) * 0.6;

  // Pick the winner.
  let best: SoundCategory = "silence";
  let bestScore = 0;
  for (const [cat, s] of Object.entries(scores) as [SoundCategory, number][]) {
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }

  // Confidence floor — if nothing is confident, report silence.
  if (bestScore < 0.25) {
    best = "silence";
    bestScore = f.rms < 0.008 ? 0.95 : 0.4;
  }

  return {
    ...CATEGORY_META[best],
    confidence: Math.min(0.99, bestScore),
    timestamp: Date.now(),
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
