import type { ReactNode } from 'react';

type Props = {
  /** The criterion bar (FR-005). */
  bar: ReactNode;
  /** The candidate list with its cut footer, or the no-match message. */
  list: ReactNode;
  /** The selected candidate, or nothing when no candidate matched. */
  detail: ReactNode;
  ruler: ReactNode;
  /** The written files after a cut (FR-024), between the work and the ruler. */
  strip?: ReactNode;
};

/**
 * The results state (FR-006): the bar above, the list beside the detail, the
 * ruler below both. Layout only; every part is rendered by the caller.
 */
export default function ResultsScreen({ bar, list, detail, ruler, strip }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {bar}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {detail ? (
          <>
            {list}
            {detail}
          </>
        ) : (
          <div className="col-span-2 flex min-h-0">{list}</div>
        )}
      </div>
      {strip}
      {ruler}
    </div>
  );
}
