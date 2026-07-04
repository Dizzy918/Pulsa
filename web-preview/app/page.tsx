"use client";

import { PhoneMockup } from "@/components/PhoneMockup";
import { WatchMockup } from "@/components/WatchMockup";
import { useSoundListener } from "@/lib/useSoundListener";

export default function Home() {
  const { status, error, detection, levels, start, stop } = useSoundListener();

  return (
    <main className="relative z-10 min-h-dvh flex flex-col">
      {/* Header */}
      <header className="px-8 sm:px-14 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink-100 text-ink-950 flex items-center justify-center text-sm font-semibold">
            T
          </div>
          <div className="leading-tight">
            <div className="text-sm text-ink-100 font-medium">Tactiq</div>
            <div className="text-[11px] uppercase tracking-widest text-ink-500">
              Hearing · through · vibration
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-500">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === "listening" ? "bg-ink-100" : "bg-ink-700"
            }`}
          />
          {status === "listening"
            ? "Live"
            : status === "error"
              ? "Mic blocked"
              : status === "requesting"
                ? "Requesting…"
                : "Standby"}
        </div>
      </header>

      {/* Hero */}
      <section className="px-8 sm:px-14 pt-4 pb-10 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl text-ink-100 font-medium leading-tight tracking-tight">
          The sounds around you,
          <br />
          <span className="text-ink-400">felt on your wrist.</span>
        </h1>
        <p className="mt-4 text-ink-400 leading-relaxed max-w-xl">
          Tactiq listens to your surroundings through your phone,
          identifies what&rsquo;s happening, and sends a clear visual and haptic
          signal to a paired smart band — so alarms, doorbells, voices and
          alerts never go unnoticed.
        </p>
      </section>

      {/* Devices stage */}
      <section className="flex-1 px-8 sm:px-14 pb-16">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
          <PhoneMockup
            status={status}
            detection={detection}
            levels={levels}
            onStart={start}
            onStop={stop}
            error={error}
          />

          {/* Connection */}
          <div className="hidden lg:flex flex-col items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500">
              paired
            </div>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-ink-600 to-transparent" />
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500">
              BLE
            </div>
          </div>

          <WatchMockup detection={detection} listening={status === "listening"} />
        </div>

        {/* Legend */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-[11px] text-ink-400">
          {[
            { icon: "▲", label: "Alarm" },
            { icon: "◆", label: "Doorbell" },
            { icon: "♥", label: "Baby cry" },
            { icon: "✦", label: "Dog bark" },
            { icon: "◉", label: "Speech" },
            { icon: "♪", label: "Music" },
            { icon: "◈", label: "Loud noise" },
            { icon: "◦", label: "Quiet" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-800 bg-ink-900/40"
            >
              <span className="text-base text-ink-100">{s.icon}</span>
              <span className="uppercase tracking-widest text-[10px]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-8 sm:px-14 pb-8 text-[10px] uppercase tracking-widest text-ink-500 flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>Prototype · on-device audio only</span>
        <span>Designed for the Deaf and hard-of-hearing</span>
      </footer>
    </main>
  );
}
