import type { copy } from '../i18n/copy';

/** data-model.md `CriterionCard`: identity, whether it is built, and when it arrives. */
export type CriterionCard = {
  id: 'topic' | 'duration' | 'arc' | 'hook' | 'own';
  built: boolean;
  roadmap: string | null;
};

/** The five criteria, in the order the spec fixes (FR-002). Only topic is built in 007. */
export const CRITERIA: CriterionCard[] = [
  { id: 'topic', built: true, roadmap: null },
  { id: 'duration', built: false, roadmap: '009' },
  { id: 'arc', built: false, roadmap: '010' },
  { id: 'hook', built: false, roadmap: '011' },
  { id: 'own', built: false, roadmap: '012' },
];

type Props = {
  t: (typeof copy)['tr'];
  selected: CriterionCard['id'];
};

/**
 * The criteria as cards (FR-002, FR-003). A built card is a control showing
 * it is selected. An unbuilt card is text and nothing else: no handler, no
 * focus, no hover (FR-021, constitution VIII), with the roadmap slice that
 * builds it.
 */
export default function CriterionCards({ t, selected }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {CRITERIA.map((card) => {
        const text = t.criteria[card.id];
        if (!card.built) {
          return (
            <div
              key={card.id}
              title={card.roadmap ? t.notYetTitle(card.roadmap) : undefined}
              className="flex min-h-[112px] flex-col gap-1 rounded-[8px] border border-dashed border-edge p-3"
            >
              <span className="text-[16px] font-semibold text-muted">{text.name}</span>
              <span className="text-[13.5px] leading-snug text-muted">{text.line}</span>
              <span className="mt-auto flex justify-between text-[12.5px] text-muted">
                <span>{t.notYet}</span>
                <span className="font-mono">{card.roadmap}</span>
              </span>
            </div>
          );
        }
        const on = card.id === selected;
        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={on}
            className={`flex min-h-[112px] flex-col gap-1 rounded-[8px] p-3 text-left ${
              on ? 'border-2 border-accent bg-accent-dim' : 'border border-edge bg-surface hover:bg-surface-2'
            }`}
          >
            <span className="text-[16px] font-bold">{text.name}</span>
            <span className="text-[13.5px] leading-snug text-muted">{text.line}</span>
          </button>
        );
      })}
    </div>
  );
}
