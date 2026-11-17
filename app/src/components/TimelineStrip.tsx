import type { Candidate } from '../api';
import { timecode } from '../format';
import type { copy } from '../i18n/copy';

export type Bounds = { startMs: number; endMs: number };

type Props = {
  t: (typeof copy)['tr'];
  durationMs: number;
  candidates: Candidate[];
  bounds: Record<number, Bounds>;
  rejected: number[];
  activeId: number | null;
  onActive: (id: number | null) => void;
};

/**
 * The whole recording as one hairline ruler, with every candidate clip marked
 * where it actually sits. Positions come from the session duration and the
 * candidate times, so the strip is a second view of the same numbers the list
 * shows, not an illustration.
 *
 * Ruler ticks are every ten percent, so a mark can be read as a rough position
 * without hovering it.
 */
export default function TimelineStrip({
  t,
  durationMs,
  candidates,
  bounds,
  rejected,
  activeId,
  onActive,
}: Props) {
  const total = Math.max(1, durationMs);
  const at = (ms: number) => Math.min(100, Math.max(0, (ms / total) * 100));

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-4 px-5 pb-2">
        <span className="font-mono text-[12px] tracking-[0.13em] text-muted uppercase">
          {t.timeline}
        </span>
        <span className="font-mono text-[13px] tabular-nums text-muted">
          {timecode(0)} — {timecode(total)}
        </span>
      </div>

      <div
        role="group"
        aria-label={t.timelineLabel(candidates.length)}
        className="relative h-[60px] w-full border-y border-line bg-surface/50"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex h-[38px] justify-between"
        >
          {Array.from({ length: 11 }, (_, tick) => (
            <span key={tick} className="w-px bg-text/[0.05]" />
          ))}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[5px] flex justify-between px-1 font-mono text-[12px] tabular-nums text-muted/75"
        >
          {[0, 1, 2, 3, 4].map((quarter) => (
            <span key={quarter}>{timecode((total * quarter) / 4)}</span>
          ))}
        </div>

        <div aria-hidden className="absolute inset-x-0 top-[21px] h-px bg-text/[0.08]" />

        {candidates.map((candidate) => {
          const current = bounds[candidate.id] ?? candidate;
          const removed = rejected.includes(candidate.id);
          const active = activeId === candidate.id;
          const moved =
            current.startMs !== candidate.startMs || current.endMs !== candidate.endMs;
          const left = at(current.startMs);
          const width = Math.max(0.5, at(current.endMs) - left);

          return (
            <span key={candidate.id}>
              {moved && (
                <>
                  <span
                    aria-hidden
                    className="absolute top-[9px] h-[26px] w-px bg-accent/35"
                    style={{ left: `${at(candidate.startMs)}%` }}
                  />
                  <span
                    aria-hidden
                    className="absolute top-[9px] h-[26px] w-px bg-accent/35"
                    style={{ left: `${at(candidate.endMs)}%` }}
                  />
                </>
              )}

              {/* A mark, not a control: hovering it pairs the mark with its row. */}
              <span
                onMouseEnter={() => onActive(candidate.id)}
                onMouseLeave={() => onActive(null)}
                title={`${timecode(current.startMs)} – ${timecode(current.endMs)}${
                  removed ? ` · ${t.removed}` : ''
                }`}
                className={`absolute top-[12px] h-[18px] rounded-[3px] transition-colors ${
                  removed
                    ? 'bg-text/[0.09] hover:bg-text/[0.16]'
                    : active
                      ? 'bg-accent/75 ring-1 ring-accent'
                      : 'bg-accent/30 hover:bg-accent/50'
                }`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
