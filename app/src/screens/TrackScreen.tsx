import type { SubtitleTrack } from '../api';
import Button from '../components/Button';
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
 * The container carries subtitles (feature 002): pick one, or bring a file.
 * A picture track is shown like any unbuilt choice, dashed and inert, with
 * the reason it cannot be read.
 */
export default function TrackScreen({ t, videoPath, tracks, busy, onTrack, onFile }: Props) {
  const firstReadable = tracks.find((track) => track.kind === 'text')?.streamIndex;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-5 px-6 py-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-bold tracking-[-0.01em]">{t.chooseTrack}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t.chooseTrackHint}</p>
          <p className="truncate text-[14px] text-muted" title={videoPath}>
            {fileName(videoPath)}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {tracks.map((track) => {
            const name = track.title ?? track.language?.toUpperCase() ?? `#${track.streamIndex}`;
            if (track.kind !== 'text') {
              return (
                <li
                  key={track.streamIndex}
                  className="flex items-baseline gap-3 rounded-[6px] border border-dashed border-edge px-3.5 py-2.5 text-muted"
                >
                  <span className="text-[15.5px]">{name}</span>
                  <span className="text-[13.5px]">{track.codec}</span>
                  <span className="ml-auto text-[13.5px]">{t.pictureTrack}</span>
                </li>
              );
            }
            return (
              <li key={track.streamIndex}>
                <button
                  type="button"
                  autoFocus={track.streamIndex === firstReadable}
                  disabled={busy}
                  onClick={() => onTrack(track.streamIndex)}
                  className="flex w-full items-baseline gap-3 rounded-[6px] border border-edge bg-surface px-3.5 py-2.5 text-left hover:bg-surface-2 disabled:opacity-45"
                >
                  <span className="text-[15.5px] font-semibold">{name}</span>
                  <span className="text-[13.5px] text-muted">{track.codec}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <Button className="self-start" onClick={onFile}>
          {t.fromFile}
        </Button>
      </div>
    </div>
  );
}
