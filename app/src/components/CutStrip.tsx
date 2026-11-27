import type { CutResult } from '../api';
import { fileName, folderOf, timecode } from '../format';
import type { copy } from '../i18n/copy';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  results: CutResult[];
  onClose: () => void;
};

/**
 * What the last cut wrote (FR-024, 001 FR-018, FR-019): a summary, the folder,
 * and one row per clip, with a failed clip's reason in place of its file.
 * It sits under the work and can be closed; the candidates stay on screen.
 */
export default function CutStrip({ t, results, onClose }: Props) {
  const ok = results.filter((result) => result.status === 'ok').length;
  const failed = results.length - ok;
  const summary =
    failed > 0 ? t.cutPartial(ok, failed) : results.length === 0 ? t.cutNothing : t.cutDone(results.length);
  const folder = results.find((result) => result.status === 'ok')?.path;

  return (
    <section aria-label={t.written} className="shrink-0 border-t border-line bg-surface px-4 py-2.5">
      <div className="flex items-baseline gap-3">
        <h2 className={`font-semibold ${failed > 0 ? 'text-danger' : ''}`}>{summary}</h2>
        {folder && (
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted" title={folderOf(folder)}>
            {t.writtenTo}: {folderOf(folder)}
          </span>
        )}
        <Button kind="quiet" className="ml-auto" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <ul className="mt-1.5 max-h-[96px] overflow-y-auto">
        {results.map((result, position) => (
          <li key={`${result.path}-${position}`} className="flex items-baseline justify-between gap-3 py-0.5 text-[14px]">
            <span className={`selectable min-w-0 truncate ${result.status === 'ok' ? '' : 'text-danger'}`} title={result.path}>
              {result.status === 'ok' ? fileName(result.path) : result.message}
            </span>
            <span className="shrink-0 font-mono text-muted tabular-nums">
              {result.status === 'ok' ? timecode(result.durationMs) : t.failed}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
