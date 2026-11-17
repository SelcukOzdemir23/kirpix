import type { Mode } from '../api';
import type { copy } from '../i18n/copy';
import type { Appearance } from '../theme';
import ModelPanel from './ModelPanel';
import SectionLabel from './SectionLabel';

type Props = {
  t: (typeof copy)['tr'];
  appearance: Appearance;
  onAppearance: (next: Appearance) => void;
  mode: Mode;
  onMode: (next: Mode) => void;
  onError: (error: unknown) => void;
  /** Why the settings file could not be read at start-up, if it could not. */
  loadError: string | null;
  /** Where the file is kept, when the machine gave a path. */
  path: string | null;
};

/**
 * The settings place: the working pane's fourth state, beside empty, tracks and
 * results. It holds the choices that are about the application rather than about
 * the file in the rail, which is why the rail stays where it is while this is
 * open: the criteria must still be reachable.
 */
export default function SettingsView({
  t,
  appearance,
  onAppearance,
  mode,
  onMode,
  onError,
  loadError,
  path,
}: Props) {
  const appearances: { value: Appearance; label: string }[] = [
    { value: 'system', label: t.appearanceSystem },
    { value: 'light', label: t.appearanceLight },
    { value: 'dark', label: t.appearanceDark },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[21px] font-medium tracking-[-0.01em]">{t.settingsOpen}</h2>
          <p className="text-[14px] leading-relaxed text-muted">{t.settingsLead}</p>
        </div>

        <section className="flex flex-col gap-2.5 border-t border-line pt-4">
          <SectionLabel>{t.appearanceSection}</SectionLabel>

          <div
            role="group"
            aria-label={t.appearanceSection}
            className="flex self-start rounded-[6px] border border-line p-0.5"
          >
            {appearances.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={appearance === option.value}
                onClick={() => onAppearance(option.value)}
                className={`rounded-[5px] px-3 py-1.5 text-[13.5px] transition-colors ${
                  appearance === option.value
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2/60 hover:text-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="text-[13.5px] leading-relaxed text-muted">{t.appearanceHint}</p>
        </section>

        {loadError && (
          <section
            role="status"
            className="flex flex-col gap-1.5 rounded-[6px] border border-danger/30 bg-danger/10 px-3.5 py-3"
          >
            <p className="text-[13.5px] leading-relaxed text-danger">
              {t.settingsUnreadable(loadError)}
            </p>
            {path && (
              <p className="font-mono text-[12px] break-all text-danger/80">
                <span className="uppercase tracking-[0.1em] opacity-70">{t.settingsFile}</span>{' '}
                {path}
              </p>
            )}
          </section>
        )}

        <section className="flex flex-col gap-2.5 border-t border-line pt-4">
          <SectionLabel>{t.modelSection}</SectionLabel>
          <ModelPanel t={t} mode={mode} onMode={onMode} onError={onError} />
        </section>
      </div>
    </div>
  );
}
