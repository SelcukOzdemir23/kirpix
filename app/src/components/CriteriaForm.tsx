import type { copy } from '../i18n/copy';

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

export default function CriteriaForm({ t, terms, minSec, maxSec, searching, onTerms, onMin, onMax, onSearch }: Props) {
  const parsed = terms
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
  const disabled = parsed.length === 0 || searching;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSearch();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] text-muted">{t.terms}</span>
        <input
          value={terms}
          onChange={(event) => onTerms(event.target.value)}
          placeholder="kaygı, endişe"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60"
        />
        <span className="text-[11.5px] text-muted/80">{t.termsHint}</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-muted">{t.min}</span>
          <input
            type="number"
            min={1}
            value={minSec}
            onChange={(event) => onMin(Number(event.target.value))}
            className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13.5px] tabular-nums text-text outline-none focus:border-accent/60"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-muted">{t.max}</span>
          <input
            type="number"
            min={1}
            value={maxSec}
            onChange={(event) => onMax(Number(event.target.value))}
            className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13.5px] tabular-nums text-text outline-none focus:border-accent/60"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-1 rounded-lg bg-text px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-40 active:translate-y-px"
      >
        {searching ? t.searching : t.search}
      </button>
    </form>
  );
}
