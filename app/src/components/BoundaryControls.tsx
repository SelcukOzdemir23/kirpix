import { timecode } from '../format';
import type { copy } from '../i18n/copy';
import type { Edge, Step } from '../state/edges';
import type { Bounds } from '../state/useSearch';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  edges: Bounds;
  /** True when the edges differ from the search's; the reset appears only then. */
  moved: boolean;
  step: Step;
  onStep: (step: Step) => void;
  onMove: (edge: Edge, direction: -1 | 1) => void;
  onReset: () => void;
};

/** Tenths make a one-second move visible in the readout. */
function precise(ms: number): string {
  return `${timecode(Math.floor(ms / 1000) * 1000)},${Math.floor((ms % 1000) / 100)}`;
}

/**
 * Moving the edges (001 FR-015, FR-025): one step choice shared by both
 * edges, a second or a line, and a minus and a plus per edge. Four buttons
 * where there were eight. The reset appears only after an edge has moved.
 */
export default function BoundaryControls({ t, edges, moved, step, onStep, onMove, onReset }: Props) {
  const row = (edge: Edge, label: string, ms: number) => (
    <>
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{precise(ms)}</span>
      <span className="flex gap-1.5">
        <Button className="w-[34px] !px-0 text-[17px]" aria-label={`${label} ${t.earlier}`} onClick={() => onMove(edge, -1)}>
          −
        </Button>
        <Button className="w-[34px] !px-0 text-[17px]" aria-label={`${label} ${t.later}`} onClick={() => onMove(edge, 1)}>
          +
        </Button>
      </span>
    </>
  );

  return (
    <div className="flex items-center gap-4">
      <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-1.5 text-[14px]">
        {row('start', t.startLabel, edges.startMs)}
        {row('end', t.endLabel, edges.endMs)}
      </div>
      <div className="ml-auto flex flex-col items-end gap-1.5">
        <span role="group" aria-label={t.stepLabel} className="inline-flex overflow-hidden rounded-[6px] border border-edge">
          {(['second', 'line'] as Step[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={step === option}
              onClick={() => onStep(option)}
              className={`px-2.5 py-1 text-[13.5px] not-first:border-l not-first:border-edge ${
                step === option ? 'bg-text font-semibold text-surface' : 'bg-surface hover:bg-surface-2'
              }`}
            >
              {option === 'second' ? t.stepSecond : t.stepLine}
            </button>
          ))}
        </span>
        {moved && (
          <Button kind="quiet" onClick={onReset}>
            {t.resetEdges}
          </Button>
        )}
      </div>
    </div>
  );
}
