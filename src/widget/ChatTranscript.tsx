import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReceivedChatMessage } from '@livekit/components-react';
import { useRoomContext } from '@livekit/components-react';
import useChatAndTranscription from './useChatAndTranscription';
import type { AgentRichMessage } from '../types';

/** Simple inline markdown: bold, italic, links */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Replace **bold**, *italic*, [text](url) with spans/links
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index}>{match[2]}</em>);
    } else if (match[3] && match[4]) {
      parts.push(
        <a
          key={match.index}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="bello-link"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

/** Thinking indicator with pulsing dots */
function ThinkingIndicator() {
  return (
    <li className="chat-entry them">
      <div className="chat-bubble them">
        <span className="bello-thinking-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </li>
  );
}

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function RichMessage({ msg }: { msg: AgentRichMessage }) {
  const time = new Date(msg.timestamp);
  const timeStr = time.toLocaleTimeString(undefined, { timeStyle: 'short' });

  return (
    <li className="bello-rich-msg" title={time.toString()}>
      <div className="bello-rich-msg-bubble">
        <span className="bello-rich-msg-text">
          {renderInlineMarkdown(msg.message)}
        </span>
        {msg.url && (
          <a
            href={msg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bello-rich-msg-link"
          >
            Open link <ExternalLinkIcon />
          </a>
        )}
        <span className="chat-time">{timeStr}</span>
      </div>
    </li>
  );
}

function ChatMessage({ entry }: { entry: ReceivedChatMessage }) {
  const room = useRoomContext();
  const lp = (room?.localParticipant as any) || {};
  const localId: string | undefined = lp.identity ?? lp.sid;

  const from: any = entry.from || {};
  const pid = from?.identity ?? from?.sid;

  const isUser =
    from?.isLocal === true ||
    (localId && pid && String(localId) === String(pid)) ||
    (typeof pid === 'string' && pid.startsWith('user-'));

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
      <div className={`chat-bubble ${isUser ? 'me' : 'them'}`}>
        <span className="chat-text">
          {renderInlineMarkdown(entry.message)}
        </span>
        <span className="chat-time">{timeStr}</span>
      </div>
    </li>
  );
}

type TimelineItem =
  | { kind: 'chat'; ts: number; entry: ReceivedChatMessage }
  | { kind: 'rich'; ts: number; msg: AgentRichMessage };

export interface ChatTranscriptProps {
  agentState?: string;
  agentMessages?: AgentRichMessage[];
}

export function ChatTranscript({ agentState, agentMessages }: ChatTranscriptProps) {
  const { messages, revision } = useChatAndTranscription();

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = messages.map((entry) => ({
      kind: 'chat' as const,
      ts: typeof entry.timestamp === 'number' ? entry.timestamp : 0,
      entry,
    }));

    if (agentMessages) {
      for (const msg of agentMessages) {
        items.push({ kind: 'rich' as const, ts: msg.timestamp, msg });
      }
    }

    items.sort((a, b) => a.ts - b.ts);
    return items;
  }, [messages, agentMessages]);

  const listRef = useRef<HTMLOListElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // Track if user manually scrolled up
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const scroller =
      (listEl.closest(
        '.chat-wrap, .bello-main, .scroll-container'
      ) as HTMLElement) ||
      (listEl.parentElement as HTMLElement) ||
      (listEl as HTMLElement);

    const onScroll = () => {
      const nearBottom =
        scroller.scrollHeight -
          scroller.scrollTop -
          scroller.clientHeight <
        80;
      stickRef.current = nearBottom;
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll when new messages arrive
  useLayoutEffect(() => {
    if (!stickRef.current) return;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        block: 'end',
        inline: 'nearest',
        behavior: 'auto',
      });
    });
  }, [
    revision,
    messages.length,
    messages[messages.length - 1]?.id,
    messages[messages.length - 1]?.message,
    agentMessages?.length,
  ]);

  return (
    <div className="chat-wrap">
      <ol ref={listRef} className="chat-list" aria-live="polite">
        {timeline.map((item) =>
          item.kind === 'chat' ? (
            <ChatMessage key={item.entry.id} entry={item.entry} />
          ) : (
            <RichMessage key={item.msg.id} msg={item.msg} />
          )
        )}
        {agentState === 'thinking' && <ThinkingIndicator />}
        <li aria-hidden="true">
          <div ref={endRef} />
        </li>
      </ol>
    </div>
  );
}
