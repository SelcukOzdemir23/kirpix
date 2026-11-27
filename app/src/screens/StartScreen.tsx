import type { copy } from '../i18n/copy';
import Button from '../components/Button';

type Props = {
  t: (typeof copy)['tr'];
  /** True only when the window really receives drops (003 FR-009). */
  dropReady: boolean;
  busy: boolean;
  onPick: () => void;
};

/**
 * No recording is open (FR-001): one sentence on what Kirpix does, and one
 * action. The criterion cards wait until there is something to search.
 */
export default function StartScreen({ t, dropReady, busy, onPick }: Props) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto px-6 py-10">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-6 text-center">
        <p className="text-[19px] leading-snug text-balance">{t.tagline}</p>
        <div className="flex w-full flex-col items-center gap-4 rounded-[10px] border-2 border-dashed border-edge bg-surface px-6 py-10">
          {dropReady && <p className="text-[16px] text-muted">{t.dropHere}</p>}
          <Button kind="primary" onClick={onPick} disabled={busy}>
            {busy ? t.opening : t.pick}
          </Button>
        </div>
      </div>
    </div>
  );
}
