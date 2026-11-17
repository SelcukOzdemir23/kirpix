import { useState } from 'react';
import { api, type Candidate, type Cue } from '../api';
import { timecode } from '../format';
import type { copy, Lang } from '../i18n/copy';

const PAD_MS = 500;

type Props = {
  candidate: Candidate;
  bounds: { startMs: number; endMs: number };
  active: boolean;
  lang: Lang;
  t: (typeof copy)['tr'];
  onBounds: (startMs: number, endMs: number) => void;
  onReset: () => void;
  onReject: () => void;
  onPlayCue: (cueIndex: number) => void;
  onActive: (id: number | null) => void;
};

export default function CandidateCard({
  candidate,
  bounds,
  active,
  lang,
  t,
  onBounds,
  onReset,
  onReject,
  onPlayCue,
  onActive,
}: Props) {
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
    <li
      onMouseEnter={() => onActive(candidate.id)}
      onMouseLeave={() => onActive(null)}
      className={`rounded-[6px] border transition-colors ${
        active ? 'border-accent/35 bg-surface-2' : 'border-line bg-surface/50'
      }`}
    >
      <div className="flex items-start gap-3 px-3.5 pt-2.5 pb-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2.5">
            {/* In and out points, bracketed like an edit decision list. */}
            <span className="font-mono text-[13px] tabular-nums whitespace-nowrap">
              <span className="text-accent">[</span>
              <span>{timecode(bounds.startMs)}</span>
              <span className="text-muted/60"> → </span>
              <span>{timecode(bounds.endMs)}</span>
              <span className="text-accent">]</span>
            </span>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {timecode(duration)}
            </span>
            {candidate.clamped && (
              <span className="rounded-[3px] border border-line px-1.5 text-[10.5px] text-muted">
                {t.clamped}
              </span>
            )}
          </div>

          <p className="text-[12.5px] leading-relaxed text-muted">
            {t.matchedTerms(candidate.matchedTerms)}
            <span className="text-muted/50"> · </span>
            <span className="text-muted/80">{t.matchedLines(candidate.matchedCueCount)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {moved && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-[4px] px-2 py-1 text-[11.5px] text-accent/80 transition-colors hover:bg-white/[0.06] hover:text-accent"
            >
              {t.reset}
            </button>
          )}
          <button
            type="button"
            onClick={toggleLines}
            className="rounded-[4px] px-2 py-1 text-[11.5px] text-text/75 transition-colors hover:bg-white/[0.06] hover:text-text"
          >
            {open ? t.hideLines : t.showLines}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-[4px] px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
          >
            {t.reject}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-3.5 py-2.5">
          {loading && <p className="text-[12px] text-muted">…</p>}
          {error && <p className="text-[12px] text-red-300">{error}</p>}

          <Edge
            label={t.startLabel}
            t={t}
            onSecond={(delta) => shiftSecond('start', delta)}
            onCue={(direction) => shiftCue('start', direction)}
          />

          <ol className="my-1.5 space-y-1">
            {(cues ?? [])
              .filter((cue) => cue.index >= candidate.startCue && cue.index <= candidate.endCue)
              .map((cue) => (
                <li key={cue.index} className="grid grid-cols-[52px_1fr_auto] items-baseline gap-x-3">
                  <span className="font-mono text-[10.5px] leading-5 text-muted/70 tabular-nums">
                    {timecode(cue.startMs)}
                  </span>
                  <span className="text-[12.5px] leading-5 text-text/85" lang={lang}>
                    {cue.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayCue(cue.index)}
                    title={t.listen}
                    className="rounded-[3px] px-1.5 text-[10.5px] text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                  >
                    {t.listen}
                  </button>
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
    'rounded-[4px] border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-muted tabular-nums transition-colors hover:border-white/25 hover:text-text active:translate-y-px';
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-14 shrink-0 font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">
        {label}
      </span>
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
