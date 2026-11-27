import type { copy } from '../i18n/copy';

/** No subtitle line matched (001): said plainly, never shown as an empty list. */
export default function NoMatch({ t }: { t: (typeof copy)['tr'] }) {
  return (
    <div className="grid min-h-[200px] flex-1 place-items-center px-8">
      <div className="flex max-w-[440px] flex-col gap-2 text-center">
        <p className="text-[17px] leading-relaxed">{t.noMatch}</p>
        <p className="text-[14.5px] leading-relaxed text-muted">{t.noMatchHint}</p>
      </div>
    </div>
  );
}
