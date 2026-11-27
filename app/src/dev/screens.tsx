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
import * as fixture from './fixtures';

type Text = (typeof copy)['tr'];
const noop = () => {};

/** Every state the page can show. */
export const states: Record<string, (t: Text) => ReactNode> = {
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
      {render ? render(copy[lang]) : <p className="p-6">Unknown state: {name}</p>}
    </div>
  </React.StrictMode>,
);
