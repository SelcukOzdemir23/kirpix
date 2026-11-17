import { useState } from 'react';
import { api, type Candidate, type Cue } from '../api';
import { timecode } from '../format';
import type { copy, Lang } from '../i18n/copy';

const PAD_MS = 500;

type Props = {
  candidate: Candidate;
  bounds: { startMs: number; endMs: number };
  active: boolean;
  /** The model's sentence for this candidate, when a model ranked it. */
  reason: string | null;
  preview: { url: string; durationMs: number; truncated: boolean } | null;
  previewing: boolean;
  lang: Lang;
  t: (typeof copy)['tr'];
  onBounds: (startMs: number, endMs: number) => void;
  onReset: () => void;
  onReject: () => void;
  onPlayCue: (cueIndex: number) => void;
  onActive: (id: number | null) => void;
  onPreview: () => void;
};

export default function CandidateCard({
  candidate,
  bounds,
  active,
  reason,
  preview,
  previewing,
  lang,
  t,
  onBounds,
  onReset,
  onReject,
  onPlayCue,
  onActive,
  onPreview,
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
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline gap-3">
            {/* In and out points, bracketed like an edit decision list. */}
            <span className="font-mono text-[16px] tabular-nums whitespace-nowrap">
              <span className="text-accent">[</span>
              <span>{timecode(bounds.startMs)}</span>
              <span className="text-muted/60"> → </span>
              <span>{timecode(bounds.endMs)}</span>
              <span className="text-accent">]</span>
            </span>
            <span className="font-mono text-[14px] tabular-nums text-muted">
              {timecode(duration)}
            </span>
          </div>

          {reason && (
            <p className="text-[14.5px] leading-relaxed text-text/90">{reason}</p>
          )}

          <p className="text-[13.5px] leading-relaxed text-muted">
            {t.matchedTerms(candidate.matchedTerms)}
            <span className="text-muted/50"> · </span>
            <span className="text-muted/80">{t.matchedLines(candidate.matchedCueCount)}</span>
            {candidate.clamped && (
              <>
                <span className="text-muted/50"> · </span>
                <span className="text-muted/80">{t.clamped}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPreview}
            aria-pressed={preview !== null}
            className={`rounded-[5px] border px-2.5 py-1.5 text-[13.5px] transition-colors ${
              preview
                ? 'border-accent/40 text-accent hover:bg-accent/10'
                : 'border-line text-text/85 hover:border-text/25 hover:bg-surface-2'
            }`}
          >
            {previewing ? t.preparing : preview ? t.hide : t.show}
          </button>
          {moved && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-[5px] border border-accent/40 px-2.5 py-1.5 text-[13.5px] text-accent transition-colors hover:bg-accent/10"
            >
              {t.reset}
            </button>
          )}
          <button
            type="button"
            onClick={toggleLines}
            className="rounded-[5px] border border-line px-2.5 py-1.5 text-[13.5px] text-text/85 transition-colors hover:border-text/25 hover:bg-surface-2"
          >
            {open ? t.hideLines : t.showLines}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-[5px] border border-line px-2.5 py-1.5 text-[13.5px] text-muted transition-colors hover:border-text/25 hover:bg-surface-2 hover:text-text"
          >
            {t.reject}
          </button>
        </div>
      </div>

      {preview && (
        <div className="border-t border-line px-4 py-3">
          <video
            src={preview.url}
            controls
            autoPlay
            className="max-h-[320px] w-full rounded-[6px] bg-black"
          />
          {preview.truncated && (
            <p className="mt-2 text-[13px] text-muted">
              {t.firstSeconds(Math.round(preview.durationMs / 1000))}
            </p>
          )}
        </div>
      )}

      {open && (
        <div className="border-t border-line px-4 py-3">
          {loading && <p className="text-[14px] text-muted">…</p>}
          {error && <p className="text-[14px] text-danger">{error}</p>}

          <Edge
            label={t.startLabel}
            t={t}
            onSecond={(delta) => shiftSecond('start', delta)}
            onCue={(direction) => shiftCue('start', direction)}
          />

          <ol className="my-2 space-y-1.5">
            {(cues ?? [])
              .filter((cue) => cue.index >= candidate.startCue && cue.index <= candidate.endCue)
              .map((cue) => (
                <li key={cue.index} className="grid grid-cols-[54px_1fr_auto] items-baseline gap-x-3">
                  <span className="font-mono text-[12.5px] leading-6 text-muted/75 tabular-nums">
                    {timecode(cue.startMs)}
                  </span>
                  <span className="text-[15px] leading-6 text-text/90 selectable" lang={lang}>
                    {cue.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayCue(cue.index)}
                    title={t.listen}
                    className="rounded-[4px] border border-line px-2 text-[12.5px] text-muted transition-colors hover:border-text/25 hover:bg-surface-2 hover:text-text"
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
    'rounded-[5px] border border-line px-2 py-1 font-mono text-[12.5px] text-muted tabular-nums transition-colors hover:border-text/25 hover:text-text active:translate-y-px';
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-16 shrink-0 font-mono text-[12px] tracking-[0.1em] text-muted uppercase">
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
