import type { SessionInfo } from '../api';
import type { copy } from '../i18n/copy';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  session: SessionInfo;
  offsetMs: number;
  clampedCues: number;
  /** True when clips are on screen, which a shift would clear. */
  hasResults: boolean;
  onChange: (offsetMs: number) => void;
  onClose: () => void;
};

/** Back on the left, forward on the right, like the ruler. */
const STEPS = [-1000, -500, -100, 100, 500, 1000];

/**
 * Subtitle timing (FR-011): the shift of feature 002, unchanged in behaviour,
 * opened from the top bar instead of living in a rail. It also names how many
 * lines the subtitles have and where they came from, which left the top line.
 */
export default function AlignmentPanel({ t, session, offsetMs, clampedCues, hasResults, onChange, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-label={t.alignment}
      className="absolute top-[60px] right-4 z-20 flex w-[360px] flex-col gap-3 rounded-[8px] border border-edge bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[16px] font-bold">{t.alignment}</h2>
        <Button kind="quiet" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <p className="text-[14px] text-muted">
        {t.alignmentSource(
          session.cueCount,
          session.subtitleSource === 'embedded' ? t.sourceEmbedded : t.sourceFile,
        )}
      </p>
      <p className="text-[14px] leading-snug">{t.offsetHint}</p>

      <div className="flex items-baseline justify-between">
        <span className="text-muted">{t.offset}</span>
        <span className="font-mono text-[17px] font-semibold tabular-nums">{t.offsetValue(offsetMs)}</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {STEPS.map((step) => (
          <Button key={step} className="!px-0 font-mono text-[13px]" onClick={() => onChange(offsetMs + step)}>
            {t.offsetStepShort(step)}
          </Button>
        ))}
      </div>
      {offsetMs !== 0 && (
        <Button kind="quiet" className="self-end" onClick={() => onChange(0)}>
          {t.offsetReset}
        </Button>
      )}
      {clampedCues > 0 && <p className="text-[13.5px] text-muted">{t.clampedCues(clampedCues)}</p>}
      {hasResults && <p className="text-[13.5px] text-muted">{t.alignmentClears}</p>}
    </div>
  );
}
