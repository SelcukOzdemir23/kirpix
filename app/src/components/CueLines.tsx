import type { ReactNode } from 'react';
import type { Cue } from '../api';
import { timecode } from '../format';
import type { copy } from '../i18n/copy';
import type { Bounds } from '../state/useSearch';

type Props = {
  t: (typeof copy)['tr'];
  cues: Cue[];
  /** Only lines overlapping these edges are shown. */
  edges: Bounds;
  onListen: (cueIndex: number) => void;
};

/**
 * Split a line at its marks (FR-008). The marks come from the backend's own
 * matcher as UTF-16 offsets, which is how JavaScript slices strings, so no
 * matching happens here.
 */
export function markedText(text: string, marks: [number, number][]): ReactNode[] {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of marks) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      <mark key={start} className="rounded-[2px] bg-marker px-0.5 font-semibold text-on-marker">
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/** The selected candidate's subtitle lines, each with its time and a way to hear it (FR-007). */
export default function CueLines({ t, cues, edges, onListen }: Props) {
  const inside = cues.filter((cue) => cue.endMs > edges.startMs && cue.startMs < edges.endMs);
  return (
    <ol className="flex flex-col">
      {inside.map((cue) => (
        <li key={cue.index} className="group grid grid-cols-[52px_1fr_auto] items-baseline gap-3 py-1">
          <span className="font-mono text-[13.5px] text-muted tabular-nums">{timecode(cue.startMs)}</span>
          <span className="selectable text-[15px] leading-relaxed">{markedText(cue.text, cue.marks)}</span>
          <button
            type="button"
            onClick={() => onListen(cue.index)}
            className="text-[13px] text-muted underline decoration-1 underline-offset-[3px] hover:text-text"
          >
            {t.listen}
          </button>
        </li>
      ))}
    </ol>
  );
}
