import { useRef, useState, type ReactNode } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { api, type Candidate, type CutResult, type SessionInfo, type SubtitleTrack } from './api';
import { copy, errorMessage, type Lang } from './i18n/copy';
import { fileName, folderOf, timecode } from './format';
import CandidateCard from './components/CandidateCard';
import CriteriaForm from './components/CriteriaForm';
import OffsetControls from './components/OffsetControls';
import TimelineStrip, { type Bounds } from './components/TimelineStrip';
import TrackChooser from './components/TrackChooser';
import { useDropZone } from './useDropZone';

const VIDEO_FILTERS = [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'webm'] }];
const SUBTITLE_FILTERS = [{ name: 'Subtitles', extensions: ['srt', 'vtt'] }];
const VIDEO_EXT = /\.(mp4|mkv|mov|webm)$/i;
const SUBTITLE_EXT = /\.(srt|vtt)$/i;

/*
  Two panes, the way a desktop tool reads: everything you set on the left, what
  came out of it on the right. The working pane keeps one subject at a time —
  choosing a subtitle track, the candidate list, or the files that were written.
*/

export default function App() {
  const [lang, setLang] = useState<Lang>('tr');
  const t = copy[lang];

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingVideo, setPendingVideo] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);

  const [terms, setTerms] = useState('');
  const [minSec, setMinSec] = useState(8);
  const [maxSec, setMaxSec] = useState(120);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [bounds, setBounds] = useState<Record<number, Bounds>>({});
  const [rejected, setRejected] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [clampedCues, setClampedCues] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [cutting, setCutting] = useState(false);
  const [progress, setProgress] = useState<{ index: number; percent: number } | null>(null);
  const [results, setResults] = useState<CutResult[] | null>(null);
  const [writtenOpen, setWrittenOpen] = useState(false);

  const dropReady = useDropZone((paths) => void acceptDropped(paths));

  function applySession(info: SessionInfo) {
    setSession(info);
    setPendingVideo(null);
    setTracks([]);
    setCandidates(null);
    setBounds({});
    setRejected([]);
    setResults(null);
    setWrittenOpen(false);
    setError(null);
    setOffsetMs(info.offsetMs);
    setClampedCues(0);
    setActiveId(null);
  }

  async function applyOffset(next: number) {
    try {
      const info = await api.setOffset(next);
      setOffsetMs(info.offsetMs);
      setClampedCues(info.clampedCues);
      // The previous results were measured on the old times.
      setCandidates(null);
      setBounds({});
      setResults(null);
      setWrittenOpen(false);
      setActiveId(null);
    } catch (err) {
      setError(errorMessage(err, lang));
    }
  }

  async function playCue(cueIndex: number) {
    try {
      const url = await api.cueSample(cueIndex, 4);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (err) {
      setError(errorMessage(err, lang));
    }
  }

  async function pickVideo() {
    setError(null);
    const video = await open({ multiple: false, directory: false, filters: VIDEO_FILTERS });
    if (typeof video === 'string') await acceptVideo(video);
  }

  /** A container may already carry its subtitles. Ask which text before asking for a file. */
  async function acceptVideo(video: string) {
    setError(null);
    setBusy(true);
    try {
      const found = await api.listTracks(video);
      if (found.length > 0) {
        setPendingVideo(video);
        setTracks(found);
        setSession(null);
      } else {
        await acceptSubtitleFile(video);
      }
    } catch (err) {
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function acceptSubtitleFile(video: string) {
    const subtitle = await open({ multiple: false, directory: false, filters: SUBTITLE_FILTERS });
    if (typeof subtitle === 'string') await openWith(video, subtitle);
  }

  async function openWith(video: string, subtitle: string) {
    setBusy(true);
    try {
      applySession(await api.openSession(video, subtitle));
    } catch (err) {
      setSession(null);
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function openFromTrack(video: string, streamIndex: number) {
    setBusy(true);
    try {
      applySession(await api.openFromTrack(video, streamIndex));
    } catch (err) {
      setSession(null);
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  /** A dropped file is the same choice as a picked one; an explicit subtitle wins over the container's own. */
  async function acceptDropped(paths: string[]) {
    const video = paths.find((path) => VIDEO_EXT.test(path));
    const subtitle = paths.find((path) => SUBTITLE_EXT.test(path));

    if (video) {
      if (subtitle) await openWith(video, subtitle);
      else await acceptVideo(video);
      return;
    }

    if (subtitle) {
      const known = pendingVideo ?? session?.videoPath;
      if (known) await openWith(known, subtitle);
    }
  }

  async function runSearch() {
    const parsed = terms
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean);
    setError(null);
    setSearching(true);
    try {
      const found = await api.searchTopic(parsed, minSec * 1000, maxSec * 1000);
      setCandidates(found);
      setBounds({});
      setRejected([]);
      setResults(null);
      setWrittenOpen(false);
      setActiveId(null);
    } catch (err) {
      setCandidates(null);
      setError(errorMessage(err, lang));
    } finally {
      setSearching(false);
    }
  }

  async function runCut() {
    const folder = await open({ directory: true, multiple: false });
    if (typeof folder !== 'string') return;

    const clips = visible.map((candidate) => {
      const current = bounds[candidate.id] ?? candidate;
      return { startMs: current.startMs, endMs: current.endMs };
    });

    setError(null);
    setCutting(true);
    setResults(null);
    setProgress(null);

    const stopListening = await listen<{ index: number; percent: number }>('cut-progress', (event) => {
      setProgress(event.payload);
    });

    try {
      const written = await api.cutClips(clips, folder);
      setResults(written);
      setWrittenOpen(true);
    } catch (err) {
      setError(errorMessage(err, lang));
    } finally {
      stopListening();
      setProgress(null);
      setCutting(false);
    }
  }

  const visible = (candidates ?? []).filter((candidate) => !rejected.includes(candidate.id));
  const keptDuration = visible.reduce((total, candidate) => {
    const current = bounds[candidate.id] ?? candidate;
    return total + (current.endMs - current.startMs);
  }, 0);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-ink text-text">
      <audio ref={audioRef} hidden />

      <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-line px-5">
        <span className="text-[14.5px] font-semibold tracking-[-0.015em]">Kirpix</span>

        <div className="flex shrink-0 items-center gap-3">
          {busy && <span className="font-mono text-[11px] text-muted">{t.opening}</span>}
          <div className="flex items-center rounded-[5px] border border-line p-0.5">
            {(['tr', 'en'] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded-[3px] px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] transition-colors ${
                  lang === code ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-3 border-b border-red-400/20 bg-red-500/10 px-5 py-2"
        >
          <p className="flex-1 text-[12.5px] leading-relaxed text-red-100">{error}</p>
          <button
            type="button"
            aria-label={t.dismiss}
            onClick={() => setError(null)}
            className="rounded-[3px] px-1.5 text-[13px] leading-5 text-red-200/70 transition-colors hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[356px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface/25 px-5 py-4">
          <section className="flex flex-col gap-2">
            <SectionLabel>{t.sourceSection}</SectionLabel>

            {session || pendingVideo ? (
              <>
                <span
                  className="truncate text-[13px] font-medium"
                  title={session?.videoPath ?? pendingVideo ?? ''}
                >
                  {fileName(session?.videoPath ?? pendingVideo ?? '')}
                </span>

                {session ? (
                  <>
                    <div className="flex items-baseline gap-2 text-[11.5px] text-muted">
                      <span className="font-mono tabular-nums">{timecode(session.durationMs)}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {session.cueCount} {t.cues.toLowerCase()}
                      </span>
                      <span className="ml-auto font-mono text-[10.5px] text-muted/70 uppercase">
                        {session.encoding}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted" title={session.subtitleLabel}>
                        {session.subtitleLabel}
                      </span>
                      {session.subtitleSource === 'embedded' && (
                        <span className="shrink-0 rounded-[3px] border border-line px-1.5 text-[10.5px] text-muted">
                          {t.embedded}
                        </span>
                      )}
                    </div>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={pickVideo}
                  disabled={busy}
                  className="self-start text-[11.5px] text-muted underline-offset-4 transition-colors hover:text-text hover:underline disabled:opacity-50"
                >
                  {t.another}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={pickVideo}
                disabled={busy}
                className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-white/[0.14] px-3 py-4 text-center transition-colors hover:border-accent/40 hover:bg-surface-2/60 disabled:opacity-50"
              >
                <span className="text-[12.5px]">{dropReady ? t.dropHere : busy ? t.opening : t.pick}</span>
                {dropReady && !busy && <span className="text-[11px] text-muted">{t.dropOrPick}</span>}
              </button>
            )}
          </section>

          {session && (
            <RailSection>
              <OffsetControls
                t={t}
                offsetMs={offsetMs}
                clampedCues={clampedCues}
                onChange={applyOffset}
              />
            </RailSection>
          )}

          {session && (
            <RailSection>
              <SectionLabel>{t.searchSection}</SectionLabel>
              <CriteriaForm
                t={t}
                terms={terms}
                minSec={minSec}
                maxSec={maxSec}
                searching={searching}
                onTerms={setTerms}
                onMin={setMinSec}
                onMax={setMaxSec}
                onSearch={runSearch}
              />
            </RailSection>
          )}

          {session?.mediaSource === 'systemPath' && (
            <p className="mt-auto border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted/80">
              {t.systemMedia}
            </p>
          )}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {pendingVideo && tracks.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TrackChooser
                t={t}
                videoPath={pendingVideo}
                tracks={tracks}
                busy={busy}
                onTrack={(streamIndex) => openFromTrack(pendingVideo, streamIndex)}
                onFile={() => void acceptSubtitleFile(pendingVideo)}
              />
            </div>
          ) : session ? (
            <>
              <div className="shrink-0 pt-4">
                <TimelineStrip
                  t={t}
                  durationMs={session.durationMs}
                  candidates={candidates ?? []}
                  bounds={bounds}
                  rejected={rejected}
                  activeId={activeId}
                  onActive={setActiveId}
                />
              </div>

              {writtenOpen && results ? (
                <WrittenFiles t={t} results={results} onBack={() => setWrittenOpen(false)} />
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
                    {candidates === null ? (
                      <Centered title={t.idleTitle} body={t.idleBody} />
                    ) : candidates.length === 0 ? (
                      <Centered title={t.noMatch} body={t.noMatchHint} />
                    ) : (
                      <>
                        <div className="flex items-baseline justify-between gap-4 pb-2.5">
                          <h2 className="text-[12.5px] text-text/85">{t.found(visible.length)}</h2>
                          <span className="font-mono text-[11px] tabular-nums text-muted">
                            {timecode(keptDuration)}
                          </span>
                        </div>

                        <ul className="space-y-1.5">
                          {visible.map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              bounds={
                                bounds[candidate.id] ?? {
                                  startMs: candidate.startMs,
                                  endMs: candidate.endMs,
                                }
                              }
                              active={activeId === candidate.id}
                              lang={lang}
                              t={t}
                              onBounds={(startMs, endMs) =>
                                setBounds((current) => ({
                                  ...current,
                                  [candidate.id]: { startMs, endMs },
                                }))
                              }
                              onReset={() =>
                                setBounds((current) => {
                                  const next = { ...current };
                                  delete next[candidate.id];
                                  return next;
                                })
                              }
                              onReject={() => setRejected((current) => [...current, candidate.id])}
                              onPlayCue={playCue}
                              onActive={setActiveId}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {visible.length > 0 && (
                    <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-5 py-3">
                      <button
                        type="button"
                        onClick={runCut}
                        disabled={cutting}
                        className="rounded-[5px] bg-text px-3.5 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-40 active:translate-y-px"
                      >
                        {cutting ? t.cutting : t.cut}
                      </button>
                      <span className="font-mono text-[11.5px] tabular-nums text-muted">
                        {progress ? `${progress.percent}%` : timecode(keptDuration)}
                      </span>
                    </footer>
                  )}
                </>
              )}
            </>
          ) : (
            <StartPane t={t} />
          )}
        </main>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">{children}</span>
  );
}

function RailSection({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-2.5 border-t border-line pt-3.5">{children}</section>;
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full min-h-[220px] place-items-center px-8">
      <div className="flex max-w-[400px] flex-col gap-1.5 text-center">
        <p className="text-[13.5px] leading-relaxed">{title}</p>
        <p className="text-[12px] leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}

/* First run: what the app is, and the three things the user will do. */
function StartPane({ t }: { t: (typeof copy)['tr'] }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto px-8 py-10">
      <div className="w-full max-w-[420px]">
        <p className="text-[13.5px] leading-relaxed">{t.tagline}</p>

        <ol className="mt-5 border-b border-line">
          {t.startSteps.map((step, index) => (
            <li key={step.title} className="flex gap-3 border-t border-line py-2.5">
              <span className="pt-px font-mono text-[10.5px] tabular-nums text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[12.5px]">{step.title}</span>
                <span className="text-[11.5px] leading-relaxed text-muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function WrittenFiles({
  t,
  results,
  onBack,
}: {
  t: (typeof copy)['tr'];
  results: CutResult[];
  onBack: () => void;
}) {
  const ok = results.filter((result) => result.status === 'ok').length;
  const failed = results.length - ok;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-4 border-b border-line px-5 py-2">
        <SectionLabel>{t.written}</SectionLabel>
        <button
          type="button"
          onClick={onBack}
          className="text-[11.5px] text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
        >
          {t.backToCandidates}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <p className="text-[12.5px] text-muted">
          {failed > 0
            ? t.cutPartial(ok, failed)
            : results.length === 0
              ? t.cutNothing
              : t.cutDone(results.length)}
        </p>

        {results.length > 0 && (
          <p className="mt-1 flex gap-2 text-[11px] text-muted/70">
            <span className="shrink-0">{t.writtenTo}</span>
            <span className="truncate font-mono" title={folderOf(results[0].path)}>
              {folderOf(results[0].path)}
            </span>
          </p>
        )}

        <ul className="mt-2 divide-y divide-line">
          {results.map((result, position) => (
            <li
              key={`${result.path}-${position}`}
              className="grid grid-cols-[1fr_auto] items-baseline gap-3 py-2"
            >
              <span
                className="truncate font-mono text-[11.5px] text-text/85"
                title={result.path}
              >
                {result.status === 'ok' ? fileName(result.path) : result.message}
              </span>
              <span className="font-mono text-[11.5px] tabular-nums text-muted">
                {result.status === 'ok' ? timecode(result.durationMs) : t.failed}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
