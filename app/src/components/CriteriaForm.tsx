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

  const field =
    'w-full rounded-[6px] border border-line bg-ink px-3 py-2 text-[15px] text-text outline-none transition-colors placeholder:text-muted/50 hover:border-text/20 focus:border-accent/60';

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSearch();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted">{t.terms}</span>
        <input
          value={terms}
          onChange={(event) => onTerms(event.target.value)}
          placeholder={t.termsExample}
          className={field}
        />
      </label>
      <span className="-mt-1.5 text-[13px] text-muted/80">{t.termsHint}</span>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">{t.min}</span>
          <input
            type="number"
            min={1}
            value={minSec}
            onChange={(event) => onMin(Number(event.target.value))}
            className={`${field} font-mono tabular-nums`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">{t.max}</span>
          <input
            type="number"
            min={1}
            value={maxSec}
            onChange={(event) => onMax(Number(event.target.value))}
            className={`${field} font-mono tabular-nums`}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-[6px] bg-text px-3 py-2.5 text-[15px] font-medium text-ink transition-transform active:translate-y-px disabled:opacity-35 disabled:active:translate-y-0"
      >
        {searching ? t.searching : t.search}
      </button>
    </form>
  );
}
