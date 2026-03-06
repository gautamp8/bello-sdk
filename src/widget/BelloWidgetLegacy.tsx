import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import {
  RoomContext,
  RoomAudioRenderer,
  StartAudio,
  useVoiceAssistant,
} from '@livekit/components-react';
import type { AgentState } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import type { AgentRichMessage, InfoModalState, InitOptions, Theme } from '../types';
import { useLiveKit } from './useLiveKit';
import { AuraVisualizer } from './visualizer/AuraVisualizer';
import { ControlBar } from './ControlBar';
import { ChatTranscript } from './ChatTranscript';
import { useCallingTone } from './useCallingTone';
import { InfoCollectionModal } from './InfoCollectionModal';
import { isSameDomain } from './domainUtils';

/* ── Inline SVG Icons ── */

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v0Z"/>
  </svg>
);

/* ── Helpers ── */

function isAgentAvailable(agentState: AgentState) {
  return (
    agentState === 'listening' ||
    agentState === 'thinking' ||
    agentState === 'speaking'
  );
}

/* ── Inner popup content (inside RoomContext) ── */

function PopupContent({
  opts,
  sessionStarted,
  connected,
  onDisconnect,
  onError,
  agentMessages,
}: {
  opts: InitOptions;
  sessionStarted: boolean;
  connected: boolean;
  onDisconnect: () => void;
  onError: (msg: string) => void;
  agentMessages: AgentRichMessage[];
}) {
  const { state: agentState, audioTrack: agentAudioTrack } =
    useVoiceAssistant();

  const theme = opts.theme ?? 'dark';
  const auraThemeMode = theme === 'light' ? 'light' : 'dark';
  const auraColor = opts.accentColor || '#1FD5F9';

  const isConnecting =
    sessionStarted &&
    !isAgentAvailable(agentState) &&
    agentState !== 'disconnected';

  // Calling tone while connecting
  useCallingTone(isConnecting);

  // Agent timeout: if not available after 10s, show error
  const timedOutRef = useRef(false);
  useEffect(() => {
    if (!sessionStarted) return;

    const timeout = setTimeout(() => {
      if (!isAgentAvailable(agentState) && !timedOutRef.current) {
        timedOutRef.current = true;
        onError(
          agentState === 'connecting'
            ? 'Agent did not join the room.'
            : 'Agent connected but did not complete initializing.'
        );
        onDisconnect();
      }
    }, 10_000);

    return () => clearTimeout(timeout);
  }, [agentState, sessionStarted, onDisconnect, onError]);

  return (
    <>
      <RoomAudioRenderer />
      <StartAudio label="Start Audio" />
      <AgentAudioEnsurePlay />

      {/* Header */}
      <div className="bello-header">
        <div className="bello-row">
          <div className="bello-header-aura">
            <AuraVisualizer
              size="sm"
              state={agentState}
              audioTrack={agentAudioTrack}
              themeMode={auraThemeMode}
              color={auraColor}
            />
          </div>
          <div className="bello-header-text">
            <div className="bello-title">
              {opts.widgetTitle ?? 'Voice Assistant'}
            </div>
            <div className="bello-subtitle">
              {opts.widgetSubtitle ?? 'Ask me anything'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bello-main">
        {/* Connecting overlay */}
        {isConnecting && (
          <div className="bello-connecting-overlay">
            <div className="bello-connecting-aura">
              <AuraVisualizer
                size="md"
                state={agentState}
                themeMode={auraThemeMode}
                color={auraColor}
              />
              <div className="bello-connecting-icon">
                <PhoneIcon />
              </div>
            </div>
            <p className="bello-connecting-text">Connecting...</p>
          </div>
        )}

        {/* Chat Transcript */}
        <ChatTranscript agentState={agentState} agentMessages={agentMessages} />
      </div>

      {/* Footer: Control Bar */}
      <div className="bello-footer">
        <ControlBar
          isConnected={connected}
          onDisconnect={onDisconnect}
        />
      </div>
    </>
  );
}

/* ── Ensure agent audio plays if auto-attach fails ── */

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

/* ── Main Widget Component ── */

export function BelloWidgetLegacy({
  opts,
  theme,
  onClose,
}: {
  opts: InitOptions;
  theme: Theme;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  // Animation guard: prevent rapid open/close race conditions
  const isAnimatingRef = useRef(false);

  // Agent rich messages (sent via RPC, displayed in chat)
  const [agentMessages, setAgentMessages] = useState<AgentRichMessage[]>([]);

  // Info collection modal state
  const [infoModal, setInfoModal] = useState<InfoModalState>({
    open: false,
    fields: [],
    reason: '',
    resolve: null,
  });

  const agentOn = opts.agentEnabled !== false;
  const auraColor = opts.accentColor || '#1FD5F9';
  const auraThemeMode = theme === 'light' ? 'light' : 'dark';

  const { room, error, setError, connecting, connected } = useLiveKit(
    opts,
    open && agentOn
  );

  const guardedToggle = useCallback((nextOpen: boolean) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setOpen(nextOpen);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 350);
  }, []);

  // Programmatic open/close support
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const t = detail?.type;
      if (t === 'open') guardedToggle(true);
      if (t === 'close') {
        guardedToggle(false);
        onClose();
      }
    };
    window.addEventListener('bello:event', handler as any);
    return () =>
      window.removeEventListener('bello:event', handler as any);
  }, [onClose, guardedToggle]);

  const cfg = useMemo(
    () => ({
      title: opts.widgetTitle ?? 'Need support?',
      cta: opts.widgetButtonTitle ?? 'Start chat',
      pos: opts.position ?? 'bottom-right',
    }),
    [opts]
  );

  const cls = theme === 'dark' ? 'theme-dark' : 'theme-light';

  const collapse = useCallback(() => {
    setOpen(false);
    setAgentMessages([]);
    setInfoModal({ open: false, fields: [], reason: '', resolve: null });
    onClose();
  }, [onClose]);

  // ------------------------------------------------------------------
  // Register RPC handlers for agent client tools
  // ------------------------------------------------------------------
  const registerRpcHandlers = useCallback(
    (localRoom: Room) => {
      const lp = localRoom.localParticipant;

      // Navigate to URL (new tab, same-domain only)
      lp.registerRpcMethod('client.navigate', async (data) => {
        const { url } = JSON.parse(data.payload);
        if (!isSameDomain(window.location.hostname, url)) {
          throw new Error('Navigation blocked: URL is not on the same domain');
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        return JSON.stringify({ success: true });
      });

      // Show a rich message / link in the chat
      lp.registerRpcMethod('client.showMessage', async (data) => {
        const { message, url } = JSON.parse(data.payload);
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            message,
            url,
            timestamp: Date.now(),
          },
        ]);
        return JSON.stringify({ success: true });
      });

      // Collect user info via modal
      lp.registerRpcMethod('client.collectInfo', async (data) => {
        const { fields, reason } = JSON.parse(data.payload);
        const result = await new Promise<string>((resolve) => {
          setInfoModal({ open: true, fields, reason, resolve });
        });
        return result;
      });

      // Copy text to clipboard
      lp.registerRpcMethod('client.copyToClipboard', async (data) => {
        const { text } = JSON.parse(data.payload);
        try {
          await navigator.clipboard.writeText(text);
          return JSON.stringify({ success: true });
        } catch {
          return JSON.stringify({ error: 'Clipboard access denied' });
        }
      });
    },
    [],
  );

  // Register RPC handlers when connected
  useEffect(() => {
    if (connected && room) {
      registerRpcHandlers(room);
    }
  }, [connected, room, registerRpcHandlers]);

  // ------------------------------------------------------------------
  // Info modal handlers
  // ------------------------------------------------------------------
  const handleInfoSubmit = useCallback(
    (data: Record<string, string>) => {
      infoModal.resolve?.(JSON.stringify(data));
      setInfoModal({ open: false, fields: [], reason: '', resolve: null });
    },
    [infoModal],
  );

  const handleInfoDismiss = useCallback(() => {
    infoModal.resolve?.(JSON.stringify({ dismissed: true }));
    setInfoModal({ open: false, fields: [], reason: '', resolve: null });
  }, [infoModal]);

  return (
    <div className={cls}>
      {/* Launcher (closed) */}
      {!open && (
        <div className="bello-container bello-row">
          <div className="bello-launcher-aura">
            <AuraVisualizer
              size="sm"
              state="disconnected"
              themeMode={auraThemeMode}
              color={auraColor}
            />
          </div>
          <div className="bello-title-container">
            <div className="bello-hero">{cfg.title}</div>
            <button
              className="bello-trigger"
              onClick={() => guardedToggle(true)}
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
          {error ? (
            <>
              <div className="bello-header">
                <div className="bello-row">
                  <div className="bello-header-text">
                    <div className="bello-title">{cfg.title}</div>
                  </div>
                </div>
              </div>
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
            </>
          ) : agentOn ? (
            <RoomContext.Provider value={room}>
              <PopupContent
                opts={opts}
                sessionStarted={connecting || connected}
                connected={connected}
                onDisconnect={collapse}
                onError={(msg) => setError(msg)}
                agentMessages={agentMessages}
              />
            </RoomContext.Provider>
          ) : (
            <>
              <div className="bello-header">
                <div className="bello-row">
                  <div className="bello-header-text">
                    <div className="bello-title">{cfg.title}</div>
                    <div className="bello-subtitle">
                      UI preview - Agent disabled
                    </div>
                  </div>
                </div>
              </div>
              <div className="bello-main">
                <div className="center">
                  <p className="status">
                    UI preview - Agent disabled
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Info collection modal — rendered inside the card body */}
          <InfoCollectionModal
            open={infoModal.open}
            fields={infoModal.fields}
            reason={infoModal.reason}
            onSubmit={handleInfoSubmit}
            onDismiss={handleInfoDismiss}
          />
        </div>
      </motion.div>

      {/* FAB chevron — visible only when open */}
      {open && (
        <button
          className="bello-fab"
          onClick={collapse}
          aria-label="Collapse widget"
          title="Collapse"
        >
          <ChevronDownIcon />
        </button>
      )}
    </div>
  );
}
