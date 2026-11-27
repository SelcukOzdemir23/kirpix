import { useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { api, type SessionInfo, type SubtitleTrack } from '../api';

const VIDEO_FILTERS = [{ name: 'Video', extensions: ['mp4', 'mkv', 'mov', 'webm'] }];
const SUBTITLE_FILTERS = [{ name: 'Subtitles', extensions: ['srt', 'vtt'] }];
const VIDEO_EXT = /\.(mp4|mkv|mov|webm)$/i;
const SUBTITLE_EXT = /\.(srt|vtt)$/i;

/**
 * The open recording and its subtitles (features 001 and 002): picking or
 * dropping a file, choosing an embedded track, the offset, and listening to a
 * cue.
 *
 * `onTimesChanged` runs whenever the cue times stop being the ones results were
 * measured on: a new recording, or a new offset. The caller clears whatever
 * depends on them.
 */
export function useSession(report: (error: unknown) => void, onTimesChanged: () => void) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [offsetMs, setOffsetMs] = useState(0);
  const [clampedCues, setClampedCues] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function applySession(info: SessionInfo) {
    setSession(info);
    setPendingVideo(null);
    setTracks([]);
    setOffsetMs(info.offsetMs);
    setClampedCues(0);
    report(null);
    onTimesChanged();
  }

  async function guarded(work: () => Promise<void>) {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }

  async function openWith(video: string, subtitle: string) {
    await guarded(async () => {
      try {
        applySession(await api.openSession(video, subtitle));
      } catch (error) {
        setSession(null);
        throw error;
      }
    });
  }

  async function openFromTrack(video: string, streamIndex: number) {
    await guarded(async () => {
      try {
        applySession(await api.openFromTrack(video, streamIndex));
      } catch (error) {
        setSession(null);
        throw error;
      }
    });
  }

  async function chooseSubtitleFile(video: string) {
    const subtitle = await open({ multiple: false, directory: false, filters: SUBTITLE_FILTERS });
    if (typeof subtitle === 'string') await openWith(video, subtitle);
  }

  /** A container may already carry its subtitles. Ask which text before asking for a file. */
  async function acceptVideo(video: string) {
    report(null);
    setBusy(true);
    let found: SubtitleTrack[];
    try {
      found = await api.listTracks(video);
    } catch (error) {
      report(error);
      return;
    } finally {
      setBusy(false);
    }
    if (found.length > 0) {
      setPendingVideo(video);
      setTracks(found);
      setSession(null);
    } else {
      await chooseSubtitleFile(video);
    }
  }

  async function pickVideo() {
    report(null);
    const video = await open({ multiple: false, directory: false, filters: VIDEO_FILTERS });
    if (typeof video === 'string') await acceptVideo(video);
  }

  /** A dropped file is the same choice as a picked one; an explicit subtitle wins over the container's own. */
  async function acceptDropped(paths: string[]) {
    const video = paths.find((path) => VIDEO_EXT.test(path));
    const subtitle = paths.find((path) => SUBTITLE_EXT.test(path));

    if (video) {
      if (subtitle) await openWith(video, subtitle);
      else await acceptVideo(video);
      return;
    }

    if (subtitle) {
      const known = pendingVideo ?? session?.videoPath;
      if (known) await openWith(known, subtitle);
    }
  }

  async function applyOffset(next: number) {
    try {
      const info = await api.setOffset(next);
      setOffsetMs(info.offsetMs);
      setClampedCues(info.clampedCues);
      // The previous results were measured on the old times.
      onTimesChanged();
    } catch (error) {
      report(error);
    }
  }

  async function playCue(cueIndex: number) {
    try {
      const url = await api.cueSample(cueIndex, 4);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (error) {
      report(error);
    }
  }

  return {
    session,
    busy,
    pendingVideo,
    tracks,
    offsetMs,
    clampedCues,
    audioRef,
    pickVideo,
    chooseSubtitleFile,
    openFromTrack,
    acceptDropped,
    applyOffset,
    playCue,
  };
}
