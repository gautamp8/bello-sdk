import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import {
  RoomContext,
  RoomAudioRenderer,
  StartAudio,
  BarVisualizer,
  useVoiceAssistant,
} from '@livekit/components-react';
import {
  Orb,
  galaxyPreset,
  oceanDepthsPreset,
  caribeanPreset,
  cherryBlossomPreset,
  emeraldPreset,
  multiColorPreset,
  goldenGlowPreset,
  volcanicPreset,
} from 'react-ai-orb';
import { ChevronDown, Phone } from 'lucide-react'; // ← NEW
import type { InitOptions, Theme } from '../types';
import { useLiveKit } from './useLiveKit';
import ChatInput from './ChatInput';
import useChatAndTranscription from './useChatAndTranscription';
import ChatEntry from './ChatEntry';

function preset(style: string) {
  switch (style) {
    case 'ocean-depths':
      return oceanDepthsPreset;
    case 'caribbean':
      return caribeanPreset;
    case 'cherry-blossom':
      return cherryBlossomPreset;
    case 'emerald':
      return emeraldPreset;
    case 'multi-color':
      return multiColorPreset;
    case 'golden-glow':
      return goldenGlowPreset;
    case 'volcanic':
      return volcanicPreset;
    case 'galaxy':
    default:
      return galaxyPreset;
  }
}

export function BelloWidget({
  opts,
  theme,
  onClose,
}: {
  opts: InitOptions;
  theme: Theme;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  // switches (default true if undefined)
  const agentOn = opts.agentEnabled !== false;
  const voiceOn = opts.voiceEnabled !== false;

  // only connect when widget is open AND agent is enabled
  const { room, error, setError, connecting, connected } = useLiveKit(
    opts,
    open && agentOn
  );

  // Programmatic open/close support
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const t = detail?.type;
      if (t === 'open') setOpen(true);
      if (t === 'close') {
        setOpen(false);
        onClose();
      }
    };
    window.addEventListener('bello:event', handler as any);
    return () =>
      window.removeEventListener('bello:event', handler as any);
  }, [onClose]);

  const cfg = useMemo(
    () => ({
      title: opts.widgetTitle ?? 'Need support?',
      cta: opts.widgetButtonTitle ?? 'Chat with AI',
      pos: opts.position ?? 'bottom-right',
      orb: opts.orbStyle ?? 'galaxy',
    }),
    [opts]
  );

  const cls =
    theme === 'dark'
      ? 'theme-dark'
      : theme === 'glass'
      ? 'theme-glass'
      : 'theme-light';

  const collapse = () => {
    setOpen(false);
    onClose(); // triggers LiveKit cleanup (enabled becomes false)
  };

  return (
    <div className={cls}>
      {/* Launcher (closed) */}
      {!open && (
        <div className="bello-container bello-row">
          <div className="px-3">
            <Orb
              {...preset(cfg.orb)}
              size={0.7}
              animationSpeedBase={1}
              animationSpeedHue={1}
              mainOrbHueAnimation
            />
          </div>
          <div className="bello-title-container">
            <div className="bello-hero">{cfg.title}</div>
            <button
              className="bello-trigger"
              onClick={() => setOpen(true)}
            >
              {cfg.cta}
            </button>
          </div>
        </div>
      )}

      {/* Widget (open) */}
      <motion.div
        className="bello-pop"
        data-pos={cfg.pos}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.98,
          y: open ? 0 : 6,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="bello-card bello-body">
          {/* Header with END button */}
          <div className="bello-header">
            <div className="bello-row">
              <div className="pl-2">
                <Orb
                  {...preset(cfg.orb)}
                  size={0.5}
                  animationSpeedBase={1}
                  animationSpeedHue={1}
                  mainOrbHueAnimation
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="bello-title">{cfg.title}</div>
                <div className="bello-subtitle">
                  {agentOn
                    ? 'Voice & text assistant'
                    : 'UI preview (agent off)'}
                </div>
              </div>
            </div>
            <button
              className="bello-trigger-danger small"
              onClick={collapse}
              aria-label="End session"
              title="End"
            >
              <Phone size={14} />
              End
            </button>
          </div>

          {/* Body + Footer */}
          {error ? (
            <div className="bello-main">
              <div className="bello-error">
                <div className="bello-error-title">Error</div>
                <div className="bello-error-text">{error}</div>
                <button
                  className="bello-trigger small mt"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : agentOn ? (
            <RoomContext.Provider value={room}>
              <div className="bello-main">
                {voiceOn && (
                  <>
                    <RoomAudioRenderer />
                    <StartAudio label="Start Audio" />
                    <AgentAudioEnsurePlay />
                  </>
                )}
                <TopStatus
                  connecting={connecting}
                  connected={connected}
                  voiceOn={voiceOn}
                />
                <ChatRegion />
              </div>

              {/* FOOTER: chat input + send */}
              <div className="bello-footer">
                <FooterInput connected={connected} />
              </div>
            </RoomContext.Provider>
          ) : (
            <>
              <div className="bello-main">
                <div className="center">
                  <p className="status">
                    UI preview · Agent disabled
                  </p>
                </div>
                <div className="chat-wrap">
                  <ol className="chat-list" aria-live="polite">
                    <li className="chat-entry them">
                      <div className="chat-name">Agent</div>
                      <div className="chat-bubble them">
                        <span className="chat-text">
                          Hi! This is UI-only mode.
                        </span>
                        <span className="chat-time">—</span>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
              <div className="bello-footer">
                <ChatInput disabled onSend={() => {}} />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* FAB chevron — visible only when open (bottom corner) */}
      {open && (
        <button
          className="bello-fab"
          onClick={collapse}
          aria-label="Collapse widget"
          title="Collapse"
        >
          <ChevronDown size={20} />
        </button>
      )}
    </div>
  );
}

/** Small status block above chat */
function TopStatus({
  connecting,
  connected,
  voiceOn = true,
}: {
  connecting: boolean;
  connected: boolean;
  voiceOn?: boolean;
}) {
  const { state: agentState, audioTrack } = useVoiceAssistant();

  return (
    <div className="center">
      {voiceOn && (
        <BarVisualizer
          barCount={5}
          options={{ minHeight: 6 }}
          className="bars"
          trackRef={audioTrack}
          state={agentState}
        >
          <span className="bar" />
        </BarVisualizer>
      )}
      <p className="status">
        {connecting && 'Connecting…'}
        {!connecting &&
          connected &&
          (agentState === 'speaking'
            ? 'Agent speaking…'
            : agentState === 'listening'
            ? 'Agent listening…'
            : agentState === 'thinking'
            ? 'Agent thinking…'
            : 'Connected')}
        {!connecting && !connected && 'Ready'}
      </p>
    </div>
  );
}

/** Ensure agent audio plays if auto-attach fails. */
function AgentAudioEnsurePlay() {
  const { audioTrack } = useVoiceAssistant();

  useEffect(() => {
    if (!audioTrack) return;

    const el = (audioTrack as any)?.attachedElements?.[0] as
      | HTMLAudioElement
      | undefined;
    const kick = (a: HTMLMediaElement) => {
      try {
        a.muted = false;
        (a as any).playsInline = true;
        const p = a.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
      } catch {}
    };

    if (el) {
      kick(el);
      return;
    }

    try {
      const audio = new Audio();
      audio.autoplay = true;
      (audio as any).playsInline = true;
      audio.muted = false;

      if (typeof (audioTrack as any).attach === 'function') {
        (audioTrack as any).attach(audio);
      } else if ((audioTrack as any).mediaStream) {
        (audio as any).srcObject = (audioTrack as any).mediaStream;
      }
      kick(audio);
    } catch {}
  }, [audioTrack]);

  return null;
}

/** Messages only (no input here anymore) */

function ChatRegion() {
  const { messages, revision } = useChatAndTranscription();

  // The <ol> that renders messages
  const listRef = useRef<HTMLOListElement>(null);
  // Invisible element at the end we can scroll to
  const endRef = useRef<HTMLDivElement>(null);
  // Whether we should keep snapping to the bottom
  const stickRef = useRef(true);

  // Track if the user manually scrolled up; if so, don't auto-stick until they return near the bottom
  useEffect(() => {
    // Try the nearest scrollable ancestor; if none, the list itself
    const listEl = listRef.current;
    if (!listEl) return;

    // Find the actual scrolling container (bubbles often sit inside a parent with overflow)
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
        80; // px threshold
      stickRef.current = nearBottom;
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();

    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll when:
  //  - revision changes (partial → text changed)
  //  - a new message is appended (length)
  //  - the last message id or text changes
  useLayoutEffect(() => {
    if (!stickRef.current) return;
    // wait for DOM paint so heights are correct
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
  ]);

  return (
    <div className="chat-wrap">
      <ol ref={listRef} className="chat-list" aria-live="polite">
        {messages.map((m) => (
          <ChatEntry key={m.id} entry={m} />
        ))}
        {/* sentinel */}
        <li aria-hidden="true">
          <div ref={endRef} />
        </li>
      </ol>
      {/* your footer input stays outside this component if you moved it */}
    </div>
  );
}

export default ChatRegion;

/** Footer input that sends via data channel when connected */
function FooterInput({ connected }: { connected: boolean }) {
  const { send } = useChatAndTranscription();
  return (
    <ChatInput
      disabled={!connected}
      onSend={(txt) => {
        const t = txt.trim();
        if (!t) return;
        send(t);
      }}
    />
  );
}
