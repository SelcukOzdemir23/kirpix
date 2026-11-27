import { useEffect, useRef, type ReactNode } from 'react';
import type { Candidate } from '../api';
import { timecode } from '../format';
import type { copy } from '../i18n/copy';
import { edgesOf, type Bounds } from '../state/useSearch';

type Props = {
  t: (typeof copy)['tr'];
  /** Every candidate, in the order shown (the model's when it ranked). */
  candidates: Candidate[];
  bounds: Record<number, Bounds>;
  /** Candidates the user unticked: shown, not cut. */
  dropped: number[];
  selectedId: number | null;
  /** The model's sentence per candidate, when a model ranked them (004). */
  reasons: Record<number, string> | null;
  /** Which engine produced this list (article III). */
  badge: string;
  onSelect: (id: number) => void;
  onToggleKeep: (id: number) => void;
  /** The cut action and its folder, pinned under the list. */
  footer: ReactNode;
};

/**
 * The candidates (FR-006, FR-009). A row selects; its box decides whether the
 * clip is cut. The selected row carries a bar and a tint, so it reads without
 * colour, and scrolls into view when a ruler mark selects it (FR-023).
 */
export default function CandidateList(props: Props) {
  const { t, candidates, selectedId } = props;
  const rows = useRef(new Map<number, HTMLLIElement>());

  useEffect(() => {
    if (selectedId != null) rows.current.get(selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section className="flex min-h-0 flex-col border-r border-line bg-surface">
      <h2 className="flex shrink-0 items-baseline justify-between gap-3 px-4 pt-2.5 pb-2 text-[14px] font-semibold text-muted">
        <span>{t.clipsFound(candidates.length)}</span>
        <span className="font-normal">{props.badge}</span>
      </h2>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {candidates.map((candidate) => {
          const edges = edgesOf(candidate, props.bounds);
          const kept = !props.dropped.includes(candidate.id);
          const selected = candidate.id === selectedId;
          const reason = props.reasons?.[candidate.id];
          return (
            <li
              key={candidate.id}
              ref={(node) => {
                if (node) rows.current.set(candidate.id, node);
                else rows.current.delete(candidate.id);
              }}
              className={`flex items-start gap-3 border-b border-l-[3px] border-b-line py-2.5 pr-4 pl-3 ${
                selected ? 'border-l-accent bg-accent-dim' : 'border-l-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={kept}
                onChange={() => props.onToggleKeep(candidate.id)}
                aria-label={t.keep}
                className="mt-1 size-[17px] shrink-0 accent-text"
              />
              <button
                type="button"
                onClick={() => props.onSelect(candidate.id)}
                aria-current={selected}
                className={`flex min-w-0 flex-1 flex-col gap-1 text-left ${kept ? '' : 'opacity-60'}`}
              >
                <span className="flex items-baseline justify-between gap-3 font-mono tabular-nums">
                  <span className="text-[15.5px]">
                    {timecode(edges.startMs)} – {timecode(edges.endMs)}
                  </span>
                  <span className="text-[14px] text-muted">{timecode(edges.endMs - edges.startMs)}</span>
                </span>
                {reason && <span className="text-[14.5px] leading-snug">{reason}</span>}
                <span className="text-[14px] leading-snug text-muted">
                  {t.reasonLine(candidate.matchedTerms, candidate.matchedCueCount)}
                  {candidate.clamped && `, ${t.clamped.toLowerCase()}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 border-t border-line">{props.footer}</div>
    </section>
  );
}
