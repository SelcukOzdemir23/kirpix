import type { copy } from '../i18n/copy';

type Props = {
  t: (typeof copy)['tr'];
  offsetMs: number;
  clampedCues: number;
  onChange: (offsetMs: number) => void;
};

const STEPS = [-1000, -500, -100, 100, 500, 1000];

export default function OffsetControls({ t, offsetMs, clampedCues, onChange }: Props) {
  const button =
    'rounded border border-line px-2 py-0.5 font-mono text-[11.5px] tabular-nums text-muted transition-colors hover:border-white/25 hover:text-text active:translate-y-px';

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-muted">{t.offset}</span>

        {STEPS.filter((step) => step < 0).map((step) => (
          <button key={step} type="button" className={button} onClick={() => onChange(offsetMs + step)}>
            {t.offsetStep(step)}
          </button>
        ))}

        <span className="font-mono text-[12.5px] tabular-nums text-accent">{t.offsetValue(offsetMs)}</span>

        {STEPS.filter((step) => step > 0).map((step) => (
          <button key={step} type="button" className={button} onClick={() => onChange(offsetMs + step)}>
            {t.offsetStep(step)}
          </button>
        ))}

        {offsetMs !== 0 && (
          <button type="button" className={button} onClick={() => onChange(0)}>
            {t.offsetReset}
          </button>
        )}
      </div>

      {clampedCues > 0 && (
        <p className="text-[11.5px] text-muted">{t.clampedCues(clampedCues)}</p>
      )}
    </div>
  );
}
