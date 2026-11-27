import type { copy } from '../i18n/copy';
import { parseTerms } from '../state/useSearch';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  terms: string;
  minSec: number;
  maxSec: number;
  searching: boolean;
  onTerms: (value: string) => void;
  onMin: (value: number) => void;
  onMax: (value: number) => void;
  onSearch: () => void;
};

const NUMBER =
  'w-[58px] rounded-[6px] border border-edge bg-surface px-2 py-1 font-mono text-[14px] focus-visible:border-accent';

/**
 * The chosen criterion after a search, folded into one line (FR-005): its
 * name, the words and the length bounds, all editable in place. Searching
 * again replaces the results without going back to the cards.
 */
export default function CriterionBar(props: Props) {
  const { t, terms, minSec, maxSec, searching, onTerms, onSearch } = props;
  const empty = parseTerms(terms).length === 0;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!empty && !searching) onSearch();
      }}
      className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2"
    >
      <span className="shrink-0 rounded-r-[5px] border-l-[3px] border-accent bg-accent-dim px-2.5 py-1 font-semibold">
        {t.criteria.topic.name}
      </span>
      <input
        value={terms}
        onChange={(event) => onTerms(event.target.value)}
        aria-label={t.termsLabel}
        className="w-[200px] min-w-0 flex-1 rounded-[6px] border border-edge bg-surface px-2.5 py-1 text-[15px] focus-visible:border-accent"
      />
      <label className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted">
        {t.shortest}
        <input
          type="number"
          min={1}
          value={minSec}
          onChange={(event) => props.onMin(Number(event.target.value))}
          className={NUMBER}
        />
      </label>
      <label className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted">
        {t.longest}
        <input
          type="number"
          min={1}
          value={maxSec}
          onChange={(event) => props.onMax(Number(event.target.value))}
          className={NUMBER}
        />
        {t.seconds}
      </label>
      <span className="ml-auto shrink-0">
        <Button type="submit" disabled={empty || searching}>
          {searching ? t.searching : t.searchAgain}
        </Button>
      </span>
    </form>
  );
}
