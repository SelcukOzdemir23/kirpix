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
    'rounded-[5px] border border-line py-1.5 font-mono text-[12.5px] tabular-nums text-muted transition-colors hover:border-text/25 hover:text-text active:translate-y-px';

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[12px] tracking-[0.12em] text-muted uppercase">
          {t.offset}
        </span>
        <span className="font-mono text-[14.5px] tabular-nums text-accent">
          {t.offsetValue(offsetMs)}
        </span>
      </div>

      {/* Back on the left, forward on the right, like the ruler above. */}
      <div className="grid grid-cols-6 gap-1.5">
        {STEPS.map((step) => (
          <button key={step} type="button" className={button} onClick={() => onChange(offsetMs + step)}>
            {t.offsetStepShort(step)}
          </button>
        ))}
      </div>

      {offsetMs !== 0 && (
        <button
          type="button"
          className="self-end text-[13px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-text"
          onClick={() => onChange(0)}
        >
          {t.offsetReset}
        </button>
      )}

      <p className="text-[13px] leading-relaxed text-muted/80">{t.offsetHint}</p>

      {clampedCues > 0 && <p className="text-[13px] text-muted">{t.clampedCues(clampedCues)}</p>}
    </div>
  );
}
