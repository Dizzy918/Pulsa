"use client";

import type { Detection } from "@/lib/soundClassifier";
import type { ListenerStatus } from "@/lib/useSoundListener";

interface Props {
  status: ListenerStatus;
  detection: Detection | null;
  levels: number[];
  onStart: () => void;
  onStop: () => void;
  error: string | null;
}

export function PhoneMockup({
  status,
  detection,
  levels,
  onStart,
  onStop,
  error,
}: Props) {
  const listening = status === "listening";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative">
      {/* Device frame */}
      <div className="w-[300px] h-[620px] rounded-[48px] bg-ink-900 border border-ink-800 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] p-3 relative">
        {/* side buttons */}
        <div className="absolute left-[-3px] top-32 w-1 h-16 rounded-r bg-ink-800" />
        <div className="absolute left-[-3px] top-52 w-1 h-24 rounded-r bg-ink-800" />
        <div className="absolute right-[-3px] top-40 w-1 h-20 rounded-l bg-ink-800" />

        {/* Screen */}
        <div className="w-full h-full rounded-[38px] bg-ink-950 overflow-hidden flex flex-col relative">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-20" />

          {/* Status bar */}
          <div className="flex justify-between items-center px-6 pt-3 text-[11px] text-ink-300 font-medium z-10">
            <span>{time}</span>
            <span className="flex gap-1 items-center">
              <span className="w-3 h-3 rounded-full border border-ink-500" />
              <span>•••</span>
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col px-6 pt-8 pb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Tactiq
            </div>
            <div className="mt-1 text-xl font-medium text-ink-100">
              {listening ? "Listening" : status === "error" ? "Blocked" : "Ready"}
            </div>
            <div className="mt-1 text-[13px] text-ink-400 leading-relaxed">
              {listening
                ? "Ambient sound is being analysed on-device and streamed to your watch."
                : status === "error"
                  ? error ?? "Microphone unavailable."
                  : "Tap the button to begin capturing ambient sound."}
            </div>

            {/* Live waveform */}
            <div className="mt-8 h-32 flex items-end justify-between gap-[3px]">
              {levels.map((v, i) => {
                const h = Math.max(3, Math.round(v * 128));
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-ink-700 to-ink-300 transition-[height] duration-75"
                    style={{ height: `${h}px`, opacity: listening ? 1 : 0.25 }}
                  />
                );
              })}
            </div>

            {/* Current detection card */}
            <div
              key={detection?.timestamp ?? "none"}
              className={`mt-8 rounded-2xl border border-ink-800 bg-ink-900/60 backdrop-blur px-4 py-4 ${
                detection && detection.category !== "silence"
                  ? "animate-fade-in"
                  : ""
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">
                Detected
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl leading-none text-ink-100">
                  {detection?.icon ?? "◦"}
                </span>
                <div>
                  <div className="text-base text-ink-100">
                    {detection?.label ?? "—"}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {detection && detection.category !== "silence"
                      ? `${Math.round(detection.confidence * 100)}% confidence · ${detection.urgency}`
                      : listening
                        ? "Waiting for sound"
                        : "Not active"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={listening ? onStop : onStart}
                disabled={status === "requesting"}
                className={`w-full h-12 rounded-full font-medium text-sm transition
                  ${
                    listening
                      ? "bg-ink-800 text-ink-100 hover:bg-ink-700"
                      : "bg-ink-100 text-ink-950 hover:bg-white"
                  }
                  disabled:opacity-50`}
              >
                {status === "requesting"
                  ? "Requesting mic…"
                  : listening
                    ? "Stop listening"
                    : "Start listening"}
              </button>
              <div className="mt-3 text-center text-[10px] text-ink-500 tracking-wider uppercase">
                Paired · Watch connected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
