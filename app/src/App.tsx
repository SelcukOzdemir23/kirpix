import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

type SessionInfo = {
  videoPath: string;
  subtitlePath: string;
  durationMs: number;
  cueCount: number;
  encoding: string;
  width: number | null;
  height: number | null;
  hasAudio: boolean;
  mediaSource: string;
};

type ErrorPayload = {
  kind: string;
  path?: string;
  reason?: string;
  name?: string;
  tail?: string;
};

function errorText(payload: unknown): string {
  const error = payload as ErrorPayload;
  switch (error?.kind) {
    case 'ffmpegMissing':
      return `Medya araçları bulunamadı (${error.name}). Uygulamayı yeniden kurmak gerekiyor.`;
    case 'mediaUnreadable':
      return `${error.path} okunamadı: ${error.reason}`;
    case 'mediaProbeFailed':
      return `${error.path} bir video olarak tanınmadı: ${error.tail}`;
    case 'subtitleUnreadable':
      return `${error.path} altyazı olarak okunamadı: ${error.reason}`;
    case 'subtitleEmpty':
      return `${error.path} içinde kullanılabilir altyazı satırı yok.`;
    case 'noSession':
      return 'Önce bir video ve altyazı seç.';
    default:
      return 'Beklenmeyen bir hata oluştu.';
  }
}

function timecode(ms: number): string {
  const total = Math.round(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] ?? path;
}

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickVideo() {
    setError(null);
    const picked = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'webm'] }],
    });
    if (typeof picked !== 'string') return;

    const pickedSubs = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Altyazı', extensions: ['srt', 'vtt'] }],
    });
    if (typeof pickedSubs !== 'string') return;

    setBusy(true);
    try {
      const info = await invoke<SessionInfo>('open_session', {
        videoPath: picked,
        subtitlePath: pickedSubs,
      });
      setSession(info);
    } catch (err) {
      setSession(null);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[620px] flex-col justify-center gap-6 px-8 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.035em]">Kirpix</h1>
        <p className="text-[14px] leading-relaxed text-muted">
          Uzun bir videodan istediğin kesiti bulur, senin makinende keser.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-[13.5px] leading-relaxed text-red-200"
        >
          {error}
        </p>
      )}

      {session ? (
        <section className="rounded-lg border border-line bg-surface p-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13.5px]">
            <dt className="text-muted">Video</dt>
            <dd className="truncate" title={session.videoPath}>{fileName(session.videoPath)}</dd>
            <dt className="text-muted">Altyazı</dt>
            <dd className="truncate" title={session.subtitlePath}>{fileName(session.subtitlePath)}</dd>
            <dt className="text-muted">Süre</dt>
            <dd className="tabular-nums">{timecode(session.durationMs)}</dd>
            <dt className="text-muted">Satır</dt>
            <dd className="tabular-nums">{session.cueCount}</dd>
            <dt className="text-muted">Kodlama</dt>
            <dd>{session.encoding}</dd>
          </dl>

          {session.mediaSource === 'systemPath' && (
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
              Medya araçları uygulamayla birlikte gelmedi, bu makinedeki FFmpeg kullanılıyor.
              Paketlenmiş sürümde bu satır kaybolur.
            </p>
          )}

          <button
            type="button"
            onClick={pickVideo}
            className="mt-5 rounded-lg border border-line px-4 py-2 text-[13.5px] text-text/90 transition-colors hover:border-white/25 hover:bg-surface/60 active:translate-y-px"
          >
            Başka bir dosya seç
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={pickVideo}
          disabled={busy}
          className="rounded-lg bg-text px-5 py-3 text-[14px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-60 active:translate-y-px"
        >
          {busy ? 'Açılıyor…' : 'Video ve altyazı seç'}
        </button>
      )}
    </main>
  );
}
