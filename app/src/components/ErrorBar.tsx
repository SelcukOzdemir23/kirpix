import { useEffect } from 'react';
import { errorMessage, type copy, type Lang } from '../i18n/copy';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  lang: Lang;
  /** The error as the backend sent it; worded here, in the current language. */
  error: unknown;
  onDismiss: () => void;
};

/** A failure, stated where the work happens (article IX), until dismissed or Escape. */
export default function ErrorBar({ t, lang, error, onDismiss }: Props) {
  // Escape dismisses it, the way a desktop notice goes away.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div role="alert" className="flex shrink-0 items-start gap-3 border-b border-danger bg-surface px-4 py-2.5">
      <p className="flex-1 text-[14.5px] leading-relaxed text-danger">{errorMessage(error, lang)}</p>
      <Button kind="quiet" aria-label={t.dismiss} onClick={onDismiss}>
        {t.close}
      </Button>
    </div>
  );
}
