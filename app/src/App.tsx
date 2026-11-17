import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { api, type Candidate, type CutResult, type SessionInfo } from './api';
import { copy, errorMessage, type Lang } from './i18n/copy';
import { fileName, timecode } from './format';
import CandidateCard from './components/CandidateCard';
import CriteriaForm from './components/CriteriaForm';

type Bounds = { startMs: number; endMs: number };

export default function App() {
  const [lang, setLang] = useState<Lang>('tr');
  const t = copy[lang];

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [terms, setTerms] = useState('');
  const [minSec, setMinSec] = useState(8);
  const [maxSec, setMaxSec] = useState(120);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [bounds, setBounds] = useState<Record<number, Bounds>>({});
  const [rejected, setRejected] = useState<number[]>([]);
  const [cutting, setCutting] = useState(false);
  const [progress, setProgress] = useState<{ index: number; percent: number } | null>(null);
  const [results, setResults] = useState<CutResult[] | null>(null);

  async function pickFiles() {
    setError(null);
    const video = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'webm'] }],
    });
    if (typeof video !== 'string') return;

    const subtitle = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Subtitles', extensions: ['srt', 'vtt'] }],
    });
    if (typeof subtitle !== 'string') return;

    setBusy(true);
    try {
      const info = await api.openSession(video, subtitle);
      setSession(info);
      setCandidates(null);
      setBounds({});
      setRejected([]);
    } catch (err) {
      setSession(null);
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    const parsed = terms
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean);
    setError(null);
    setSearching(true);
    try {
      const found = await api.searchTopic(parsed, minSec * 1000, maxSec * 1000);
      setCandidates(found);
      setBounds({});
      setRejected([]);
      setResults(null);
    } catch (err) {
      setCandidates(null);
      setError(errorMessage(err, lang));
    } finally {
      setSearching(false);
    }
  }

  async function runCut() {
    const folder = await open({ directory: true, multiple: false });
    if (typeof folder !== 'string') return;

    const clips = visible.map((candidate) => {
      const current = bounds[candidate.id] ?? candidate;
      return { startMs: current.startMs, endMs: current.endMs };
    });

    setError(null);
    setCutting(true);
    setResults(null);
    setProgress(null);

    const stopListening = await listen<{ index: number; percent: number }>('cut-progress', (event) => {
      setProgress(event.payload);
    });

    try {
      setResults(await api.cutClips(clips, folder));
    } catch (err) {
      setError(errorMessage(err, lang));
    } finally {
      stopListening();
      setProgress(null);
      setCutting(false);
    }
  }

  const visible = (candidates ?? []).filter((candidate) => !rejected.includes(candidate.id));
  const keptDuration = visible.reduce((total, candidate) => {
    const current = bounds[candidate.id] ?? candidate;
    return total + (current.endMs - current.startMs);
  }, 0);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col gap-6 px-8 py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.035em]">Kirpix</h1>
          <p className="text-[13.5px] leading-relaxed text-muted">{t.tagline}</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-line p-0.5">
          {(['tr', 'en'] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                lang === code ? 'bg-surface text-text' : 'text-muted hover:text-text'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-[13px] leading-relaxed text-red-200"
        >
          {error}
        </p>
      )}

      {session ? (
        <section className="rounded-lg border border-line bg-surface px-4 py-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-muted">{t.video}</dt>
            <dd className="truncate" title={session.videoPath}>{fileName(session.videoPath)}</dd>
            <dt className="text-muted">{t.subtitle}</dt>
            <dd className="truncate" title={session.subtitlePath}>{fileName(session.subtitlePath)}</dd>
            <dt className="text-muted">{t.duration}</dt>
            <dd className="font-mono tabular-nums">{timecode(session.durationMs)}</dd>
            <dt className="text-muted">{t.cues}</dt>
            <dd className="font-mono tabular-nums">{session.cueCount}</dd>
            <dt className="text-muted">{t.encoding}</dt>
            <dd>{session.encoding}</dd>
          </dl>

          {session.mediaSource === 'systemPath' && (
            <p className="mt-3 border-t border-line pt-2.5 text-[12px] leading-relaxed text-muted">
              {t.systemMedia}
            </p>
          )}

          <button
            type="button"
            onClick={pickFiles}
            className="mt-3 rounded border border-line px-3 py-1.5 text-[12.5px] text-text/85 transition-colors hover:border-white/25 hover:bg-surface/60"
          >
            {t.another}
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={pickFiles}
          disabled={busy}
          className="rounded-lg bg-text px-5 py-3 text-[14px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-60 active:translate-y-px"
        >
          {busy ? t.opening : t.pick}
        </button>
      )}

      {session && (
        <section className="rounded-lg border border-line bg-surface p-4">
          <CriteriaForm
            t={t}
            terms={terms}
            minSec={minSec}
            maxSec={maxSec}
            searching={searching}
            onTerms={setTerms}
            onMin={setMinSec}
            onMax={setMaxSec}
            onSearch={runSearch}
          />
        </section>
      )}

      {candidates !== null && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[13px] text-muted">
              {candidates.length === 0 ? t.noMatch : t.found(visible.length)}
            </h2>
            {visible.length > 0 && (
              <span className="font-mono text-[12px] tabular-nums text-muted">
                {timecode(keptDuration)}
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-2">
            {visible.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                bounds={bounds[candidate.id] ?? { startMs: candidate.startMs, endMs: candidate.endMs }}
                lang={lang}
                t={t}
                onBounds={(startMs, endMs) =>
                  setBounds((current) => ({ ...current, [candidate.id]: { startMs, endMs } }))
                }
                onReset={() =>
                  setBounds((current) => {
                    const next = { ...current };
                    delete next[candidate.id];
                    return next;
                  })
                }
                onReject={() => setRejected((current) => [...current, candidate.id])}
              />
            ))}
          </ul>

          {visible.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={runCut}
                disabled={cutting}
                className="rounded-lg bg-text px-4 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-white disabled:opacity-40 active:translate-y-px"
              >
                {cutting ? t.cutting : t.cut}
              </button>
              {progress && (
                <span className="font-mono text-[12px] tabular-nums text-muted">
                  {progress.percent}%
                </span>
              )}
            </div>
          )}

          {results && (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
              <p className="text-[13px] text-muted">
                {results.some((result) => result.status === 'failed')
                  ? t.cutPartial(
                      results.filter((result) => result.status === 'ok').length,
                      results.filter((result) => result.status === 'failed').length,
                    )
                  : results.length === 0
                    ? t.cutNothing
                    : t.cutDone(results.length)}
              </p>
              <ul className="flex flex-col gap-1.5">
                {results.map((result, position) => (
                  <li key={position} className="grid grid-cols-[1fr_auto] gap-x-3 text-[12.5px]">
                    <span className="truncate text-text/85" title={result.path}>
                      {result.status === 'ok' ? fileName(result.path) : result.message}
                    </span>
                    <span className="font-mono tabular-nums text-muted">
                      {result.status === 'ok' ? timecode(result.durationMs) : t.failed}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
