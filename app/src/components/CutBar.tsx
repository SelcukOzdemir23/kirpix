import type { CutProgress } from '../state/useCut';
import type { copy } from '../i18n/copy';
import Button from './Button';

type Props = {
  t: (typeof copy)['tr'];
  /** How many candidates have their box ticked. */
  kept: number;
  folder: string | null;
  cutting: boolean;
  progress: CutProgress | null;
  /** The backend runs a system FFmpeg; say so where media work happens (constitution, Media). */
  systemMedia: boolean;
  onChooseFolder: () => void;
  onCut: () => void;
};

/**
 * The results screen's primary action (FR-012, FR-024): it says how many clips
 * it will cut and is disabled at zero. The folder they go to is shown and can
 * be changed beside it.
 */
export default function CutBar({ t, kept, folder, cutting, progress, systemMedia, onChooseFolder, onCut }: Props) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted" title={folder ?? undefined}>
          {t.folder}: {folder ?? t.folderAsk}
        </span>
        <Button kind="quiet" onClick={onChooseFolder} disabled={cutting}>
          {t.changeFolder}
        </Button>
        <Button kind="primary" onClick={onCut} disabled={cutting || kept === 0}>
          {cutting ? `${t.cutting}${progress ? ` ${progress.percent}%` : ''}` : t.cutCount(kept)}
        </Button>
      </div>
      {systemMedia && <span className="text-[12.5px] leading-snug text-muted">{t.systemMedia}</span>}
    </div>
  );
}
