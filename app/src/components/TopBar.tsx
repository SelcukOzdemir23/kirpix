import type { Mode, SessionInfo } from '../api';
import type { copy, Lang } from '../i18n/copy';
import Button from './Button';
import RecordingLine from './RecordingLine';

type Props = {
  t: (typeof copy)['tr'];
  lang: Lang;
  session: SessionInfo | null;
  mode: Mode;
  offsetMs: number;
  busy: boolean;
  settingsOpen: boolean;
  alignmentOpen?: boolean;
  onLang: (lang: Lang) => void;
  onSettings: () => void;
  /** Absent until the alignment panel exists: no control that does nothing. */
  onAlignment?: () => void;
  onChangeFile: () => void;
};

/**
 * The window's header: the name, the open recording, and the few controls that
 * are about the whole window rather than the current result.
 */
export default function TopBar(props: Props) {
  const { t, lang, session } = props;
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <span className="shrink-0 text-[17px] font-bold tracking-[-0.01em]">Kirpix</span>

      <div className="min-w-0 flex-1">
        {session ? (
          <RecordingLine t={t} session={session} mode={props.mode} offsetMs={props.offsetMs} />
        ) : (
          props.busy && <span className="text-muted">{t.opening}</span>
        )}
      </div>

      {session && (
        <>
          <Button kind="quiet" onClick={props.onChangeFile} disabled={props.busy}>
            {t.another}
          </Button>
          {props.onAlignment && (
            <Button onClick={props.onAlignment} selected={props.alignmentOpen}>
              {t.alignment}
            </Button>
          )}
        </>
      )}
      <Button onClick={props.onSettings} selected={props.settingsOpen}>
        {props.settingsOpen ? t.settingsClose : t.settingsOpen}
      </Button>
      <Button kind="quiet" onClick={() => props.onLang(lang === 'tr' ? 'en' : 'tr')}>
        {lang === 'tr' ? 'English' : 'Türkçe'}
      </Button>
    </header>
  );
}
