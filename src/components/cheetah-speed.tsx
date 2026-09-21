import { useEffect, useRef, useState } from "react";
import { SprintGame, type Hud } from "@/game/sprint";

const INITIAL: Hud = {
  mode: "title",
  speedMph: 0,
  topMph: 0,
  bestMph: 0,
  distanceM: 0,
  bestDistanceM: 0,
  prey: 0,
  streak: 0,
  heat: 0,
};

export function CheetahSpeed() {
  const ref = useRef<HTMLCanvasElement>(null);
  const game = useRef<SprintGame | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = new SprintGame(canvas, setHud);
    game.current = g;
    return () => g.destroy();
  }, []);

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden bg-ink text-cream">
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          game.current?.onPointerDown(e.clientY);
        }}
        onPointerUp={(e) => game.current?.onPointerUp(e.clientY)}
        onPointerCancel={(e) => game.current?.onPointerUp(e.clientY)}
      />

      {hud.mode === "playing" && <PlayHud hud={hud} />}
      {hud.mode === "title" && <TitleCard hud={hud} onPlay={() => game.current?.start()} />}
      {hud.mode === "result" && <ResultCard hud={hud} onRetry={() => game.current?.start()} />}

      {hud.mode === "playing" && (
        <button
          type="button"
          aria-label="Duck"
          className="absolute bottom-5 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full border border-cream/20 bg-ink/55 text-xs font-medium tracking-wide text-cream backdrop-blur-sm md:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            game.current?.slide();
          }}
        >
          Duck
        </button>
      )}
    </div>
  );
}

function PlayHud({ hud }: { hud: Hud }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4 md:px-6 md:pt-5">
      <div
        className="flex items-start justify-between gap-3"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <div className="min-w-0 rounded-lg border border-cream/15 bg-ink/50 px-3 py-2 backdrop-blur-sm">
          <p className="font-display text-3xl font-semibold leading-none tabular-nums tracking-tight text-cream md:text-4xl">
            {hud.speedMph.toFixed(0)}
            <span className="ml-1 font-sans text-xs font-medium tracking-widest text-cream-dim">
              MPH
            </span>
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-cream-dim">
            Best {Math.max(hud.topMph, hud.bestMph).toFixed(0)}
          </p>
        </div>
        <div className="rounded-lg border border-cream/15 bg-ink/50 px-3 py-2 text-right backdrop-blur-sm">
          <p className="font-display text-xl font-semibold tabular-nums text-cream">
            {hud.distanceM.toFixed(0)}
            <span className="ml-1 font-sans text-xs font-medium tracking-widest text-cream-dim">
              M
            </span>
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-cream-dim">
            Prey {hud.prey}
            {hud.streak >= 2 ? (
              <span className="ml-1.5 text-cream">
                {hud.streak}x
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/40">
        <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(hud.heat * 100)}%` }} />
      </div>
    </div>
  );
}

function TitleCard({ hud, onPlay }: { hud: Hud; onPlay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center bg-ink/25 px-4 pb-10 pt-16 md:items-center md:pb-0">
      <div className="w-full max-w-md rounded-xl border border-cream/15 bg-ink/75 px-6 py-7 backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Savanna sprint</p>
        <h1 className="font-display mt-2 text-4xl font-semibold leading-none tracking-tight text-cream md:text-5xl">
          Cheetah Speed
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-dim">
          You are the fastest land animal. Burst, jump the mounds, duck the thorn, run down gazelle.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-cream/10 bg-ink-2/80 px-3 py-2">
            <dt className="text-xs uppercase tracking-widest text-cream-dim">Personal best</dt>
            <dd className="font-display mt-0.5 text-2xl tabular-nums text-cream">
              {hud.bestMph.toFixed(0)}
              <span className="ml-1 font-sans text-xs tracking-widest text-cream-dim">MPH</span>
            </dd>
          </div>
          <div className="rounded-md border border-cream/10 bg-ink-2/80 px-3 py-2">
            <dt className="text-xs uppercase tracking-widest text-cream-dim">Longest run</dt>
            <dd className="font-display mt-0.5 text-2xl tabular-nums text-cream">
              {hud.bestDistanceM.toFixed(0)}
              <span className="ml-1 font-sans text-xs tracking-widest text-cream-dim">M</span>
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onPlay}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-cream text-sm font-semibold tracking-wide text-ink transition-transform duration-[var(--motion-quick)] hover:bg-cream-dim active:scale-[0.98]"
        >
          Play
        </button>
        <p className="mt-3 text-center text-xs leading-relaxed text-cream-dim">
          Auto-run · Jump W / Space / tap · Duck S / swipe down
        </p>
      </div>
    </div>
  );
}

function ResultCard({ hud, onRetry }: { hud: Hud; onRetry: () => void }) {
  const record = hud.topMph >= hud.bestMph - 0.05 && hud.topMph > 0;
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center bg-ink/40 px-4 pb-10 pt-16 md:items-center md:pb-0">
      <div className="w-full max-w-md rounded-xl border border-cream/15 bg-ink/80 px-6 py-7 backdrop-blur-md">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">
          {record ? "New top speed" : "Run over"}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-cream">
          {hud.topMph.toFixed(0)} mph
        </h2>
        <p className="mt-2 text-sm text-cream-dim">
          {hud.distanceM.toFixed(0)} m · {hud.prey} prey
        </p>
        <p className="mt-1 text-xs text-cream-dim">
          Best {hud.bestMph.toFixed(0)} mph · {hud.bestDistanceM.toFixed(0)} m
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-cream text-sm font-semibold tracking-wide text-ink transition-transform duration-[var(--motion-quick)] hover:bg-cream-dim active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
