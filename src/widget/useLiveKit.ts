import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import type { InitOptions } from '../types';
import { fetchConnectionDetails } from '../api';

/**
 * Reliable LiveKit connect flow for embedded usage:
 * - Resumes AudioContext (autoplay policy)
 * - Atomic mic + connect with preConnectBuffer
 * - Basic event handling + cleanup
 */
export function useLiveKit(opts: InitOptions, enabled: boolean) {
  const room = useMemo(() => new Room(), []);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const enableAudioContext = async () => {
      try {
        const Ctx =
          (window as any).AudioContext ||
          (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          if (ctx.state === 'suspended') await ctx.resume();
        }
      } catch {
        // ignore
      }
    };

    const onMediaDevicesError = (err: Error) => {
      if (!cancelled) setError(`${err.name}: ${err.message}`);
    };
    const onDisconnected = () => {
      if (!cancelled) setConnected(false);
    };

    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);

    (async () => {
      try {
        setConnecting(true);
        await enableAudioContext();

        const { serverUrl, participantToken } =
          await fetchConnectionDetails(opts);
        if (cancelled) return;

        // Atomic connect: mic + connect concurrently
        await Promise.all([
          room.localParticipant.setMicrophoneEnabled(
            true,
            undefined,
            { preConnectBuffer: true }
          ),
          room.connect(serverUrl, participantToken),
        ]);

        if (!cancelled) setConnected(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(`${e?.name ?? 'Error'}: ${e?.message ?? 'unknown'}`);
        }
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      room.off(RoomEvent.Disconnected, onDisconnected);
      try {
        room.disconnect();
      } catch {}
      setConnected(false);
      setConnecting(false);
    };
  }, [enabled, room, opts.apiBaseUrl, opts.projectId]);

  return { room, error, setError, connecting, connected };
}
