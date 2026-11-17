import type { RequestPlan } from '../api';
import type { copy } from '../i18n/copy';

type Props = {
  t: (typeof copy)['tr'];
  plan: RequestPlan;
  onCancel: () => void;
  onSend: () => void;
};

/**
 * The last thing between the user's subtitle text and a provider.
 *
 * The numbers here came from the payload the application actually built, not
 * from anything the interface remembered, and the same numbers are compared
 * again before the request leaves.
 */
export default function ConfirmDialog({ t, plan, onCancel, onSend }: Props) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/45 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.confirmTitle}
        className="w-full max-w-[440px] rounded-[10px] border border-line bg-surface p-5"
      >
        <h2 className="text-[17px]">{t.confirmTitle}</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t.confirmBody}</p>

        <dl className="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 border-t border-line pt-3 text-[13.5px]">
          <dt className="text-muted">{t.modelName}</dt>
          <dd className="truncate font-mono text-text/90" title={plan.model}>
            {plan.model || '—'}
          </dd>
          <dt className="text-muted">{t.modelAddress}</dt>
          <dd className="truncate font-mono text-text/90" title={plan.address}>
            {plan.address}
          </dd>
          <dt className="text-muted">{t.confirmAmount}</dt>
          <dd className="font-mono text-text/90">
            {t.confirmLines(plan.cueCount, plan.charCount)}
          </dd>
        </dl>

        {(plan.leftOut > 0 || plan.shortened > 0) && (
          <div className="mt-2 flex flex-col gap-0.5 text-[12.5px] text-muted">
            {plan.leftOut > 0 && <span>{t.confirmLeftOut(plan.leftOut)}</span>}
            {plan.shortened > 0 && <span>{t.confirmShortened(plan.shortened)}</span>}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[6px] border border-line px-3 py-1.5 text-[13.5px] text-text/90 transition-colors hover:border-text/25 hover:bg-surface-2"
          >
            {t.confirmCancel}
          </button>
          <button
            type="button"
            onClick={onSend}
            className="rounded-[6px] bg-text px-4 py-1.5 text-[13.5px] font-medium text-ink transition-transform active:translate-y-px"
          >
            {t.confirmSend}
          </button>
        </div>
      </div>
    </div>
  );
}
