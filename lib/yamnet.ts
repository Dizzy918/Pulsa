// On-device YAMNet (TFLite): 0.975 s of 16 kHz mono PCM → 521 AudioSet scores,
// reduced to our 8 alert categories via yamnetMap.ts. If the model asset or
// runtime is unavailable, callers fall back to the DSP classifier.
import { loadTensorflowModel, type TensorflowModel } from "react-native-fast-tflite";
import { getMeta, type Detection } from "./soundClassifier";
import { YAMNET_CATEGORY, YAMNET_LABELS } from "./yamnetMap";

export const YAMNET_INPUT_SAMPLES = 15600; // 0.975 s @ 16 kHz
const SCORE_THRESHOLD = 0.25;

let model: TensorflowModel | null = null;
let loadAttempted = false;

export async function loadYamnet(): Promise<boolean> {
  if (model) return true;
  if (loadAttempted) return false;
  loadAttempted = true;
  try {
    model = await loadTensorflowModel(require("../assets/models/yamnet.tflite"));
    return true;
  } catch (e) {
    console.warn("[yamnet] model unavailable — using DSP fallback classifier", e);
    return false;
  }
}

export function isYamnetReady(): boolean {
  return model != null;
}

/**
 * Classify one 15600-sample waveform. Returns null when nothing alert-worthy
 * is detected (ambient classes, or every mapped class scored below threshold).
 */
export function classifyWaveform(waveform: Float32Array): Detection | null {
  if (!model) return null;
  const outputs = model.runSync([waveform]);
  const scores = outputs[0] as unknown as Float32Array; // [521] (or [1,521] flattened)

  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < scores.length && i < YAMNET_CATEGORY.length; i++) {
    if (YAMNET_CATEGORY[i] !== null && scores[i] > bestScore) {
      bestScore = scores[i];
      bestIdx = i;
    }
  }
  if (bestIdx < 0 || bestScore < SCORE_THRESHOLD) return null;

  const category = YAMNET_CATEGORY[bestIdx]!;
  return {
    ...getMeta(category),
    // The concrete AudioSet class name ("Smoke detector, smoke alarm") is more
    // useful on screen and on the wrist than the generic category label.
    label: YAMNET_LABELS[bestIdx],
    confidence: Math.min(0.99, bestScore),
    timestamp: Date.now(),
    engine: "ml",
  };
}
