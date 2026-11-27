import type { ReactNode } from 'react';
import type { copy } from '../i18n/copy';

type Props = {
  t: (typeof copy)['tr'];
  terms: string;
  minSec: number;
  maxSec: number;
  onTerms: (value: string) => void;
  onMin: (value: number) => void;
  onMax: (value: number) => void;
  /** Runs the search; Enter in any field submits. */
  onSubmit: () => void;
  /** The primary action, placed at the end of the row. */
  action: ReactNode;
};

const FIELD =
  'rounded-[6px] border border-edge bg-surface px-2.5 py-1.5 text-[15px] text-text ' +
  'focus-visible:border-accent';

/** The topic criterion's inputs (FR-004): the words, and the clip length bounds of 001. */
export default function TopicInputs(props: Props) {
  const { t } = props;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
      className="flex flex-wrap items-end gap-4 rounded-[8px] border border-line bg-surface p-3.5"
    >
      <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-[13.5px] text-muted">
        {t.termsLabel}
        <input
          value={props.terms}
          onChange={(event) => props.onTerms(event.target.value)}
          placeholder={t.termsExample}
          className={FIELD}
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-1 text-[13.5px] text-muted">
        {t.shortest}
        <span className="flex items-baseline gap-1.5">
          <input
            type="number"
            min={1}
            value={props.minSec}
            onChange={(event) => props.onMin(Number(event.target.value))}
            className={`${FIELD} w-[76px] font-mono`}
          />
          {t.seconds}
        </span>
      </label>
      <label className="flex flex-col gap-1 text-[13.5px] text-muted">
        {t.longest}
        <span className="flex items-baseline gap-1.5">
          <input
            type="number"
            min={1}
            value={props.maxSec}
            onChange={(event) => props.onMax(Number(event.target.value))}
            className={`${FIELD} w-[76px] font-mono`}
          />
          {t.seconds}
        </span>
      </label>
      <span className="ml-auto">{props.action}</span>
    </form>
  );
}
