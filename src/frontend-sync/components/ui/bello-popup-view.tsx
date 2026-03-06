import React, { useEffect, useRef } from 'react';
import {
  type AgentState,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { Phone } from 'lucide-react';
import useChatAndTranscription from '../../hooks/use-chat-and-transcription';
import { useDebugMode } from '../../hooks/useDebug';
import type { AgentConfig } from '../../../frontend-adapter/agent-config';
import { cn } from '../../lib/utils';
import { AgentControlBar } from '../agents-ui/agent-control-bar';
import { AgentChatTranscript } from '../agents-ui/agent-chat-transcript';
import { AgentAudioVisualizerAura } from '../agents-ui/agent-audio-visualizer-aura';
import type { AgentRichMessage, EmbedErrorDetails } from '../../../frontend-adapter/embed-types';

function isAgentAvailable(agentState: AgentState) {
  return (
    agentState == 'listening' ||
    agentState == 'thinking' ||
    agentState == 'speaking'
  );
}

/** Play a soft repeating dial tone using Web Audio API while the agent is connecting. */
function useCallingTone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = null;
      ctxRef.current?.close();
      ctxRef.current = null;
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const playBeep = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    };

    playBeep();
    intervalRef.current = setInterval(playBeep, 2000);

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = null;
      ctx.close();
      ctxRef.current = null;
    };
  }, [active]);
}

type BelloPopupViewProps = {
  config: AgentConfig;
  disabled: boolean;
  sessionStarted: boolean;
  onDisplayError: (err: EmbedErrorDetails) => void;
  agentMessages?: AgentRichMessage[];
};

export const BelloPopupView = ({
  config,
  disabled,
  sessionStarted,
  onDisplayError,
  agentMessages,
  ref,
}: React.ComponentProps<'div'> & BelloPopupViewProps) => {
  const room = useRoomContext();
  const { state: agentState, audioTrack: agentAudioTrack } =
    useVoiceAssistant();
  const { messages } = useChatAndTranscription();

  const theme = config.design?.theme;
  const isDark = theme === 'dark';
  const auraThemeMode = theme === 'light' ? 'light' : 'dark';
  const auraColor = config.design?.accentColor || '#1FD5F9';

  // Show connecting state when session started but agent not yet available
  const isConnecting =
    sessionStarted && !isAgentAvailable(agentState) && agentState !== 'disconnected';

  // Play a soft calling tone while connecting
  useCallingTone(isConnecting);

  const onLeave = () => {
    room.disconnect();
  };

  useDebugMode();

  // Get theme classes based on config
  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          title: 'text-gray-900',
          subtitle: 'text-gray-600',
        };
      case 'dark':
        return {
          title: 'text-white',
          subtitle: 'text-gray-300',
        };
      default:
        return {
          title: 'text-white',
          subtitle: 'text-gray-300',
        };
    }
  };

  const themeClasses = getThemeClasses();

  // If the agent hasn't connected after an interval, then show an error - something must not be
  // working
  useEffect(() => {
    if (!sessionStarted) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!isAgentAvailable(agentState)) {
        const reason =
          agentState === 'connecting'
            ? 'Agent did not join the room. '
            : 'Agent connected but did not complete initializing. ';

        onDisplayError({
          title: 'Session ended',
          description: (
            <p className="w-full">
              {reason}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.bello.ai/troubleshooting"
                className="whitespace-nowrap underline"
              >
                See troubleshooting guide
              </a>
              .
            </p>
          ),
        });
        room.disconnect();
      }
    }, 10_000);

    return () => clearTimeout(timeout);
  }, [agentState, sessionStarted, room, onDisplayError]);

  return (
    <div
      ref={ref}
      inert={disabled}
      className={cn(
        'flex h-full w-full flex-col',
        isDark && 'dark',
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 pl-4">
            <AgentAudioVisualizerAura
              size="sm"
              state={agentState}
              audioTrack={agentAudioTrack}
              themeMode={auraThemeMode}
              color={auraColor}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-semibold text-sm truncate',
                themeClasses.title
              )}
            >
              {config.design?.widgetTitle || 'Voice Assistant'}
            </h3>
            <p
              className={cn(
                'text-xs truncate',
                themeClasses.subtitle
              )}
            >
              {config.design?.widgetButtonTitle ||
                'How can I help you?'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Connecting state — shown while agent hasn't joined yet */}
        {isConnecting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <AgentAudioVisualizerAura
                size="md"
                state={agentState}
                themeMode={auraThemeMode}
                color={auraColor}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Phone className="h-6 w-6 animate-pulse text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              Connecting...
            </p>
          </div>
        )}

        {/* Chat Transcript */}
        <AgentChatTranscript
          agentState={agentState}
          messages={messages}
          agentMessages={agentMessages}
          className="z-10 flex-1"
        />
      </div>

      {/* Control Bar */}
      <div className="flex-shrink-0 p-2">
        <AgentControlBar
          variant="livekit"
          isConnected={room.state === 'connected'}
          onDisconnect={onLeave}
          controls={{
            microphone: true,
            camera: false,
            screenShare: false,
            chat: true,
            leave: true,
          }}
        />
      </div>
    </div>
  );
};
