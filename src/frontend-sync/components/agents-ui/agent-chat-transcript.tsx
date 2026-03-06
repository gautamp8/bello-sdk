import { type ComponentProps, useMemo } from 'react';
import { type AgentState, type ReceivedChatMessage } from '@livekit/components-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '../ai-elements/message';
import { AgentChatIndicator } from './agent-chat-indicator';
import { AnimatePresence } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import type { AgentRichMessage } from '../../../frontend-adapter/embed-types';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedChatMessage[];
  /** Rich messages sent by the agent via RPC (links, text) */
  agentMessages?: AgentRichMessage[];
  className?: string;
}

/** Unified message item for the sorted timeline */
type TimelineItem =
  | { kind: 'chat'; data: ReceivedChatMessage }
  | { kind: 'rich'; data: AgentRichMessage };

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing. Also renders rich messages (links, text) sent by the
 * agent via RPC client tools.
 */
export function AgentChatTranscript({
  agentState,
  messages = [],
  agentMessages = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  // Merge chat messages and agent rich messages into a sorted timeline
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({ kind: 'chat' as const, data: m })),
      ...agentMessages.map((m) => ({ kind: 'rich' as const, data: m })),
    ];
    items.sort((a, b) => {
      const tA = a.kind === 'chat' ? a.data.timestamp : a.data.timestamp;
      const tB = b.kind === 'chat' ? b.data.timestamp : b.data.timestamp;
      return tA - tB;
    });
    return items;
  }, [messages, agentMessages]);

  return (
    <Conversation className={className} {...props}>
      <ConversationContent>
        {timeline.map((item) => {
          if (item.kind === 'chat') {
            const { id, timestamp, from, message } = item.data;
            const locale = navigator?.language ?? 'en-US';
            const messageOrigin = from?.isLocal ? 'user' : 'assistant';
            const time = new Date(timestamp);
            const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

            return (
              <Message key={id} title={title} from={messageOrigin}>
                <MessageContent>
                  <MessageResponse>{message}</MessageResponse>
                </MessageContent>
              </Message>
            );
          }

          // Rich message from agent (link / text via RPC)
          const { id, message, url, timestamp } = item.data;
          const locale = navigator?.language ?? 'en-US';
          const time = new Date(timestamp);
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

          return (
            <Message key={id} title={title} from="assistant">
              <MessageContent>
                <div className="flex flex-col gap-1">
                  {message && (
                    <span className="text-sm">{message}</span>
                  )}
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      {url}
                    </a>
                  )}
                </div>
              </MessageContent>
            </Message>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && <AgentChatIndicator size="sm" />}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
