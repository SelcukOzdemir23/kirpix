import { useState } from 'react';
import { api, type Candidate, type Cue } from '../api';
import { timecode } from '../format';
import type { copy, Lang } from '../i18n/copy';

const PAD_MS = 500;

type Props = {
  candidate: Candidate;
  bounds: { startMs: number; endMs: number };
  lang: Lang;
  t: (typeof copy)['tr'];
  onBounds: (startMs: number, endMs: number) => void;
  onReset: () => void;
  onReject: () => void;
};

export default function CandidateCard({ candidate, bounds, lang, t, onBounds, onReset, onReject }: Props) {
  const [open, setOpen] = useState(false);
  const [cues, setCues] = useState<Cue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureCues(): Promise<Cue[]> {
    if (cues) return cues;
    setLoading(true);
    try {
      // One cue beyond each edge, so the boundary buttons have somewhere to go.
      const loaded = await api.sessionCues(
        Math.max(1, candidate.startCue - 1),
        candidate.endCue + 1,
      );
      setCues(loaded);
      return loaded;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function toggleLines() {
    if (!open) await ensureCues();
    setOpen(!open);
  }

  function shiftSecond(edge: 'start' | 'end', delta: number) {
    const next =
      edge === 'start'
        ? { startMs: bounds.startMs + delta, endMs: bounds.endMs }
        : { startMs: bounds.startMs, endMs: bounds.endMs + delta };
    apply(next.startMs, next.endMs);
  }

  async function shiftCue(edge: 'start' | 'end', direction: -1 | 1) {
    const loaded = await ensureCues();
    if (loaded.length === 0) return;

    const times = loaded.map((cue) => ({
      start: Math.max(0, cue.startMs - PAD_MS),
      end: cue.endMs + PAD_MS,
    }));

    if (edge === 'start') {
      const options = times.map((time) => time.start).filter((value) =>
        direction === 1 ? value > bounds.startMs : value < bounds.startMs,
      );
      if (options.length === 0) return;
      const next = direction === 1 ? Math.min(...options) : Math.max(...options);
      apply(next, bounds.endMs);
    } else {
      const options = times.map((time) => time.end).filter((value) =>
        direction === 1 ? value > bounds.endMs : value < bounds.endMs,
      );
      if (options.length === 0) return;
      const next = direction === 1 ? Math.min(...options) : Math.max(...options);
      apply(bounds.startMs, next);
    }
  }

  function apply(startMs: number, endMs: number) {
    const safeStart = Math.max(0, Math.min(startMs, endMs - 1000));
    const safeEnd = Math.max(safeStart + 1000, endMs);
    onBounds(safeStart, safeEnd);
  }

  const moved = bounds.startMs !== candidate.startMs || bounds.endMs !== candidate.endMs;
  const duration = bounds.endMs - bounds.startMs;

  return (
    <li className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="font-mono text-[13px] tabular-nums text-accent">
          {timecode(bounds.startMs)} → {timecode(bounds.endMs)}
        </span>
        <span className="font-mono text-[12px] tabular-nums text-muted">{timecode(duration)}</span>
        {candidate.clamped && (
          <span className="rounded border border-line px-2 py-0.5 text-[11px] text-muted">
            {t.clamped}
          </span>
        )}
        <button
          type="button"
          onClick={onReject}
          className="ml-auto rounded px-2 py-1 text-[12.5px] text-muted transition-colors hover:bg-surface/80 hover:text-text"
        >
          {t.reject}
        </button>
      </div>

      <p className="px-4 pb-3 text-[13.5px] leading-relaxed text-muted">
        {t.matchedTerms(candidate.matchedTerms)}
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={toggleLines}
          className="rounded px-2 py-1 text-[12.5px] text-text/80 transition-colors hover:bg-surface/80"
        >
          {open ? t.hideLines : t.showLines}
        </button>

        {moved && (
          <button
            type="button"
            onClick={onReset}
            className="rounded px-2 py-1 text-[12.5px] text-muted transition-colors hover:bg-surface/80 hover:text-text"
          >
            {t.reset}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-line px-4 py-3">
          {loading && <p className="text-[12.5px] text-muted">…</p>}
          {error && <p className="text-[12.5px] text-red-300">{error}</p>}

          <Edge
            label={t.startLabel}
            t={t}
            onSecond={(delta) => shiftSecond('start', delta)}
            onCue={(direction) => shiftCue('start', direction)}
          />

          <ol className="mt-2 mb-3 space-y-1.5">
            {(cues ?? [])
              .filter((cue) => cue.index >= candidate.startCue && cue.index <= candidate.endCue)
              .map((cue) => (
                <li key={cue.index} className="grid grid-cols-[auto_1fr] gap-x-3">
                  <span className="font-mono text-[11px] leading-5 text-muted/80 tabular-nums">
                    {timecode(cue.startMs)}
                  </span>
                  <span className="text-[13px] leading-5 text-text/85" lang={lang}>
                    {cue.text}
                  </span>
                </li>
              ))}
          </ol>

          <Edge
            label={t.endLabel}
            t={t}
            onSecond={(delta) => shiftSecond('end', delta)}
            onCue={(direction) => shiftCue('end', direction)}
          />
        </div>
      )}
    </li>
  );
}

function Edge({
  label,
  t,
  onSecond,
  onCue,
}: {
  label: string;
  t: (typeof copy)['tr'];
  onSecond: (delta: number) => void;
  onCue: (direction: -1 | 1) => void;
}) {
  const button =
    'rounded border border-line px-2 py-0.5 font-mono text-[11.5px] text-muted tabular-nums transition-colors hover:border-white/25 hover:text-text active:translate-y-px';
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-16 text-[12px] text-muted">{label}</span>
      <button type="button" className={button} onClick={() => onSecond(-1000)}>
        {t.secondBack}
      </button>
      <button type="button" className={button} onClick={() => onSecond(1000)}>
        {t.secondForward}
      </button>
      <button type="button" className={button} onClick={() => onCue(-1)}>
        {t.cueBack}
      </button>
      <button type="button" className={button} onClick={() => onCue(1)}>
        {t.cueForward}
      </button>
    </div>
  );
}
