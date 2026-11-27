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
  // The folder stays chosen for the session, shown beside the cut action
  // (FR-024); until one is chosen, cutting asks for it.
  const [folder, setFolder] = useState<string | null>(null);

  /** Ask for a folder; keeps the current one when the dialog is dismissed. */
  async function chooseFolder(): Promise<string | null> {
    const picked = await open({ directory: true, multiple: false });
    if (typeof picked !== 'string') return null;
    setFolder(picked);
    return picked;
  }

  function reset() {
    setResults(null);
    setWrittenOpen(false);
  }

  /** Cut every clip into the chosen folder, asking for one first if there is none. */
  async function run(clips: ClipRequest[]) {
    const target = folder ?? (await chooseFolder());
    if (target === null) return;

    report(null);
    setCutting(true);
    setResults(null);
    setProgress(null);
    const stopListening = await listen<CutProgress>('cut-progress', (event) => {
      setProgress(event.payload);
    });

    try {
      setResults(await api.cutClips(clips, target));
      setWrittenOpen(true);
    } catch (error) {
      report(error);
    } finally {
      stopListening();
      setProgress(null);
      setCutting(false);
    }
  }

  return { cutting, progress, results, writtenOpen, setWrittenOpen, folder, chooseFolder, reset, run };
}
