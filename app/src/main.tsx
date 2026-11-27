import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-mono/wght.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyAppearance, readAppearance } from './theme';

// Before React renders: the appearance is one attribute on <html>, so a stored
// choice is in force on the first frame rather than one command later.
applyAppearance(readAppearance());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
