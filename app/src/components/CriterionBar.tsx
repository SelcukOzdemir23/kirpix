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
  onSearch: () => void;
};

/**
 * The chosen criterion after a search, folded into one line (FR-005): its
 * name, the words, editable in place, and the bounds as text. Searching again
 * replaces the results without going back to the cards.
 */
export default function CriterionBar({ t, terms, minSec, maxSec, searching, onTerms, onSearch }: Props) {
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
        className="w-[240px] min-w-0 rounded-[6px] border border-edge bg-surface px-2.5 py-1 text-[15px] focus-visible:border-accent"
      />
      <span className="min-w-0 truncate text-muted">{t.boundsText(minSec, maxSec)}</span>
      <span className="ml-auto shrink-0">
        <Button type="submit" disabled={empty || searching}>
          {searching ? t.searching : t.searchAgain}
        </Button>
      </span>
    </form>
  );
}
