import { invoke } from '@tauri-apps/api/core';

export type SessionInfo = {
  videoPath: string;
  subtitlePath: string;
  durationMs: number;
  cueCount: number;
  encoding: string;
  width: number | null;
  height: number | null;
  hasAudio: boolean;
  mediaSource: string;
};

export type Cue = {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
};

export type Candidate = {
  id: number;
  startCue: number;
  endCue: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  matchedTerms: string[];
  matchedCueCount: number;
  matchedDurationMs: number;
  clamped: boolean;
};

export type ErrorPayload = {
  kind: string;
  path?: string;
  reason?: string;
  name?: string;
  tail?: string;
};

export const api = {
  openSession: (videoPath: string, subtitlePath: string) =>
    invoke<SessionInfo>('open_session', { videoPath, subtitlePath }),

  sessionCues: (from: number, to: number) => invoke<Cue[]>('session_cues', { from, to }),

  searchTopic: (terms: string[], minMs: number, maxMs: number) =>
    invoke<Candidate[]>('search_topic', { terms, minMs, maxMs }),
};
