import { useState } from 'react';
import { api, type Candidate } from '../api';

/** A candidate's edges as the user left them. */
export type Bounds = { startMs: number; endMs: number };

/** A model's answer: the order it chose and one sentence per candidate (004). */
export type Ranking = { order: number[]; reasons: Record<number, string> };

/** The terms as typed, split on commas, trimmed, empties dropped. */
export function parseTerms(terms: string): string[] {
  return terms
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
}

/**
 * The candidates the user keeps, in the order shown: the model's order when
 * it ranked them, with the ones it left out after, in their deterministic
 * order.
 */
export function orderCandidates(
  candidates: Candidate[] | null,
  rejected: number[],
  ranking: Ranking | null,
): Candidate[] {
  return (candidates ?? [])
    .filter((candidate) => !rejected.includes(candidate.id))
    .slice()
    .sort((left, right) => {
      if (!ranking) return 0;
      const a = ranking.order.indexOf(left.id);
      const b = ranking.order.indexOf(right.id);
      if (a === -1 && b === -1) return 0;
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });
}

/** A candidate's current edges: the user's, or the ones the search found. */
export function edgesOf(candidate: Candidate, bounds: Record<number, Bounds>): Bounds {
  return bounds[candidate.id] ?? { startMs: candidate.startMs, endMs: candidate.endMs };
}

/**
 * The topic criterion and what it found (feature 001): the inputs, the
 * candidates, the edges the user moved, the ones they dropped, and which one
 * is selected (data-model.md `Selection.selectedId`: the first on arrival,
 * null only when there are none).
 */
export function useSearch(report: (error: unknown) => void) {
  const [terms, setTerms] = useState('');
  const [minSec, setMinSec] = useState(8);
  const [maxSec, setMaxSec] = useState(120);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [bounds, setBounds] = useState<Record<number, Bounds>>({});
  const [rejected, setRejected] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function clear() {
    setCandidates(null);
    setBounds({});
    setRejected([]);
    setSelectedId(null);
  }

  /** Run the search; returns the terms it ran with, or null when it failed. */
  async function run(): Promise<string[] | null> {
    const parsed = parseTerms(terms);
    report(null);
    setSearching(true);
    try {
      const found = await api.searchTopic(parsed, minSec * 1000, maxSec * 1000);
      setCandidates(found);
      setBounds({});
      setRejected([]);
      setSelectedId(found[0]?.id ?? null);
      return parsed;
    } catch (error) {
      setCandidates(null);
      report(error);
      return null;
    } finally {
      setSearching(false);
    }
  }

  function moveEdges(id: number, startMs: number, endMs: number) {
    setBounds((current) => ({ ...current, [id]: { startMs, endMs } }));
  }

  function resetEdges(id: number) {
    setBounds((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function reject(id: number) {
    setRejected((current) => [...current, id]);
  }

  return {
    terms,
    setTerms,
    minSec,
    setMinSec,
    maxSec,
    setMaxSec,
    searching,
    candidates,
    bounds,
    rejected,
    selectedId,
    select: setSelectedId,
    clear,
    run,
    moveEdges,
    resetEdges,
    reject,
  };
}
