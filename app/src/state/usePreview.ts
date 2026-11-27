import { useRef, useState } from 'react';
import { api, type ClipPreview } from '../api';
import type { Bounds } from './useSearch';

/** A preview, with the candidate it belongs to. */
export type Preview = ClipPreview & { candidateId: number };

/**
 * One preview at a time (feature 005), encoded only when the user asks.
 *
 * Every request takes a ticket. An answer whose ticket is no longer current is
 * dropped, so a slow encode cannot paint over a preview asked for afterwards,
 * or over a range the user has since moved.
 */
export function usePreview(report: (error: unknown) => void) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const ticket = useRef(0);

  /** Drop whatever is showing or on its way. */
  function reset() {
    ticket.current += 1;
    setPreview(null);
    setPendingId(null);
  }

  /** Ask for a preview of one candidate, or close the one already showing. */
  async function toggle(candidateId: number, range: Bounds) {
    if (preview?.candidateId === candidateId) {
      reset();
      return;
    }

    const mine = (ticket.current += 1);
    setPreview(null);
    setPendingId(candidateId);
    try {
      const clip = await api.previewClip(range.startMs, range.endMs);
      if (ticket.current === mine) setPreview({ ...clip, candidateId });
    } catch (error) {
      if (ticket.current === mine) report(error);
    } finally {
      if (ticket.current === mine) setPendingId(null);
    }
  }

  return { preview, pendingId, toggle, reset };
}
