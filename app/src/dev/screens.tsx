/*
  The fixture page (feature 007, research R6). Renders one screen state from
  the fixed data in `fixtures.ts`, without the backend, so every state can be
  looked at and screenshotted at a given size and appearance:

    /screens.html?state=tracks&lang=tr&theme=dark

  `npm run screens` serves it. It is a development tool and is not built into
  the application. Each screen registers here as it is written.
*/
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-mono/wght.css';
import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles.css';
import { copy, type Lang } from '../i18n/copy';
import TrackChooser from '../components/TrackChooser';
import StartScreen from '../screens/StartScreen';
import CriterionScreen from '../screens/CriterionScreen';
import TopBar from '../components/TopBar';
import ResultsScreen from '../screens/ResultsScreen';
import CriterionBar from '../components/CriterionBar';
import CandidateList from '../components/CandidateList';
import CandidateDetail from '../components/CandidateDetail';
import Ruler from '../components/Ruler';
import CutBar from '../components/CutBar';
import { edgesOf } from '../state/useSearch';
import * as fixture from './fixtures';

type Text = (typeof copy)['tr'];
const noop = () => {};

/** Every state the page can show. */
function results(t: Text, options: { dropped?: number[] } = {}) {
  const selected = fixture.candidates[0];
  const dropped = options.dropped ?? [fixture.candidates[3].id];
  const lines = fixture.cues.filter(
    (cue) => cue.index >= selected.startCue - 1 && cue.index <= selected.endCue + 1,
  );
  return (
    <ResultsScreen
      bar={
        <CriterionBar
          t={t}
          terms={fixture.terms.join(', ')}
          minSec={8}
          maxSec={120}
          searching={false}
          onTerms={noop}
          onSearch={noop}
        />
      }
      list={
        <CandidateList
          t={t}
          candidates={fixture.candidates}
          bounds={{}}
          dropped={dropped}
          selectedId={selected.id}
          reasons={null}
          badge={t.heuristicBadge}
          onSelect={noop}
          onToggleKeep={noop}
          footer={
            <CutBar
              t={t}
              kept={fixture.candidates.length - dropped.length}
              folder="/home/kullanici/Videolar/kirpix"
              cutting={false}
              progress={null}
              systemMedia={false}
              onChooseFolder={noop}
              onCut={noop}
            />
          }
        />
      }
      detail={
        <CandidateDetail
          t={t}
          candidate={selected}
          edges={edgesOf(selected, {})}
          lines={lines}
          preview={null}
          previewing={false}
          systemMedia={false}
          step="second"
          onStep={noop}
          onPreview={noop}
          onMove={noop}
          onReset={noop}
          onListen={noop}
        />
      }
      ruler={
        <Ruler
          t={t}
          durationMs={fixture.session.durationMs}
          candidates={fixture.candidates}
          bounds={{}}
          dropped={dropped}
          selectedId={selected.id}
          onSelect={noop}
        />
      }
    />
  );
}

export const states: Record<string, (t: Text) => ReactNode> = {
  results: (t) => results(t),
  criterion: (t) => (
    <CriterionScreen
      t={t}
      terms={fixture.terms.join(', ')}
      minSec={8}
      maxSec={120}
      searching={false}
      onTerms={noop}
      onMin={noop}
      onMax={noop}
      onSearch={noop}
    />
  ),
  start: (t) => <StartScreen t={t} dropReady busy={false} onPick={noop} />,
  tracks: (t) => (
    <TrackChooser
      t={t}
      videoPath={fixture.session.videoPath}
      tracks={fixture.tracks}
      busy={false}
      onTrack={noop}
      onFile={noop}
    />
  ),
};

const query = new URLSearchParams(window.location.search);
const lang = (query.get('lang') === 'en' ? 'en' : 'tr') as Lang;
const theme = query.get('theme');
if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
const name = query.get('state') ?? 'tracks';
const render = states[name];

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-ink text-text">
      {name !== 'start' && (
        <TopBar
          t={copy[lang]}
          lang={lang}
          session={fixture.session}
          mode={{ mode: 'heuristic' }}
          offsetMs={0}
          busy={false}
          settingsOpen={false}
          onLang={noop}
          onSettings={noop}
          onChangeFile={noop}
        />
      )}
      {render ? render(copy[lang]) : <p className="p-6">Unknown state: {name}</p>}
    </div>
  </React.StrictMode>,
);
