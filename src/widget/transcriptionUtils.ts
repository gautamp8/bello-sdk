// src/widget/transcriptionUtils.ts
import type { Room } from 'livekit-client';
import type {
  TextStreamData,
  ReceivedChatMessage,
} from '@livekit/components-react';

/** Cache a sticky decision for each utterance so the side never flips mid-stream. */
const stickySide = new Map<string, boolean>(); // utteranceKey -> isLocal(user/right)

/* -------------------------- helpers for your shape -------------------------- */

function getAttr(t: any, k: string): string | undefined {
  return t?.streamInfo?.attributes?.[k] ?? t?.attributes?.[k];
}

function getIdentity(t: any): string | undefined {
  return (
    t?.participantInfo?.identity ??
    t?.participant?.identity ??
    t?.participantIdentity ??
    t?.participantSid
  );
}

function getTimestamp(t: any): number {
  const ts = t?.streamInfo?.timestamp ?? t?.timestamp ?? t?.time;
  return typeof ts === 'number' ? ts : Date.now();
}

export function extractText(t: any): string {
  // Your payload: { text: "..." }
  return (
    t?.text ?? t?.alternatives?.[0]?.text ?? t?.result?.text ?? ''
  );
}

export function isFinalUtterance(t: any): boolean {
  // Your payload uses "lk.transcription_final": "true" | "false"
  const f = getAttr(t, 'lk.transcription_final');
  if (typeof f === 'string') return f.toLowerCase() === 'true';

  // Other common shapes
  return Boolean(
    t?.isFinal ||
      t?.final ||
      t?.result?.is_final ||
      t?.result?.final ||
      t?.alternatives?.[0]?.isFinal
  );
}

/** A stable key per utterance: prefer LiveKit segment id, then stream id, then a fallback */
export function utteranceKeyOf(t: any): string {
  return (
    getAttr(t, 'lk.segment_id') ||
    t?.streamInfo?.id ||
    `${getIdentity(t) || 'p'}:${getTimestamp(t)}`
  );
}

/* -------------------------- side decision (sticky) -------------------------- */

function rememberSide(key: string, v: boolean) {
  stickySide.set(key, v);
  return v;
}

function guessLocalByIdentity(id?: string): boolean | undefined {
  if (!id) return undefined;
  // Your identities look like "user-844feb9f" and "agent-<...>"
  if (id.startsWith('user-')) return true;
  if (id.startsWith('agent-')) return false;
  return undefined;
}

/** Decide "isLocal" once per utterance; trust identity hints and fall back to room.identity */
export function decideIsLocalOnce(
  key: string,
  t: any,
  room?: Room
): boolean {
  if (stickySide.has(key)) return stickySide.get(key)!;

  // 1) Strong hint from identity prefix
  const id = getIdentity(t);
  const byPrefix = guessLocalByIdentity(id);
  if (typeof byPrefix === 'boolean')
    return rememberSide(key, byPrefix);

  // 2) Participant.isLocal (some shapes)
  const p = (t?.participant || {}) as any;
  if (typeof p?.isLocal === 'boolean')
    return rememberSide(key, p.isLocal);

  // 3) Match against room.localParticipant
  const lp = (room?.localParticipant as any) || {};
  const localId = lp.identity ?? lp.sid;
  if (localId && id)
    return rememberSide(key, String(localId) === String(id));

  // 4) Last resort: assume remote/agent
  return rememberSide(key, false);
}

/* -------------------------- main converter -------------------------- */

export function transcriptionToChatMessage(
  t: TextStreamData,
  room?: Room
): ReceivedChatMessage {
  const anyT = t as any;
  const key = utteranceKeyOf(anyT);
  const ts = getTimestamp(anyT);
  const text = extractText(anyT);

  const identity = getIdentity(anyT);
  const isLocal = decideIsLocalOnce(key, anyT, room);

  // Compose a ReceivedChatMessage compatible shape
  return {
    id: `tx-${key}`, // one id per utterance (collapses partials into a single bubble)
    from: {
      // Compatible with ChatEntry expectations
      isLocal,
      name: isLocal ? 'You' : 'Agent',
      identity: identity ?? (isLocal ? 'local' : 'agent'),
    } as any,
    message: text,
    timestamp: ts,
  } as unknown as ReceivedChatMessage;
}
