/*
  The appearance setting, and the only place that writes it.

  It lives in the interface rather than in the backend because it changes
  nothing but which set of CSS variables is in force: `styles.css` already
  answers the system scheme on its own, and an explicit choice is one attribute
  on `<html>`. Keeping it here means it is applied synchronously at start-up,
  before the first paint, so an explicitly dark window never shows a light
  frame while it opens.
*/

export type Appearance = 'system' | 'light' | 'dark';

const KEY = 'kirpix.appearance';

/** What the person chose last time, or the system, which is the default. */
export function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    // A webview with storage disabled is not a reason to fail to paint.
    return 'system';
  }
}

/** Put a choice into effect. `system` is the absence of the attribute. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  if (appearance === 'system') delete root.dataset.theme;
  else root.dataset.theme = appearance;
}

/** Remember a choice and put it into effect. */
export function saveAppearance(appearance: Appearance): void {
  applyAppearance(appearance);
  try {
    localStorage.setItem(KEY, appearance);
  } catch {
    // The choice still holds for this session; losing it at exit is the same
    // degradation as a first run, and the screen still shows what is in force.
  }
}
