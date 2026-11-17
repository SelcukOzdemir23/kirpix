import type { SubtitleTrack } from '../api';
import { fileName } from '../format';
import type { copy } from '../i18n/copy';

type Props = {
  t: (typeof copy)['tr'];
  videoPath: string;
  tracks: SubtitleTrack[];
  busy: boolean;
  onTrack: (streamIndex: number) => void;
  onFile: () => void;
};

/**
 * Shown in the working area when the chosen container already carries subtitle
 * tracks. Reading them never writes next to the user's media, so this is simply
 * a choice of which text to work on. Picture-based tracks are listed and
 * disabled with the reason, never silently skipped.
 */
export default function TrackChooser({ t, videoPath, tracks, busy, onTrack, onFile }: Props) {
  const firstReadable = tracks.find((track) => track.kind === 'text')?.streamIndex;

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col gap-5 px-6 py-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[20px] tracking-[-0.015em]">{t.chooseTrack}</h2>
        <p className="text-[14.5px] leading-relaxed text-muted">{t.chooseTrackHint}</p>
        <p className="truncate font-mono text-[13.5px] text-muted/80" title={videoPath}>
          {fileName(videoPath)}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {tracks.map((track) => {
          const readable = track.kind === 'text';
          return (
            <li key={track.streamIndex}>
              <button
                type="button"
                autoFocus={track.streamIndex === firstReadable}
                disabled={!readable || busy}
                onClick={() => onTrack(track.streamIndex)}
                className="grid w-full grid-cols-[38px_1fr_146px_198px] items-baseline gap-3 rounded-[6px] border border-line bg-surface/60 px-3.5 py-2.5 text-left transition-colors hover:border-text/25 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-surface/60"
              >
                <span className="font-mono text-[13px] tabular-nums text-muted">
                  #{track.streamIndex}
                </span>
                <span className="truncate text-[15.5px]">
                  {track.title ?? track.language?.toUpperCase() ?? `#${track.streamIndex}`}
                </span>
                <span className="truncate text-right font-mono text-[13px] text-muted">
                  {track.codec}
                </span>
                <span className="text-right text-[13.5px] leading-snug text-muted">
                  {readable ? '' : t.pictureTrack}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onFile}
        className="w-fit rounded-[6px] border border-line px-3.5 py-2 text-[14px] text-text/90 transition-colors hover:border-text/25 hover:bg-surface-2"
      >
        {t.fromFile}
      </button>
    </div>
  );
}
