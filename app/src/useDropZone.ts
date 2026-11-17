import { useEffect, useRef, useState } from 'react';

/**
 * Drag and drop for the window, when the window actually supports it.
 *
 * The listener can fail to register (a plain browser preview, a platform without
 * the event). A drop target that never receives a drop is a false promise, so
 * callers show the drop wording only when this returns true.
 */
export function useDropZone(onDrop: (paths: string[]) => void): boolean {
  const [ready, setReady] = useState(false);
  const handler = useRef(onDrop);

  useEffect(() => {
    handler.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { getCurrentWebview } = await import('@tauri-apps/api/webview');
        const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
          if (event.payload.type === 'drop') handler.current(event.payload.paths);
        });
        if (cancelled) {
          unlisten();
        } else {
          stop = unlisten;
          setReady(true);
        }
      } catch {
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return ready;
}
