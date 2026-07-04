// @ts-ignore - fft.js has no bundled types
import FFT from "fft.js";
import AudioRecord from "react-native-audio-record";
import { extractFeatures, classify, getMeta, type Detection } from "./soundClassifier";
import { classifyWaveform, isYamnetReady, loadYamnet, YAMNET_INPUT_SAMPLES } from "./yamnet";

// Decode base64 PCM chunks straight into an Int16Array without a Buffer polyfill.
// Hermes/JSC both expose `atob` globally on modern RN.
function base64ToInt16(base64: string): Int16Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 1);
}

const SAMPLE_RATE = 16000;
const FFT_SIZE = 2048;
const WAVE_BARS = 32;
const ML_HOP_MS = 500; // run YAMNet at most twice a second

// Reusable buffers so we're not allocating 8x/sec.
const fft = new FFT(FFT_SIZE);
const complexOut = fft.createComplexArray();
const timeBuf = new Float32Array(FFT_SIZE);
const magSpec = new Float32Array(FFT_SIZE / 2);

// Rolling buffer of the most recent PCM samples for the FFT/waveform display.
const ring = new Float32Array(FFT_SIZE);
let ringWrite = 0;
let ringFilled = 0;

// Longer rolling buffer feeding the ML model (0.975 s of context).
const mlRing = new Float32Array(YAMNET_INPUT_SAMPLES);
const mlWindow = new Float32Array(YAMNET_INPUT_SAMPLES);
let mlWrite = 0;
let mlFilled = 0;
let lastMlAt = 0;
let lastMlDetection: Detection | null = null;

export type Listener = (payload: {
  detection: Detection;
  levels: number[]; // 0..1
}) => void;

let currentListener: Listener | null = null;
let dataSubscribed = false;
let candidate: { cat: string; count: number } | null = null;
const COMMIT_FRAMES = 3;

function feedPcm(int16: Int16Array) {
  for (let i = 0; i < int16.length; i++) {
    const v = int16[i] / 32768;
    ring[ringWrite] = v;
    ringWrite = (ringWrite + 1) % FFT_SIZE;
    if (ringFilled < FFT_SIZE) ringFilled++;
    mlRing[mlWrite] = v;
    mlWrite = (mlWrite + 1) % YAMNET_INPUT_SAMPLES;
    if (mlFilled < YAMNET_INPUT_SAMPLES) mlFilled++;
  }
}

function silenceDetection(rms: number, engine: "ml" | "dsp"): Detection {
  return {
    ...getMeta("silence"),
    label: rms < 0.008 ? "Quiet" : "Listening…",
    confidence: rms < 0.008 ? 0.95 : 0.4,
    timestamp: Date.now(),
    engine,
  };
}

function computeSpectrum(): { levels: number[]; rms: number } {
  for (let i = 0; i < FFT_SIZE; i++) {
    timeBuf[i] = ring[(ringWrite + i) % FFT_SIZE];
  }
  for (let i = 0; i < FFT_SIZE; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
    timeBuf[i] *= w;
  }
  fft.realTransform(complexOut, timeBuf);
  fft.completeSpectrum(complexOut);
  for (let i = 0; i < FFT_SIZE / 2; i++) {
    const re = complexOut[2 * i];
    const im = complexOut[2 * i + 1];
    magSpec[i] = Math.sqrt(re * re + im * im);
  }
  // Waveform bars: log-scaled band energy in WAVE_BARS bins.
  const levels: number[] = new Array(WAVE_BARS);
  const perBar = Math.floor(magSpec.length / WAVE_BARS);
  for (let i = 0; i < WAVE_BARS; i++) {
    let sum = 0;
    for (let j = 0; j < perBar; j++) sum += magSpec[i * perBar + j];
    const avg = sum / perBar;
    levels[i] = Math.min(1, Math.log10(1 + avg / 50) / 2);
  }
  let sumSq = 0;
  for (let i = 0; i < FFT_SIZE; i++) sumSq += timeBuf[i] * timeBuf[i];
  return { levels, rms: Math.sqrt(sumSq / FFT_SIZE) };
}

// ML path: YAMNet sees ~1 s of context per inference, so a single confident
// window is already stable — no multi-frame commit gate needed.
function mlDetect(rms: number): Detection {
  const now = Date.now();
  if (mlFilled >= YAMNET_INPUT_SAMPLES && now - lastMlAt >= ML_HOP_MS) {
    lastMlAt = now;
    for (let i = 0; i < YAMNET_INPUT_SAMPLES; i++) {
      mlWindow[i] = mlRing[(mlWrite + i) % YAMNET_INPUT_SAMPLES];
    }
    lastMlDetection = classifyWaveform(mlWindow);
  }
  return lastMlDetection ?? silenceDetection(rms, "ml");
}

// DSP fallback path: cheap per-chunk heuristics, gated so a category must win
// several consecutive frames before being surfaced.
function dspDetect(): Detection {
  const features = extractFeatures(timeBuf, magSpec, SAMPLE_RATE);
  const next = { ...classify(features), engine: "dsp" as const };

  if (next.category === "silence") {
    candidate = null;
    return next;
  }
  if (candidate && candidate.cat === next.category) candidate.count++;
  else candidate = { cat: next.category, count: 1 };

  if (candidate.count >= COMMIT_FRAMES) return next;
  return silenceDetection(features.rms, "dsp");
}

function subscribeOnce() {
  if (dataSubscribed) return;
  dataSubscribed = true;
  AudioRecord.on("data", (base64) => {
    const int16 = base64ToInt16(base64);
    feedPcm(int16);
    if (ringFilled < FFT_SIZE || !currentListener) return;

    const { levels, rms } = computeSpectrum();
    const detection = isYamnetReady() ? mlDetect(rms) : dspDetect();
    currentListener({ detection, levels });
  });
}

export async function startListening(listener: Listener) {
  await loadYamnet(); // no-op after first call; falls back to DSP on failure
  AudioRecord.init({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    bitsPerSample: 16,
    audioSource: 6, // VOICE_RECOGNITION on Android; ignored on iOS
    wavFile: "tactiq.wav",
  });
  currentListener = listener;
  subscribeOnce();
  AudioRecord.start();
}

export async function stopListening() {
  currentListener = null;
  candidate = null;
  ringWrite = 0;
  ringFilled = 0;
  mlWrite = 0;
  mlFilled = 0;
  lastMlDetection = null;
  try {
    await AudioRecord.stop();
  } catch {
    // no-op
  }
}

export function activeEngine(): "ml" | "dsp" {
  return isYamnetReady() ? "ml" : "dsp";
}
