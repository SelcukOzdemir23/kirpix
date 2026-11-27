import { useEffect, useState } from 'react';
import { api, type Mode } from '../api';
import type { Lang } from '../i18n/copy';
import { readAppearance, saveAppearance, type Appearance } from '../theme';

/**
 * The choices that are about the application rather than the open file
 * (feature 006): language, appearance, and the engine that ranks candidates.
 *
 * The mode is read from the settings file on start, so the engine chosen
 * yesterday is the one that runs today. A failure to read or write it is
 * reported through `report`, never swallowed.
 */
export function useSettings(report: (error: unknown) => void) {
  const [lang, setLang] = useState<Lang>('tr');
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(() => readAppearance());
  const [mode, setMode] = useState<Mode>({ mode: 'heuristic' });

  useEffect(() => {
    void api
      .getSettings()
      .then((settings) => {
        setMode(settings.mode);
        setPath(settings.path);
        setLoadError(settings.loadError);
      })
      .catch((error) => {
        setMode({ mode: 'heuristic' });
        report(error);
      });
    // Read once, on start.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function chooseAppearance(next: Appearance) {
    setAppearance(next);
    saveAppearance(next);
  }

  /**
   * Store a new engine, then read the file back rather than trusting what was
   * sent: a write that failed half way is the case this exists for.
   */
  function chooseMode(next: Mode) {
    setMode(next);
    void api
      .setMode(next)
      .then(() => api.getSettings())
      .then((settings) => {
        setPath(settings.path);
        setLoadError(settings.loadError);
      })
      .catch(report);
  }

  return {
    lang,
    setLang,
    open,
    setOpen,
    path,
    loadError,
    appearance,
    chooseAppearance,
    mode,
    chooseMode,
  };
}
