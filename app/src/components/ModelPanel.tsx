import { useEffect, useState } from 'react';
import { api, type CloudProvider, type Mode } from '../api';
import type { copy } from '../i18n/copy';

const PROVIDER: CloudProvider = 'deepSeek';
const DEFAULT_ADDRESS = 'http://127.0.0.1:11434/v1';
const DEFAULT_MODEL = 'deepseek-chat';

type Props = {
  t: (typeof copy)['tr'];
  mode: Mode;
  onMode: (mode: Mode) => void;
  onError: (error: unknown) => void;
};

/**
 * Which model, if any. Heuristic is the default and asks nothing of anybody; the
 * other two modes are things a person sets up on purpose, and the interface says
 * what each one will do before it does it.
 */
export default function ModelPanel({ t, mode, onMode, onError }: Props) {
  const [models, setModels] = useState<string[] | null>(null);
  const [finding, setFinding] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);

  const address = mode.mode === 'local' ? mode.address : '';
  const localModel = mode.mode === 'local' ? mode.model : '';
  const cloudModel = mode.mode === 'cloud' ? mode.model : DEFAULT_MODEL;

  useEffect(() => {
    void api
      .hasKey(PROVIDER)
      .then(setHasKey)
      .catch(() => setHasKey(false));
  }, []);

  const field =
    'w-full rounded-[6px] border border-edge bg-surface px-2.5 py-1.5 text-[15px] text-text placeholder:text-muted focus-visible:border-accent';

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 text-[14px] not-first:border-l not-first:border-edge ${
      active ? 'bg-text font-semibold text-surface' : 'bg-surface hover:bg-surface-2'
    }`;

  async function find() {
    setFinding(true);
    setModels(null);
    try {
      const found = await api.listModels(address);
      setModels(found);
    } catch (error) {
      onError(error);
    } finally {
      setFinding(false);
    }
  }

  async function saveKey() {
    if (keyInput.trim() === '') return;
    setBusy(true);
    try {
      await api.setKey(PROVIDER, keyInput.trim());
      setKeyInput('');
      setHasKey(true);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }

  async function clearKey() {
    setBusy(true);
    try {
      await api.clearKey(PROVIDER);
      setHasKey(false);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="inline-flex self-start overflow-hidden rounded-[6px] border border-edge">
        <button
          type="button"
          aria-pressed={mode.mode === 'heuristic'}
          className={chip(mode.mode === 'heuristic')}
          onClick={() => onMode({ mode: 'heuristic' })}
        >
          {t.modeHeuristic}
        </button>
        <button
          type="button"
          aria-pressed={mode.mode === 'local'}
          className={chip(mode.mode === 'local')}
          onClick={() =>
            onMode({
              mode: 'local',
              address: address || DEFAULT_ADDRESS,
              model: localModel,
            })
          }
        >
          {t.modeLocal}
        </button>
        <button
          type="button"
          aria-pressed={mode.mode === 'cloud'}
          className={chip(mode.mode === 'cloud')}
          onClick={() => onMode({ mode: 'cloud', provider: PROVIDER, model: cloudModel })}
        >
          {t.modeCloud}
        </button>
      </div>

      {mode.mode === 'heuristic' && (
        <p className="text-[14px] leading-relaxed text-muted">{t.modeHint}</p>
      )}

      {mode.mode === 'local' && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13.5px] text-muted">{t.modelAddress}</span>
            <input
              value={address}
              onChange={(event) =>
                onMode({ mode: 'local', address: event.target.value, model: localModel })
              }
              className={field}
              spellCheck={false}
            />
          </label>

          <button
            type="button"
            onClick={() => void find()}
            disabled={finding}
            className="self-start rounded-[6px] border border-edge bg-surface px-3 py-1.5 text-[14px] text-text hover:bg-surface-2 disabled:opacity-45"
          >
            {finding ? t.opening : t.findModels}
          </button>

          {models !== null && (
            <p className="text-[13.5px] text-muted">
              {models.length === 0 ? t.noModels : t.modelsFound(models.length)}
            </p>
          )}

          {models !== null && models.length > 0 && (
            <ul className="flex max-h-[132px] flex-col gap-0.5 overflow-y-auto rounded-[6px] border border-edge p-0.5">
              {models.map((model) => (
                <li key={model}>
                  <button
                    type="button"
                    onClick={() => onMode({ mode: 'local', address, model })}
                    aria-pressed={localModel === model}
                    className={`w-full truncate rounded-[4px] px-2 py-1 text-left text-[14px] hover:bg-surface-2 ${
                      localModel === model ? 'text-accent' : 'text-text/80'
                    }`}
                    title={model}
                  >
                    {model}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13.5px] text-muted">{t.modelName}</span>
            <input
              value={localModel}
              onChange={(event) =>
                onMode({ mode: 'local', address, model: event.target.value })
              }
              className={field}
              spellCheck={false}
              placeholder={models?.[0] ?? ''}
            />
          </label>
        </>
      )}

      {mode.mode === 'cloud' && (
        <>
          <p className="flex items-baseline justify-between gap-2 text-[13.5px] text-muted">
            <span>{t.modelProvider}</span>
            <span className="text-text">DeepSeek</span>
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13.5px] text-muted">{t.modelName}</span>
            <input
              value={cloudModel}
              onChange={(event) =>
                onMode({ mode: 'cloud', provider: PROVIDER, model: event.target.value })
              }
              className={field}
              spellCheck={false}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-2 text-[13.5px] text-muted">
              {t.modelKey}
              <span className={hasKey ? 'text-accent' : 'text-muted/70'}>
                {hasKey ? t.keyStored : t.keyMissing}
              </span>
            </span>
            <input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              className={field}
              spellCheck={false}
              autoComplete="off"
            />
          </label>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => void saveKey()}
              disabled={busy || keyInput.trim() === ''}
              className="rounded-[6px] border border-edge bg-surface px-3 py-1.5 text-[14px] text-text hover:bg-surface-2 disabled:opacity-45"
            >
              {t.saveKey}
            </button>
            <button
              type="button"
              onClick={() => void clearKey()}
              disabled={busy || !hasKey}
              className="rounded-[6px] border border-danger bg-surface px-3 py-1.5 text-[14px] text-danger hover:bg-danger/10 disabled:opacity-45"
            >
              {t.clearKey}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
