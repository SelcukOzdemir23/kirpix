import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { api, type ClipRequest, type CutResult } from '../api';

/** Progress of the clip being encoded, as the backend reports it. */
export type CutProgress = { index: number; percent: number };

/**
 * Cutting the kept clips (feature 001): the output folder, progress while
 * FFmpeg runs, and the files that were written. One failed clip does not stop
 * the others; the backend reports each one.
 */
export function useCut(report: (error: unknown) => void) {
  const [cutting, setCutting] = useState(false);
  const [progress, setProgress] = useState<CutProgress | null>(null);
  const [results, setResults] = useState<CutResult[] | null>(null);
  const [writtenOpen, setWrittenOpen] = useState(false);

  function reset() {
    setResults(null);
    setWrittenOpen(false);
  }

  /** Ask for a folder, then cut every clip into it. */
  async function run(clips: ClipRequest[]) {
    const folder = await open({ directory: true, multiple: false });
    if (typeof folder !== 'string') return;

    report(null);
    setCutting(true);
    setResults(null);
    setProgress(null);
    const stopListening = await listen<CutProgress>('cut-progress', (event) => {
      setProgress(event.payload);
    });

    try {
      setResults(await api.cutClips(clips, folder));
      setWrittenOpen(true);
    } catch (error) {
      report(error);
    } finally {
      stopListening();
      setProgress(null);
      setCutting(false);
    }
  }

  return { cutting, progress, results, writtenOpen, setWrittenOpen, reset, run };
}
