// src/widget/transcriptionToChatMessage.ts
import type {
  TextStreamData,
  ReceivedChatMessage,
} from '@livekit/components-react';
import type { Room } from 'livekit-client';

/**
 * We collapse streaming partials into one message per utterance and "stick"
 * each utterance to a side exactly once (no later flipping).
 */
const stickySide = new Map<string, boolean>(); // utteranceKey -> isLocal(user/right)

/** Best-effort stable utterance key across LiveKit/ASR variants */
function utteranceKeyOf(t: any): string {
  return (
    t?.segment?.id ||
    t?.result?.id ||
    t?.alternatives?.[0]?.id ||
    t?.streamSid ||
    t?.trackSid ||
    `${t?.participantSid || t?.participant?.sid || 'p'}:${
      // 2s bucket fallback to keep rapid partials grouped
      Math.floor((t?.timestamp || t?.time || Date.now()) / 2000)
    }`
  );
}

function rememberSide(key: string, v: boolean) {
  stickySide.set(key, v);
  return v;
}

/** Decide "isLocal" once per utterance using participant + hints */
function decideIsLocalOnce(
  key: string,
  t: any,
  room?: Room
): boolean {
  if (stickySide.has(key)) return stickySide.get(key)!;

  const p = (t?.participant || {}) as any;
  const pid =
    p?.identity ??
    p?.sid ??
    t?.participantIdentity ??
    t?.participantSid;

  const localId =
    (room?.localParticipant as any)?.identity ||
    (room?.localParticipant as any)?.sid;

  // Strongest signals
  if (typeof p?.isLocal === 'boolean') {
    return rememberSide(key, p.isLocal);
  }
  if (localId && pid && String(localId) === String(pid)) {
    return rememberSide(key, true);
  }

  // Common semantic hints in vendor payloads
  if (
    t?.speaker === 'user' ||
    t?.role === 'user' ||
    t?.source === 'local'
  ) {
    return rememberSide(key, true);
  }
  if (t?.speaker === 'assistant' || t?.role === 'assistant') {
    return rememberSide(key, false);
  }

  // Fallback guess: not the local participant ⇒ agent/remote
  if (localId && pid) {
    return rememberSide(key, String(localId) === String(pid));
  }

  // Default to remote/agent if unknown
  return rememberSide(key, false);
}

/**
 * Public helper used by the hook, intentionally mimicking your Next.js signature:
 *    transcriptionToChatMessage(transcription, room)
 */
export function transcriptionToChatMessage(
  t: TextStreamData,
  room?: Room
): ReceivedChatMessage {
  const anyT = t as any;
  const key = utteranceKeyOf(anyT);

  const ts: number =
    typeof anyT?.timestamp === 'number'
      ? anyT.timestamp
      : typeof anyT?.time === 'number'
      ? anyT.time
      : Date.now();

  // best-effort text extraction
  const text: string =
    anyT?.alternatives?.[0]?.text ??
    anyT?.text ??
    anyT?.result?.text ??
    '';

  const p = (anyT?.participant || {}) as any;
  const pid =
    p?.identity ??
    p?.sid ??
    anyT?.participantIdentity ??
    anyT?.participantSid;

  const isLocal = decideIsLocalOnce(key, anyT, room);

  return {
    id: `tx-${key}`, // stable per-utterance id collapses partials
    from: {
      ...(p || {}),
      isLocal,
      name: p?.name ?? (isLocal ? 'You' : 'Agent'),
      identity: pid ?? (isLocal ? 'local' : 'agent'),
    } as any,
    message: text,
    timestamp: ts,
  } as unknown as ReceivedChatMessage;
}
