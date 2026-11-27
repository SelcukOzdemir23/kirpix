import type { Candidate, Cue } from '../api';
import type { copy } from '../i18n/copy';
import type { Edge, Step } from '../state/edges';
import type { Preview } from '../state/usePreview';
import type { Bounds } from '../state/useSearch';
import BoundaryControls from './BoundaryControls';
import Button from './Button';
import CueLines from './CueLines';

type Props = {
  t: (typeof copy)['tr'];
  candidate: Candidate;
  edges: Bounds;
  /** The candidate's lines, or null while they load. */
  lines: Cue[] | null;
  preview: Preview | null;
  previewing: boolean;
  /** The backend runs a system FFmpeg; say so where media work happens (constitution, Media). */
  systemMedia: boolean;
  step: Step;
  onStep: (step: Step) => void;
  onPreview: () => void;
  onMove: (edge: Edge, direction: -1 | 1) => void;
  onReset: () => void;
  onListen: (cueIndex: number) => void;
};

/**
 * The selected candidate (FR-007): its player, its edges and its lines,
 * together. The player encodes only when asked (FR-014, feature 005).
 */
export default function CandidateDetail(props: Props) {
  const { t, candidate, edges, preview } = props;
  const moved = edges.startMs !== candidate.startMs || edges.endMs !== candidate.endMs;

  return (
    <section className="flex min-h-0 flex-col gap-3 overflow-hidden px-4 pt-3 pb-2">
      <div className="flex shrink-0 items-end gap-3">
        <div className="relative grid aspect-video h-[clamp(120px,26vh,250px)] max-w-full shrink-0 place-items-center overflow-hidden rounded-[6px] bg-[#101210]">
          {preview ? (
            <video src={preview.url} controls autoPlay className="h-full w-full" />
          ) : (
            <Button onClick={props.onPreview} disabled={props.previewing} className="!border-white !bg-white/95 !text-[#1b1d1b]">
              {props.previewing ? t.preparing : t.preview}
            </Button>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-[13px] text-muted">
          {preview && (
            <Button kind="quiet" onClick={props.onPreview} className="self-start">
              {t.closePreview}
            </Button>
          )}
          {preview?.truncated && <span>{t.firstSeconds(Math.round(preview.durationMs / 1000))}</span>}
          {props.systemMedia && <span className="leading-snug">{t.systemMedia}</span>}
        </div>
      </div>

      <BoundaryControls
        t={t}
        edges={edges}
        moved={moved}
        step={props.step}
        onStep={props.onStep}
        onMove={props.onMove}
        onReset={props.onReset}
      />

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line pt-2">
        {props.lines && <CueLines t={t} cues={props.lines} edges={edges} onListen={props.onListen} />}
      </div>
    </section>
  );
}
