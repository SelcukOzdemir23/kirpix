import type { Cue } from '../api';
import type { Bounds } from './useSearch';

/** Candidates are padded by half a second on each side (001 FR-009). */
const PAD_MS = 500;
/** An edge move never leaves a clip shorter than this. */
const MIN_MS = 1000;

export type Edge = 'start' | 'end';
export type Step = 'second' | 'line';

/** Keep the edges in order, inside the recording, and at least a second apart. */
export function clampEdges(startMs: number, endMs: number): Bounds {
  const start = Math.max(0, Math.min(startMs, endMs - MIN_MS));
  return { startMs: start, endMs: Math.max(start + MIN_MS, endMs) };
}

/**
 * Move one edge by one step (001 FR-015, 007 FR-025): a second, or to the
 * next line boundary in that direction. Line boundaries are the cues' own
 * times plus the search's padding, so moving by a line lands where the search
 * would have put the edge. Returns the edges unchanged when there is no line
 * further in that direction among `cues`.
 */
export function stepEdge(edges: Bounds, edge: Edge, direction: -1 | 1, step: Step, cues: Cue[]): Bounds {
  if (step === 'second') {
    const delta = direction * 1000;
    return edge === 'start'
      ? clampEdges(edges.startMs + delta, edges.endMs)
      : clampEdges(edges.startMs, edges.endMs + delta);
  }

  const current = edge === 'start' ? edges.startMs : edges.endMs;
  const options = cues
    .map((cue) => (edge === 'start' ? Math.max(0, cue.startMs - PAD_MS) : cue.endMs + PAD_MS))
    .filter((value) => (direction === 1 ? value > current : value < current));
  if (options.length === 0) return edges;
  const next = direction === 1 ? Math.min(...options) : Math.max(...options);
  return edge === 'start' ? clampEdges(next, edges.endMs) : clampEdges(edges.startMs, next);
}
