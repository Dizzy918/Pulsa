"use client";

import { useEffect, useRef, useState } from "react";
import type { Detection } from "@/lib/soundClassifier";

interface Props {
  detection: Detection | null;
  listening: boolean;
}

export function WatchMockup({ detection, listening }: Props) {
  const [buzzing, setBuzzing] = useState(false);
  const lastVibratedRef = useRef<number>(0);

  // Trigger vibration + visual buzz when a real detection lands.
  useEffect(() => {
    if (!detection || detection.category === "silence") return;
    if (detection.timestamp === lastVibratedRef.current) return;
    lastVibratedRef.current = detection.timestamp;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(detection.vibrationPattern);
      } catch {
        /* not supported on this device — visual buzz still fires */
      }
    }
    setBuzzing(true);
    const totalMs = detection.vibrationPattern.reduce((a, b) => a + b, 0) || 400;
    const t = setTimeout(() => setBuzzing(false), Math.min(1800, totalMs));
    return () => clearTimeout(t);
  }, [detection]);

  const showing = detection && detection.category !== "silence";
  const urgencyRing =
    detection?.urgency === "high"
      ? "ring-ink-100"
      : detection?.urgency === "medium"
        ? "ring-ink-300"
        : "ring-ink-600";

  return (
    <div className="relative flex flex-col items-center">
      {/* Strap top */}
      <div className="w-24 h-16 bg-gradient-to-b from-ink-800 to-ink-900 rounded-t-2xl" />

      {/* Watch body */}
      <div
        className={`relative w-64 h-72 rounded-[46px] bg-ink-900 border border-ink-800 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] p-3 transition-transform ${
          buzzing ? "animate-[shake_0.35s_ease-in-out_infinite]" : ""
        }`}
        style={
          buzzing
            ? ({
                animation: "shake 0.08s linear infinite",
              } as React.CSSProperties)
            : undefined
        }
      >
        {/* Crown */}
        <div className="absolute right-[-6px] top-24 w-2 h-6 rounded bg-ink-700" />
        <div className="absolute right-[-4px] top-36 w-1.5 h-10 rounded bg-ink-800" />

        {/* Screen */}
        <div
          className={`w-full h-full rounded-[38px] bg-ink-950 overflow-hidden relative flex flex-col items-center justify-center px-6 ring-2 ring-transparent transition-all ${
            showing ? urgencyRing : ""
          }`}
        >
          {/* Ambient rings when detecting */}
          {showing && (
            <>
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="block w-40 h-40 rounded-full border border-ink-700 opacity-40 animate-pulse-ring" />
              </span>
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  className="block w-40 h-40 rounded-full border border-ink-600 opacity-30 animate-pulse-ring"
                  style={{ animationDelay: "600ms" }}
                />
              </span>
            </>
          )}

          <div className="text-[9px] uppercase tracking-[0.25em] text-ink-500 z-10">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div
            key={detection?.timestamp ?? "idle"}
            className="mt-3 flex flex-col items-center z-10 animate-fade-in"
          >
            <div
              className={`text-5xl leading-none ${
                showing ? "text-ink-100" : "text-ink-600"
              }`}
            >
              {detection?.icon ?? "◦"}
            </div>
            <div
              className={`mt-3 text-center text-[15px] leading-tight font-medium ${
                showing ? "text-ink-100" : "text-ink-500"
              }`}
            >
              {showing
                ? detection?.label
                : listening
                  ? "Listening"
                  : "Idle"}
            </div>
            {showing && (
              <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-500">
                {detection?.urgency} · {Math.round((detection?.confidence ?? 0) * 100)}%
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                listening ? "bg-ink-200" : "bg-ink-700"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Strap bottom */}
      <div className="w-24 h-16 bg-gradient-to-b from-ink-900 to-ink-800 rounded-b-2xl" />

      {/* Buzz indicator (helpful on desktop where nav.vibrate is a no-op) */}
      <div
        className={`mt-4 text-[11px] uppercase tracking-widest transition-opacity ${
          buzzing ? "opacity-100 text-ink-100" : "opacity-40 text-ink-500"
        }`}
      >
        {buzzing ? "▓▓▓  buzzing  ▓▓▓" : "haptics standby"}
      </div>

      <style jsx>{`
        @keyframes shake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1.5px, 1px); }
          50% { transform: translate(1.5px, -1px); }
          75% { transform: translate(-1px, -1.5px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
