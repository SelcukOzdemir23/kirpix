import { useState } from 'react';
import { api, type Mode, type RequestPlan } from '../api';
import type { Ranking } from './useSearch';

/**
 * Asking a model to rank the candidates (feature 004): the plan of what would
 * be sent, the user's confirmation, and the answer.
 *
 * Nothing leaves the machine until `send` runs, and `send` only sends what the
 * plan the user saw describes.
 */
export function useRanking(report: (error: unknown) => void) {
  const [plan, setPlan] = useState<RequestPlan | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * After a search in a model mode, build the payload and show it. Returns
   * false when the plan could not be built.
   */
  async function propose(mode: Mode, terms: string[], minMs: number, maxMs: number) {
    setRanking(null);
    if (mode.mode === 'heuristic') return true;
    try {
      setPlan(await api.planRequest(terms, minMs, maxMs));
      return true;
    } catch (error) {
      report(error);
      return false;
    }
  }

  /** Send the payload the dialog described, then keep the model's order. */
  async function send(terms: string[], minMs: number, maxMs: number) {
    if (!plan) return;
    setBusy(true);
    try {
      const answer = await api.rankCandidates(terms, minMs, maxMs, {
        mode: plan.mode,
        cueCount: plan.cueCount,
        charCount: plan.charCount,
      });
      setRanking({
        order: answer.map((entry) => entry.candidate),
        reasons: Object.fromEntries(answer.map((entry) => [entry.candidate, entry.reason])),
      });
    } catch (error) {
      report(error);
    } finally {
      setPlan(null);
      setBusy(false);
    }
  }

  return {
    plan,
    ranking,
    busy,
    propose,
    send,
    cancel: () => setPlan(null),
    reset: () => setRanking(null),
  };
}
