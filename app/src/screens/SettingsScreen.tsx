import type { Mode } from '../api';
import ModelPanel from '../components/ModelPanel';
import type { copy } from '../i18n/copy';
import type { Appearance } from '../theme';

type Props = {
  t: (typeof copy)['tr'];
  appearance: Appearance;
  onAppearance: (next: Appearance) => void;
  mode: Mode;
  onMode: (next: Mode) => void;
  onError: (error: unknown) => void;
  /** Why the settings file could not be read at start-up, if it could not (006 FR-012). */
  loadError: string | null;
  /** Where the file is kept, when the machine gave a path. */
  path: string | null;
};

/**
 * Settings (feature 006): the choices about the application rather than the
 * open file. Closing them returns the window to the state it was in.
 */
export default function SettingsScreen(props: Props) {
  const { t, appearance } = props;
  const appearances: { value: Appearance; label: string }[] = [
    { value: 'system', label: t.appearanceSystem },
    { value: 'light', label: t.appearanceLight },
    { value: 'dark', label: t.appearanceDark },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex w-full max-w-[580px] flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-bold tracking-[-0.01em]">{t.settingsOpen}</h1>
          <p className="text-[15px] leading-relaxed text-muted">{t.settingsLead}</p>
        </div>

        <section className="flex flex-col gap-2.5 border-t border-line pt-4">
          <h2 className="text-[17px] font-semibold">{t.appearanceSection}</h2>
          <div role="group" aria-label={t.appearanceSection} className="inline-flex self-start overflow-hidden rounded-[6px] border border-edge">
            {appearances.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={appearance === option.value}
                onClick={() => props.onAppearance(option.value)}
                className={`px-3.5 py-1.5 text-[14px] not-first:border-l not-first:border-edge ${
                  appearance === option.value ? 'bg-text font-semibold text-surface' : 'bg-surface hover:bg-surface-2'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[14px] leading-relaxed text-muted">{t.appearanceHint}</p>
        </section>

        {props.loadError && (
          <section role="status" className="flex flex-col gap-1.5 rounded-[6px] border border-danger px-3.5 py-3 text-danger">
            <p className="text-[14px] leading-relaxed">{t.settingsUnreadable(props.loadError)}</p>
            {props.path && (
              <p className="text-[13px] break-all">
                {t.settingsFile}: <span className="selectable font-mono">{props.path}</span>
              </p>
            )}
          </section>
        )}

        <section className="flex flex-col gap-2.5 border-t border-line pt-4">
          <h2 className="text-[17px] font-semibold">{t.modelSection}</h2>
          <ModelPanel t={t} mode={props.mode} onMode={props.onMode} onError={props.onError} />
        </section>
      </div>
    </div>
  );
}
