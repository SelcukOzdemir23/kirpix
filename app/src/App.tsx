import { useEffect, useState, type ReactNode } from 'react';
import { type CutResult, type Mode } from './api';
import { copy, errorMessage, type Lang } from './i18n/copy';
import { fileName, folderOf, timecode } from './format';
import CandidateCard from './components/CandidateCard';
import Button from './components/Button';
import ConfirmDialog from './components/ConfirmDialog';
import TopBar from './components/TopBar';
import StartScreen from './screens/StartScreen';
import CriteriaForm from './components/CriteriaForm';
import SectionLabel from './components/SectionLabel';
import SettingsView from './components/SettingsView';
import OffsetControls from './components/OffsetControls';
import TimelineStrip from './components/TimelineStrip';
import TrackChooser from './components/TrackChooser';
import { useDrop } from './state/useDrop';
import { useSession } from './state/useSession';
import { edgesOf, orderCandidates, parseTerms, useSearch } from './state/useSearch';
import { usePreview } from './state/usePreview';
import { useRanking } from './state/useRanking';
import { useCut } from './state/useCut';
import { useSettings } from './state/useSettings';

/*
  Two panes, the way a desktop tool reads: everything you set on the left, what
  came out of it on the right. The working pane keeps one subject at a time —
  choosing a subtitle track, the candidate list, or the files that were written.
*/

export default function App() {
  // Errors are kept as the backend sent them and worded at render time, so a
  // language switch rewords the message that is on screen.
  const [error, setError] = useState<unknown>(null);
  const settings = useSettings(setError);
  const { lang, setLang, mode } = settings;
  const t = copy[lang];
  const settingsOpen = settings.open;
  const setSettingsOpen = settings.setOpen;

  const {
    session,
    busy,
    pendingVideo,
    tracks,
    offsetMs,
    clampedCues,
    audioRef,
    pickVideo,
    chooseSubtitleFile,
    openFromTrack,
    acceptDropped,
    applyOffset,
    playCue,
  } = useSession(setError, clearResults);

  const search = useSearch(setError);
  const { terms, setTerms, minSec, setMinSec, maxSec, setMaxSec, searching } = search;
  const { candidates, bounds, rejected } = search;
  const activeId = search.selectedId;
  const setActiveId = search.select;
  const cut = useCut(setError);
  const { cutting, progress, results, writtenOpen, setWrittenOpen } = cut;
  const rankingState = useRanking(setError);
  const { plan, ranking } = rankingState;
  const previewState = usePreview(setError);
  const { preview } = previewState;

  function chooseMode(next: Mode) {
    settings.chooseMode(next);
    rankingState.reset();
  }

  const dropReady = useDrop((paths) => void acceptDropped(paths));

  // Escape dismisses whatever is on top. Today that is the error bar.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && error) {
        event.preventDefault();
        setError(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [error]);

  /** Everything measured on the cue times: a new recording or offset clears it. */
  function clearResults() {
    search.clear();
    cut.reset();
    previewState.reset();
  }

  async function runSearch() {
    const parsed = await search.run();
    if (!parsed) return;
    cut.reset();
    previewState.reset();
    if (!(await rankingState.propose(mode, parsed, minSec * 1000, maxSec * 1000))) {
      search.clear();
    }
  }

  /** Send the payload the dialog described, then order the list by the answer. */
  function sendToModel() {
    void rankingState.send(parseTerms(terms), minSec * 1000, maxSec * 1000);
  }

  function runCut() {
    void cut.run(visible.map((candidate) => edgesOf(candidate, bounds)));
  }

  const visible = orderCandidates(candidates, rejected, ranking);
  const keptDuration = visible.reduce((total, candidate) => {
    const current = bounds[candidate.id] ?? candidate;
    return total + (current.endMs - current.startMs);
  }, 0);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-ink text-text">
      <audio ref={audioRef} hidden />

      <TopBar
        t={t}
        lang={lang}
        session={session}
        mode={mode}
        offsetMs={offsetMs}
        busy={busy}
        settingsOpen={settingsOpen}
        onLang={setLang}
        onSettings={() => setSettingsOpen((open) => !open)}
        onChangeFile={() => void pickVideo()}
      />

      {error != null && (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-3 border-b border-danger/30 bg-danger/10 px-5 py-2.5"
        >
          <p className="flex-1 text-[14px] leading-relaxed text-danger">
            {errorMessage(error, lang)}
          </p>
          <button
            type="button"
            aria-label={t.dismiss}
            onClick={() => setError(null)}
            className="rounded-[4px] border border-danger/30 px-1.5 text-[16px] leading-5 text-danger/70 transition-colors hover:border-danger/60 hover:text-danger"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-line bg-surface/25">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 pb-4">
            <section className="flex flex-col gap-2.5">
              <SectionLabel>{t.sourceSection}</SectionLabel>

              {session || pendingVideo ? (
                <>
                  <span
                    className="truncate text-[15px] font-medium"
                    title={session?.videoPath ?? pendingVideo ?? ''}
                  >
                    {fileName(session?.videoPath ?? pendingVideo ?? '')}
                  </span>

                  {session ? (
                    <>
                      <div className="flex items-baseline gap-2 text-[13.5px] text-muted">
                        <span className="font-mono tabular-nums">{timecode(session.durationMs)}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {session.cueCount} {t.cues.toLowerCase()}
                        </span>
                        <span className="ml-auto font-mono text-[12px] text-muted/70 uppercase">
                          {session.encoding}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted" title={session.subtitleLabel}>
                          {session.subtitleLabel}
                        </span>
                        {session.subtitleSource === 'embedded' && (
                          <span className="shrink-0 rounded-[4px] border border-line px-1.5 py-0.5 text-[12px] text-muted">
                            {t.embedded}
                          </span>
                        )}
                      </div>
                    </>
                  ) : null}

                  <Button kind="quiet" onClick={pickVideo} disabled={busy} className="self-start">
                    {t.another}
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={pickVideo}
                  disabled={busy}
                  className="flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-text/20 px-3 py-4 text-center transition-colors hover:border-accent/50 hover:bg-surface-2/60 disabled:opacity-50"
                >
                  <span className="text-[14.5px]">{dropReady ? t.dropHere : busy ? t.opening : t.pick}</span>
                  {dropReady && !busy && <span className="text-[13px] text-muted">{t.dropOrPick}</span>}
                </button>
              )}
            </section>

            {session && (
              <div className="flex items-baseline gap-2 text-[13.5px]">
                <span className="shrink-0 font-mono text-[12px] tracking-[0.13em] text-muted uppercase">
                  {t.engineSection}
                </span>
                <span className="min-w-0 flex-1 truncate text-right" title={engineTitle(mode)}>
                  {engineLabel(mode, t)}
                </span>
              </div>
            )}

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

            {session?.mediaSource === 'systemPath' && (
              <p className="mt-auto border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted/80">
                {t.systemMedia}
              </p>
            )}
          </div>

          {/* The action stays reachable however short the window is. */}
          {session && (
            <div className="shrink-0 border-t border-line bg-ink px-5 pt-4 pb-5">
              <SectionLabel>{t.searchSection}</SectionLabel>
              <div className="mt-2.5">
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
              </div>
            </div>
          )}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {settingsOpen ? (
            <SettingsView
              t={t}
              appearance={settings.appearance}
              onAppearance={settings.chooseAppearance}
              mode={mode}
              onMode={chooseMode}
              onError={setError}
              loadError={settings.loadError}
              path={settings.path}
            />
          ) : pendingVideo && tracks.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TrackChooser
                t={t}
                videoPath={pendingVideo}
                tracks={tracks}
                busy={busy}
                onTrack={(streamIndex) => openFromTrack(pendingVideo, streamIndex)}
                onFile={() => void chooseSubtitleFile(pendingVideo)}
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
                        <div className="flex items-baseline justify-between gap-4 pb-3">
                          <h2 className="flex items-baseline gap-2 text-[14.5px] text-text/90">
                            {t.found(visible.length)}
                            <span className="font-mono text-[12px] text-muted">
                              {mode.mode === 'heuristic'
                                ? t.heuristicBadge
                                : ranking
                                  ? t.rankedBy(modeLabel(mode))
                                  : modeLabel(mode)}
                            </span>
                          </h2>
                          <span className="font-mono text-[13.5px] tabular-nums text-muted">
                            {timecode(keptDuration)}
                          </span>
                        </div>

                        <ul className="space-y-2">
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
                              reason={ranking?.reasons[candidate.id] ?? null}
                              preview={
                                preview?.candidateId === candidate.id ? preview : null
                              }
                              previewing={previewState.pendingId === candidate.id}
                              lang={lang}
                              t={t}
                              onBounds={(startMs, endMs) => {
                                // The player would be showing the range the row
                                // no longer names.
                                previewState.reset();
                                search.moveEdges(candidate.id, startMs, endMs);
                              }}
                              onReset={() => search.resetEdges(candidate.id)}
                              onReject={() => search.reject(candidate.id)}
                              onPlayCue={playCue}
                              onActive={setActiveId}
                              onPreview={() => void previewState.toggle(candidate.id, edgesOf(candidate, bounds))}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {visible.length > 0 && (
                    <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-5 py-3.5">
                      <Button kind="primary" onClick={runCut} disabled={cutting}>
                        {cutting ? t.cutting : t.cut}
                      </Button>
                      <span className="font-mono text-[13.5px] tabular-nums text-muted">
                        {progress ? `${progress.percent}%` : timecode(keptDuration)}
                      </span>
                    </footer>
                  )}
                </>
              )}
            </>
          ) : (
            <StartScreen t={t} dropReady={dropReady} busy={busy} onPick={() => void pickVideo()} />
          )}
        </main>
      </div>

      {plan && (
        <ConfirmDialog
          t={t}
          plan={plan}
          onCancel={rankingState.cancel}
          onSend={sendToModel}
        />
      )}

      {rankingState.busy && (
        <span className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-[6px] border border-line bg-surface px-3 py-1.5 font-mono text-[12.5px] text-muted">
          {t.ranking}
        </span>
      )}
    </div>
  );
}

/** The rail's one line: which engine the next search will use. */
function engineLabel(mode: Mode, t: (typeof copy)['tr']): string {
  if (mode.mode === 'local') return `${t.modeLocal} · ${mode.model || mode.address}`;
  if (mode.mode === 'cloud') return `${t.modeCloud} · ${mode.model}`;
  return t.modeHeuristic;
}

/** The same line, widened for the tooltip when the rail has to truncate it. */
function engineTitle(mode: Mode): string {
  if (mode.mode === 'local') return `${mode.address}${mode.model ? ` · ${mode.model}` : ''}`;
  if (mode.mode === 'cloud') return `${mode.provider} · ${mode.model}`;
  return '';
}

/** The name the badge shows for a mode: the model, not the transport. */
function modeLabel(mode: Mode): string {
  if (mode.mode === 'local') return mode.model || mode.address;
  if (mode.mode === 'cloud') return mode.model;
  return '';
}

function RailSection({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-3 border-t border-line pt-4">{children}</section>;
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full min-h-[240px] place-items-center px-8">
      <div className="flex max-w-[420px] flex-col gap-2 text-center">
        <p className="text-[16px] leading-relaxed">{title}</p>
        <p className="text-[14px] leading-relaxed text-muted">{body}</p>
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
      <div className="flex shrink-0 items-baseline justify-between gap-4 border-b border-line px-5 py-2.5">
        <SectionLabel>{t.written}</SectionLabel>
        <button
          type="button"
          onClick={onBack}
          className="text-[13.5px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-text"
        >
          {t.backToCandidates}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
        <p className="text-[14px] text-muted">
          {failed > 0
            ? t.cutPartial(ok, failed)
            : results.length === 0
              ? t.cutNothing
              : t.cutDone(results.length)}
        </p>

        {results.length > 0 && (
          <p className="mt-1.5 flex gap-2 text-[13px] text-muted/75">
            <span className="shrink-0">{t.writtenTo}</span>
            <span className="truncate font-mono" title={folderOf(results[0].path)}>
              {folderOf(results[0].path)}
            </span>
          </p>
        )}

        <ul className="mt-3 divide-y divide-line">
          {results.map((result, position) => (
            <li
              key={`${result.path}-${position}`}
              className="grid grid-cols-[1fr_auto] items-baseline gap-3 py-2.5"
            >
              <span
                className="truncate font-mono text-[14px] text-text/90 selectable"
                title={result.path}
              >
                {result.status === 'ok' ? fileName(result.path) : result.message}
              </span>
              <span className="font-mono text-[13.5px] tabular-nums text-muted">
                {result.status === 'ok' ? timecode(result.durationMs) : t.failed}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
