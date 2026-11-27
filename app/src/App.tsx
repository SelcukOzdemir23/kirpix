import { useState } from 'react';
import { type Candidate, type Mode } from './api';
import { copy } from './i18n/copy';
import Button from './components/Button';
import ConfirmDialog from './components/ConfirmDialog';
import TopBar from './components/TopBar';
import ErrorBar from './components/ErrorBar';
import NoMatch from './components/NoMatch';
import { resultBadge } from './components/RecordingLine';
import AlignmentPanel from './components/AlignmentPanel';
import StartScreen from './screens/StartScreen';
import CriterionScreen from './screens/CriterionScreen';
import ResultsScreen from './screens/ResultsScreen';
import CandidateDetail from './components/CandidateDetail';
import CandidateList from './components/CandidateList';
import CriterionBar from './components/CriterionBar';
import Ruler from './components/Ruler';
import CutBar from './components/CutBar';
import CutStrip from './components/CutStrip';
import { stepEdge, type Edge, type Step } from './state/edges';
import SettingsScreen from './screens/SettingsScreen';
import TrackScreen from './screens/TrackScreen';
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
  const [step, setStep] = useState<Step>('second');
  const [alignmentOpen, setAlignmentOpen] = useState(false);
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
  const listed = orderCandidates(candidates, [], ranking);
  const selected = listed.find((candidate) => candidate.id === activeId) ?? null;

  function moveEdge(candidate: Candidate, edge: Edge, direction: -1 | 1) {
    const next = stepEdge(edgesOf(candidate, bounds), edge, direction, step, search.lines ?? []);
    // The player would be showing a range the row no longer names.
    previewState.reset();
    search.moveEdges(candidate.id, next.startMs, next.endMs);
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-ink text-text">
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
        alignmentOpen={alignmentOpen}
        onAlignment={() => setAlignmentOpen((open) => !open)}
      />

      {session && alignmentOpen && (
        <AlignmentPanel
          t={t}
          session={session}
          offsetMs={offsetMs}
          clampedCues={clampedCues}
          hasResults={candidates !== null}
          onChange={(next) => void applyOffset(next)}
          onClose={() => setAlignmentOpen(false)}
        />
      )}

      {error != null && <ErrorBar t={t} lang={lang} error={error} onDismiss={() => setError(null)} />}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {settingsOpen ? (
          <SettingsScreen
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
          <TrackScreen
            t={t}
            videoPath={pendingVideo}
            tracks={tracks}
            busy={busy}
            onTrack={(streamIndex) => openFromTrack(pendingVideo, streamIndex)}
            onFile={() => void chooseSubtitleFile(pendingVideo)}
          />
        ) : session ? (
          candidates === null ? (
            <CriterionScreen
              t={t}
              terms={terms}
              minSec={minSec}
              maxSec={maxSec}
              searching={searching}
              onTerms={setTerms}
              onMin={setMinSec}
              onMax={setMaxSec}
              onSearch={() => void runSearch()}
            />
          ) : (
            <ResultsScreen
              strip={
                writtenOpen &&
                results && <CutStrip t={t} results={results} onClose={() => setWrittenOpen(false)} />
              }
              bar={
                <CriterionBar
                  t={t}
                  terms={terms}
                  minSec={minSec}
                  maxSec={maxSec}
                  searching={searching}
                  onTerms={setTerms}
                  onMin={setMinSec}
                  onMax={setMaxSec}
                  onSearch={() => void runSearch()}
                />
              }
              list={
                candidates.length === 0 ? (
                  <NoMatch t={t} />
                ) : (
                  <CandidateList
                    t={t}
                    candidates={listed}
                    bounds={bounds}
                    dropped={rejected}
                    selectedId={activeId}
                    reasons={ranking?.reasons ?? null}
                    badge={resultBadge(mode, ranking !== null, t)}
                    onSelect={setActiveId}
                    onToggleKeep={search.toggleKeep}
                    footer={
                      <CutBar
                        t={t}
                        kept={visible.length}
                        folder={cut.folder}
                        cutting={cutting}
                        progress={progress}
                        systemMedia={session.mediaSource === 'systemPath'}
                        onChooseFolder={() => void cut.chooseFolder()}
                        onCut={runCut}
                      />
                    }
                  />
                )
              }
              detail={
                selected && (
                  <CandidateDetail
                    t={t}
                    candidate={selected}
                    edges={edgesOf(selected, bounds)}
                    lines={search.lines}
                    preview={preview?.candidateId === selected.id ? preview : null}
                    previewing={previewState.pendingId === selected.id}
                    systemMedia={session.mediaSource === 'systemPath'}
                    step={step}
                    onStep={setStep}
                    onPreview={() => void previewState.toggle(selected.id, edgesOf(selected, bounds))}
                    onMove={(edge, direction) => moveEdge(selected, edge, direction)}
                    onReset={() => {
                      previewState.reset();
                      search.resetEdges(selected.id);
                    }}
                    onListen={(cueIndex) => void playCue(cueIndex)}
                  />
                )
              }
              ruler={
                <Ruler
                  t={t}
                  durationMs={session.durationMs}
                  candidates={listed}
                  bounds={bounds}
                  dropped={rejected}
                  selectedId={activeId}
                  onSelect={setActiveId}
                />
              }
            />
          )
        ) : (
          <StartScreen t={t} dropReady={dropReady} busy={busy} onPick={() => void pickVideo()} />
        )}
      </main>

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

/** The name the badge shows for a mode: the model, not the transport. */
