"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  classify,
  extractFeatures,
  type Detection,
} from "./soundClassifier";

export type ListenerStatus = "idle" | "requesting" | "listening" | "error";

export interface UseSoundListenerResult {
  status: ListenerStatus;
  error: string | null;
  detection: Detection | null;
  levels: number[]; // small waveform for the phone visualiser (0..1)
  start: () => Promise<void>;
  stop: () => void;
}

// How many consecutive frames a non-silence category has to win before we
// commit to it. Prevents flicker on transient blips.
const COMMIT_FRAMES = 3;
// How often we sample features from the analyser (ms).
const TICK_MS = 120;
// Number of bars in the phone waveform.
const WAVE_BARS = 32;

export function useSoundListener(): UseSoundListenerResult {
  const [status, setStatus] = useState<ListenerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: WAVE_BARS }, () => 0),
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const candidateRef = useRef<{ cat: string; count: number } | null>(null);

  const stop = useCallback(() => {
    if (tickTimerRef.current !== null) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    candidateRef.current = null;
    setStatus("idle");
    setDetection(null);
    setLevels(Array.from({ length: WAVE_BARS }, () => 0));
  }, []);

  const start = useCallback(async () => {
    if (status === "listening" || status === "requesting") return;
    setError(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      streamRef.current = stream;
      analyserRef.current = analyser;

      const timeBuf = new Float32Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      // Classification tick (throttled).
      tickTimerRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(timeBuf);
        analyserRef.current.getByteFrequencyData(freqBuf);
        const features = extractFeatures(timeBuf, freqBuf, ctx.sampleRate);
        const next = classify(features);

        // Silence is committed immediately (relaxing state).
        if (next.category === "silence") {
          candidateRef.current = null;
          setDetection((prev) =>
            prev?.category === "silence" ? prev : next,
          );
          return;
        }

        // Non-silence needs to stabilise across a few frames.
        const cand = candidateRef.current;
        if (cand && cand.cat === next.category) {
          cand.count += 1;
        } else {
          candidateRef.current = { cat: next.category, count: 1 };
        }
        if ((candidateRef.current?.count ?? 0) >= COMMIT_FRAMES) {
          setDetection((prev) =>
            prev?.category === next.category && Date.now() - prev.timestamp < 800
              ? prev
              : next,
          );
        }
      }, TICK_MS);

      // Waveform (smoother rAF loop).
      const waveBuf = new Uint8Array(analyser.frequencyBinCount);
      const paintWave = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(waveBuf);
        const step = Math.floor(waveBuf.length / WAVE_BARS);
        const next: number[] = new Array(WAVE_BARS);
        for (let i = 0; i < WAVE_BARS; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += waveBuf[i * step + j] ?? 0;
          next[i] = Math.min(1, sum / step / 200);
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(paintWave);
      };
      rafRef.current = requestAnimationFrame(paintWave);

      setStatus("listening");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not access microphone";
      setError(message);
      setStatus("error");
    }
  }, [status]);

  useEffect(() => () => stop(), [stop]);

  return { status, error, detection, levels, start, stop };
}
