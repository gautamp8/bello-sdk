import { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import type { InitOptions } from '../types';
import { fetchConnectionDetails, endWidgetSession } from '../api';

declare const __BELLO_API_URL__: string;

const API_BASE =
  typeof __BELLO_API_URL__ !== 'undefined'
    ? __BELLO_API_URL__
    : 'https://api.heybello.dev';

/** Decode JWT payload and return the `exp` field (seconds since epoch). */
function decodeJwtExp(token: string): number {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload));
    return typeof json.exp === 'number' ? json.exp : 0;
  } catch {
    return 0;
  }
}

/** Map MediaDevicesError to a user-friendly string. */
function friendlyMediaError(err: Error): string {
  if (err.name === 'NotAllowedError') {
    return 'Microphone access was denied. Please allow microphone access in your browser settings and try again.';
  }
  if (err.name === 'NotFoundError') {
    return 'No microphone found. Please connect a microphone and try again.';
  }
  return `Microphone error: ${err.message}`;
}

/**
 * Reliable LiveKit connect flow for embedded usage:
 * - Resumes AudioContext (autoplay policy)
 * - Atomic mic + connect with preConnectBuffer
 * - ParticipantDisconnected handler (agent leaves → client disconnects)
 * - Session end reporting on disconnect
 * - Token caching to avoid redundant fetches on re-open
 */
export function useLiveKit(opts: InitOptions, enabled: boolean) {
  const room = useMemo(() => new Room(), []);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const sessionIdRef = useRef<string>('');

  // Token cache: reuse if not expired
  const cachedTokenRef = useRef<{
    token: string;
    serverUrl: string;
    sessionId: string;
    exp: number;
  } | null>(null);

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
      if (!cancelled) setError(friendlyMediaError(err));
    };
    const onDisconnected = () => {
      if (!cancelled) setConnected(false);
      // Invalidate cached token — the room may have been deleted
      cachedTokenRef.current = null;
      // Fire-and-forget session end
      const baseUrl = (opts.apiBaseUrl ?? API_BASE).replace(/\/+$/, '');
      endWidgetSession(baseUrl, sessionIdRef.current);
    };
    const onParticipantDisconnected = () => {
      // Agent left → disconnect the client
      try {
        room.disconnect();
      } catch {}
    };

    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    (async () => {
      try {
        setConnecting(true);
        await enableAudioContext();

        // Check cached token validity (30s buffer before expiry)
        let serverUrl: string;
        let participantToken: string;
        let sessionId: string;

        const cached = cachedTokenRef.current;
        if (cached && cached.exp > Date.now() / 1000 + 30) {
          serverUrl = cached.serverUrl;
          participantToken = cached.token;
          sessionId = cached.sessionId;
        } else {
          const details = await fetchConnectionDetails(opts);
          if (cancelled) return;
          serverUrl = details.serverUrl;
          participantToken = details.participantToken;
          sessionId = details.sessionId;

          // Cache the fresh token
          cachedTokenRef.current = {
            token: participantToken,
            serverUrl,
            sessionId,
            exp: decodeJwtExp(participantToken),
          };
        }

        sessionIdRef.current = sessionId;

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
          // Detect mic permission errors from the Promise.all path
          if (
            e?.name === 'NotAllowedError' ||
            e?.name === 'NotFoundError'
          ) {
            setError(friendlyMediaError(e));
          } else {
            setError(`${e?.name ?? 'Error'}: ${e?.message ?? 'unknown'}`);
          }
        }
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      try {
        room.disconnect();
      } catch {}
      setConnected(false);
      setConnecting(false);
    };
  }, [enabled, room, opts.apiBaseUrl, opts.projectId, opts.widgetApiKey]);

  return { room, error, setError, connecting, connected };
}
