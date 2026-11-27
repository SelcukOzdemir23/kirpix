import type { Mode, SessionInfo } from '../api';
import { fileName, timecode } from '../format';
import type { copy } from '../i18n/copy';

type Props = {
  t: (typeof copy)['tr'];
  session: SessionInfo;
  mode: Mode;
  offsetMs: number;
};

/** The engine as the user chose it: the model's name, or heuristic (article III). */
export function engineName(mode: Mode, t: (typeof copy)['tr']): string {
  if (mode.mode === 'local') return mode.model || mode.address;
  if (mode.mode === 'cloud') return mode.model;
  return t.modeHeuristic;
}

/** Which engine produced the list on screen: heuristic, or the model and whether it ranked (004). */
export function resultBadge(mode: Mode, ranked: boolean, t: (typeof copy)['tr']): string {
  if (mode.mode === 'heuristic') return t.heuristicBadge;
  const model = engineName(mode, t);
  return ranked ? t.rankedBy(model) : model;
}

/**
 * The open recording in one line (FR-010): its name, its length, the engine
 * the next search will use, and the subtitle shift when there is one. Cue
 * count and source live in the alignment panel (FR-011).
 */
export default function RecordingLine({ t, session, mode, offsetMs }: Props) {
  return (
    <div className="flex min-w-0 items-baseline gap-4">
      <span className="min-w-0 truncate font-semibold" title={session.videoPath}>
        {fileName(session.videoPath)}
      </span>
      <span className="shrink-0 font-mono text-muted tabular-nums">
        {timecode(session.durationMs)}
      </span>
      <span className="shrink-0 truncate text-muted" title={t.engineSection}>
        {engineName(mode, t)}
      </span>
      {offsetMs !== 0 && (
        <span className="shrink-0 text-muted">
          {t.alignmentOffset(t.offsetValue(offsetMs))}
        </span>
      )}
    </div>
  );
}
