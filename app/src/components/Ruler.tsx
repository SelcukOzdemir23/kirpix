import type { Candidate } from '../api';
import { timecode } from '../format';
import type { copy } from '../i18n/copy';
import { edgesOf, type Bounds } from '../state/useSearch';

type Props = {
  t: (typeof copy)['tr'];
  durationMs: number;
  candidates: Candidate[];
  bounds: Record<number, Bounds>;
  dropped: number[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

const QUARTERS = [0, 0.25, 0.5, 0.75, 1];

/**
 * The whole recording, with every candidate where it actually sits (003
 * FR-005, FR-006). Each mark is a button: pressing it, or reaching it with Tab
 * and pressing Enter, selects that candidate (FR-023). Kept marks are filled
 * with the marker colour, dropped ones are dashed outlines, the selected one
 * is ringed. A moved candidate keeps its original edges as thin lines (003
 * FR-007). The ruler never moves the player.
 */
export default function Ruler({ t, durationMs, candidates, bounds, dropped, selectedId, onSelect }: Props) {
  const total = Math.max(1, durationMs);
  const at = (ms: number) => Math.min(100, Math.max(0, (ms / total) * 100));

  return (
    <div className="shrink-0 border-t border-line bg-surface px-4 pt-2 pb-2.5" aria-label={t.rulerLabel}>
      <div className="relative h-[24px] rounded-[4px] border border-line bg-ink">
        {candidates.map((candidate) => {
          const edges = edgesOf(candidate, bounds);
          const moved = edges.startMs !== candidate.startMs || edges.endMs !== candidate.endMs;
          const kept = !dropped.includes(candidate.id);
          const selected = candidate.id === selectedId;
          return (
            <span key={candidate.id}>
              {moved && (
                <>
                  <span
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px bg-muted"
                    style={{ left: `${at(candidate.startMs)}%` }}
                  />
                  <span
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px bg-muted"
                    style={{ left: `${at(candidate.endMs)}%` }}
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => onSelect(candidate.id)}
                aria-pressed={selected}
                aria-label={t.markLabel(timecode(edges.startMs), timecode(edges.endMs))}
                className={`absolute top-[3px] bottom-[3px] min-w-[6px] rounded-[2px] border ${
                  kept ? 'border-edge bg-marker' : 'border-dashed border-edge bg-transparent'
                } ${selected ? 'outline-2 outline-offset-1 outline-accent' : ''}`}
                style={{
                  left: `${at(edges.startMs)}%`,
                  width: `${Math.max(0.6, at(edges.endMs) - at(edges.startMs))}%`,
                }}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[12px] text-muted tabular-nums">
        {QUARTERS.map((fraction) => (
          <span key={fraction}>{timecode(durationMs * fraction)}</span>
        ))}
      </div>
    </div>
  );
}
