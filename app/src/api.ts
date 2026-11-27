import { invoke } from '@tauri-apps/api/core';

export type SubtitleTrack = {
  streamIndex: number;
  codec: string;
  language: string | null;
  title: string | null;
  kind: 'text' | 'picture';
};

export type SessionInfo = {
  videoPath: string;
  subtitleLabel: string;
  subtitleSource: 'file' | 'embedded';
  durationMs: number;
  cueCount: number;
  encoding: string;
  width: number | null;
  height: number | null;
  hasAudio: boolean;
  mediaSource: string;
  offsetMs: number;
};

export type Cue = {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  /** Where the search terms matched, as [start, end) UTF-16 offsets into `text`. */
  marks: [number, number][];
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

export type SettingsReport = {
  mode: Mode;
  /** Absolute path of the settings file, when the machine gave one. */
  path: string | null;
  /** Why the file could not be read at start-up, if it could not. */
  loadError: string | null;
};

export type ErrorPayload = {
  kind: string;
  path?: string;
  reason?: string;
  name?: string;
  tail?: string;
};

export type CutResult = {
  path: string;
  durationMs: number;
  status: 'ok' | 'failed';
  message: string | null;
};

export type ClipRequest = { startMs: number; endMs: number };

export type ClipPreview = {
  url: string;
  durationMs: number;
  truncated: boolean;
};

export type OffsetInfo = { offsetMs: number; clampedCues: number };

export type CloudProvider = 'deepSeek';

export type Mode =
  | { mode: 'heuristic' }
  | { mode: 'local'; address: string; model: string }
  | { mode: 'cloud'; provider: CloudProvider; model: string };

/** What the confirmation dialog states: facts that came from the payload itself. */
export type RequestPlan = {
  mode: Mode;
  model: string;
  address: string;
  candidateCount: number;
  cueCount: number;
  charCount: number;
  leftOut: number;
  shortened: number;
};

export type Confirmation = { mode: Mode; cueCount: number; charCount: number };

export type RankedCandidate = { candidate: number; reason: string; cues: number[] };

export const api = {
  openSession: (videoPath: string, subtitlePath: string) =>
    invoke<SessionInfo>('open_session', { videoPath, subtitlePath }),

  listTracks: (videoPath: string) => invoke<SubtitleTrack[]>('list_tracks', { videoPath }),

  openFromTrack: (videoPath: string, streamIndex: number) =>
    invoke<SessionInfo>('open_from_track', { videoPath, streamIndex }),

  sessionCues: (from: number, to: number, terms?: string[]) =>
    invoke<Cue[]>('session_cues', { from, to, terms }),

  searchTopic: (terms: string[], minMs: number, maxMs: number) =>
    invoke<Candidate[]>('search_topic', { terms, minMs, maxMs }),

  setOffset: (offsetMs: number) => invoke<OffsetInfo>('set_offset', { offsetMs }),

  cueSample: (cueIndex: number, seconds: number) =>
    invoke<string>('cue_sample', { cueIndex, seconds }),

  previewClip: (startMs: number, endMs: number) =>
    invoke<ClipPreview>('preview_clip', { startMs, endMs }),

  /** What settings are in force, where they live, and why they could not be read. */
  getSettings: () => invoke<SettingsReport>('get_settings'),

  setMode: (mode: Mode) => invoke<void>('set_mode', { mode }),

  listModels: (address: string) => invoke<string[]>('list_models', { address }),

  hasKey: (provider: CloudProvider) => invoke<boolean>('has_key', { provider }),

  setKey: (provider: CloudProvider, key: string) => invoke<void>('set_key', { provider, key }),

  clearKey: (provider: CloudProvider) => invoke<void>('clear_key', { provider }),

  planRequest: (terms: string[], minMs: number, maxMs: number) =>
    invoke<RequestPlan>('plan_request', { terms, minMs, maxMs }),

  rankCandidates: (terms: string[], minMs: number, maxMs: number, confirmation: Confirmation) =>
    invoke<RankedCandidate[]>('rank_candidates', { terms, minMs, maxMs, confirmation }),

  cutClips: (clips: ClipRequest[], outDir: string) =>
    invoke<CutResult[]>('cut_clips', { clips, outDir }),
};
