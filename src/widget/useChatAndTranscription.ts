import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ReceivedChatMessage,
  type TextStreamData,
  useChat,
  useRoomContext,
  useTranscriptions,
} from '@livekit/components-react';
import {
  transcriptionToChatMessage,
  utteranceKeyOf,
  extractText,
  isFinalUtterance,
} from './transcriptionUtils';

/**
 * Merges LiveKit transcriptions + data channel chat:
 *  - Sticky side per utterance (no flicker)
 *  - Agent speech appears immediately (no need to type)
 *  - Finalized voice turns persist
 *  - Exposes `revision` so UIs can auto-scroll even when length is unchanged
 */
export default function useChatAndTranscription() {
  const transcriptions: TextStreamData[] = useTranscriptions();
  const chat = useChat();
  const room = useRoomContext();

  // Persistent store of utterances for the widget session
  const storeRef = useRef<
    Map<
      string,
      { msg: ReceivedChatMessage; final: boolean; lastText: string }
    >
  >(new Map());
  const orderRef = useRef<string[]>([]);
  const [, force] = useState(0);

  // Signature to detect updates even if the array is mutated in place
  const last = transcriptions[transcriptions.length - 1] as any;
  const txSig =
    transcriptions.length === 0
      ? '0'
      : `${transcriptions.length}:${utteranceKeyOf(
          last
        )}:${extractText(last)}:${isFinalUtterance(last) ? 1 : 0}`;

  useEffect(() => {
    if (!transcriptions?.length) return;

    let changed = false;

    for (const t of transcriptions) {
      const anyT = t as any;
      const k = `tx-${utteranceKeyOf(anyT)}`;
      const next = transcriptionToChatMessage(t, room as any);
      const txt = extractText(anyT);
      const fin = isFinalUtterance(anyT);

      const prev = storeRef.current.get(k);
      if (!prev) {
        storeRef.current.set(k, {
          msg: next,
          final: Boolean(fin),
          lastText: txt,
        });
        orderRef.current.push(k);
        changed = true;
        continue;
      }

      const needTextUpdate = txt && txt !== prev.lastText;
      const becameFinal = !prev.final && fin;

      if (needTextUpdate || becameFinal) {
        storeRef.current.set(k, {
          msg: {
            ...prev.msg,
            message: needTextUpdate ? txt : prev.msg.message,
            timestamp: Math.max(
              prev.msg.timestamp || 0,
              next.timestamp || 0
            ),
            from: {
              ...(prev.msg.from as any),
              isLocal: (prev.msg.from as any)?.isLocal,
            } as any,
          },
          final: prev.final || Boolean(fin),
          lastText: needTextUpdate ? txt : prev.lastText,
        });
        changed = true;
      }
    }

    if (changed) force((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txSig, room]);

  // Build final list (utterances + data channel chat)
  const messages = useMemo(() => {
    const txMsgs: ReceivedChatMessage[] = orderRef.current
      .map((k) => storeRef.current.get(k)?.msg)
      .filter(Boolean) as ReceivedChatMessage[];

    const all = [...txMsgs, ...chat.chatMessages];
    all.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return all;
  }, [chat.chatMessages, txSig]);

  // Expose a revision that bumps on any voice change
  const revision = useMemo(() => txSig, [txSig]);

  return { messages, send: chat.send, revision };
}
