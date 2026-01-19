import type { ReceivedChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';

export default function ChatEntry({
  entry,
}: {
  entry: ReceivedChatMessage;
}) {
  const room = useRoomContext();
  const lp = (room?.localParticipant as any) || {};
  const localId: string | undefined = lp.identity ?? lp.sid;

  const from: any = entry.from || {};
  const pid = from?.identity ?? from?.sid;

  // Prefer sticky flag, then identity match.
  const isUser =
    from?.isLocal === true ||
    (localId && pid && String(localId) === String(pid)) ||
    (typeof pid === 'string' && pid.startsWith('user-'));

  const who = isUser ? 'You' : from?.name || 'Agent';
  const time =
    typeof entry.timestamp === 'number'
      ? new Date(entry.timestamp)
      : new Date();
  const timeStr = time.toLocaleTimeString(undefined, {
    timeStyle: 'short',
  });

  return (
    <li
      className={`chat-entry ${isUser ? 'me' : 'them'}`}
      title={time.toString()}
    >
      {!isUser && <div className="chat-name">{who}</div>}
      <div className={`chat-bubble ${isUser ? 'me' : 'them'}`}>
        <span className="chat-text">{entry.message}</span>
        <span className="chat-time">{timeStr}</span>
      </div>
    </li>
  );
}
