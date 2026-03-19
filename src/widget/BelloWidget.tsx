import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import {
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
  useVoiceAssistant,
} from '@livekit/components-react';
import { ChevronDown, X } from 'lucide-react';
import type { Room } from 'livekit-client';
import type { InfoModalState, InitOptions, Theme } from '../types';
import { useLiveKit } from './useLiveKit';
import { isSameDomain } from './domainUtils';
import {
  BelloPopupView,
} from '../frontend-sync/components/ui/bello-popup-view';
import { AgentAudioVisualizerAura } from '../frontend-sync/components/agents-ui/agent-audio-visualizer-aura';
import { InfoCollectionModal } from '../frontend-sync/components/ui/info-collection-modal';
import { Button } from '../frontend-sync/components/ui/button';
import { cn } from '../frontend-sync/lib/utils';
import {
  mapInitOptionsToAgentConfig,
} from '../frontend-adapter/agent-config';
import type {
  AgentRichMessage,
  EmbedErrorDetails,
} from '../frontend-adapter/embed-types';
import { ShadowPortalProvider } from '../frontend-adapter/ShadowPortalContext';
import { BelloWidgetLegacy } from './BelloWidgetLegacy';

declare const __BELLO_WIDGET_UI_MODE__: string;

type Position = NonNullable<InitOptions['position']>;

const POPUP_ANCHOR_MAP: Record<
  Position,
  { popup: string; origin: string }
> = {
  'bottom-right': {
    popup: 'bottom-full right-0 mb-3',
    origin: 'bottom right',
  },
  'bottom-left': {
    popup: 'bottom-full left-0 mb-3',
    origin: 'bottom left',
  },
  'top-right': {
    popup: 'top-full right-0 mt-3',
    origin: 'top right',
  },
  'top-left': {
    popup: 'top-full left-0 mt-3',
    origin: 'top left',
  },
};

function AgentAudioEnsurePlay() {
  const { audioTrack } = useVoiceAssistant();

  useEffect(() => {
    if (!audioTrack) return;

    const el = (audioTrack as any)?.attachedElements?.[0] as
      | HTMLAudioElement
      | undefined;

    const kick = (audio: HTMLMediaElement) => {
      try {
        audio.muted = false;
        (audio as any).playsInline = true;
        const promise = audio.play();
        if (promise && typeof promise.then === 'function') {
          promise.catch(() => {});
        }
      } catch {
        // no-op
      }
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
    } catch {
      // no-op
    }
  }, [audioTrack]);

  return null;
}

export function BelloWidget({
  opts,
  theme,
  onClose,
  portalContainer,
}: {
  opts: InitOptions;
  theme: Theme;
  onClose: () => void;
  portalContainer?: HTMLElement | null;
}) {
  if (__BELLO_WIDGET_UI_MODE__ === 'legacy') {
    return <BelloWidgetLegacy opts={opts} theme={theme} onClose={onClose} />;
  }

  const [open, setOpen] = useState(false);
  const [agentMessages, setAgentMessages] = useState<AgentRichMessage[]>(
    [],
  );
  const [infoModal, setInfoModal] = useState<InfoModalState>({
    open: false,
    fields: [],
    reason: '',
    resolve: null,
  });
  const [currentError, setCurrentError] =
    useState<EmbedErrorDetails | null>(null);

  const isAnimatingRef = useRef(false);
  const agentOn = opts.agentEnabled !== false;
  const agentConfig = useMemo(() => mapInitOptionsToAgentConfig(opts), [opts]);

  const { room, error, setError, connected } = useLiveKit(
    opts,
    open && agentOn,
  );

  const themeClasses = useMemo(() => {
    switch (theme) {
      case 'light':
        return {
          container:
            'bg-white border-gray-200 text-gray-900 shadow-lg pr-2 pl-2 py-3 rounded-2xl',
          button:
            'bg-black text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm',
          triggerBtn:
            'bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm border',
        };
      case 'dark':
        return {
          container:
            'bg-bello-dark-main border-bello-dark-secondary text-white shadow-2xl pr-2 pl-2 py-3 rounded-2xl',
          button:
            'bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm',
          triggerBtn:
            'bg-bello-dark-main text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm',
        };
      default:
        return {
          container:
            'bg-gray-900 border-gray-700 text-white shadow-2xl pr-2 pl-2 py-3 rounded-2xl',
          button:
            'bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm',
          triggerBtn:
            'bg-gray-800 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-colors duration-200 shadow-sm border',
        };
    }
  }, [theme]);

  const guardedToggle = useCallback((nextOpen: boolean) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setOpen(nextOpen);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 350);
  }, []);

  const resetLocalState = useCallback(() => {
    setAgentMessages([]);
    setInfoModal({ open: false, fields: [], reason: '', resolve: null });
    setCurrentError(null);
    setError(null);
  }, [setError]);

  const openWidget = useCallback(() => {
    resetLocalState();
    guardedToggle(true);
  }, [guardedToggle, resetLocalState]);

  const collapse = useCallback(() => {
    try {
      room.disconnect();
    } catch {
      // no-op
    }
    guardedToggle(false);
    resetLocalState();
    onClose();
  }, [guardedToggle, onClose, resetLocalState, room]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const t = detail?.type;
      if (t === 'open') openWidget();
      if (t === 'close') collapse();
    };

    window.addEventListener('bello:event', handler as any);
    return () => {
      window.removeEventListener('bello:event', handler as any);
    };
  }, [collapse, openWidget]);

  const cfg = useMemo(
    () => ({
      title: opts.widgetTitle ?? 'Chat with AI',
      cta: opts.widgetButtonTitle ?? 'Start chat',
      pos: (opts.position ?? 'bottom-right') as Position,
    }),
    [opts],
  );

  const anchor = POPUP_ANCHOR_MAP[cfg.pos];
  const themeClass = theme === 'dark' ? 'widget-theme-dark dark' : 'widget-theme-light';

  useEffect(() => {
    if (!error) return;

    const lowered = error.toLowerCase();
    const isRateLimit = lowered.includes('limit') || lowered.includes('429');

    setCurrentError({
      title: isRateLimit ? 'Usage Limit Reached' : 'Connection Error',
      description: error,
    });
  }, [error]);

  useEffect(() => {
    if (connected && currentError) {
      setCurrentError(null);
    }
  }, [connected, currentError]);

  const registerRpcHandlers = useCallback(
    (localRoom: Room) => {
      const lp = localRoom.localParticipant;

      lp.registerRpcMethod('client.navigate', async (data) => {
        const { url } = JSON.parse(data.payload);
        if (!isSameDomain(window.location.hostname, url)) {
          throw new Error(
            'Navigation blocked: URL is not on the same domain',
          );
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        return JSON.stringify({ success: true });
      });

      lp.registerRpcMethod('client.showMessage', async (data) => {
        const { message, url } = JSON.parse(data.payload);
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,
            message,
            url,
            timestamp: Date.now(),
          },
        ]);
        return JSON.stringify({ success: true });
      });

      lp.registerRpcMethod('client.collectInfo', async (data) => {
        const { fields, reason } = JSON.parse(data.payload);
        const result = await new Promise<string>((resolve) => {
          setInfoModal({ open: true, fields, reason, resolve });
        });
        return result;
      });

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

  useEffect(() => {
    if (connected && room) {
      registerRpcHandlers(room);
    }
  }, [connected, registerRpcHandlers, room]);

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

  const dismissError = useCallback(() => {
    const isRateLimit = currentError?.title === 'Usage Limit Reached';
    setCurrentError(null);
    setError(null);

    if (isRateLimit) {
      collapse();
    }
  }, [collapse, currentError?.title, setError]);

  return (
    <div className={cn('relative', themeClass)}>
      {open && (
        <div className="fixed inset-0 z-40" onClick={collapse} />
      )}

      <div className="relative z-50">
        {open ? (
          <button
            onClick={collapse}
            title="Close"
            className={themeClasses.triggerBtn}
          >
            <ChevronDown size={24} />
          </button>
        ) : (
          <div className={themeClasses.container}>
            <div className="flex items-center">
              <div className="flex-shrink-0 px-2">
                <AgentAudioVisualizerAura
                  size="sm"
                  state="disconnected"
                  themeMode={theme === 'light' ? 'light' : 'dark'}
                  color={opts.accentColor || '#1FD5F9'}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-lg font-bold">{cfg.title}</div>
                <button className={themeClasses.button} onClick={openWidget}>
                  {cfg.cta}
                </button>
              </div>
            </div>
          </div>
        )}

        <motion.div
          className={cn(
            `absolute ${anchor.popup}`,
            'w-[420px] max-w-[95vw] h-[620px] max-h-[85vh] min-h-[400px] rounded-xl border shadow-lg',
            themeClasses.container,
          )}
          style={{ transformOrigin: anchor.origin }}
          initial={false}
          animate={{
            opacity: open ? 1 : 0,
            scale: open ? 1 : 0.98,
            y: open ? 0 : 6,
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <div className="relative h-full w-full">
            <motion.div
              className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 p-4"
              initial={false}
              animate={{
                opacity: currentError ? 1 : 0,
                pointerEvents: currentError ? 'auto' : 'none',
              }}
            >
              <div className="flex items-center justify-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <X className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <div className="flex w-full flex-col justify-center gap-1 overflow-auto px-4 text-center bg-bello-dark p-4 rounded-lg">
                <span className="text-sm font-medium text-white">
                  {currentError?.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentError?.description}
                </span>
              </div>
              <Button onClick={dismissError} size="sm">
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </motion.div>

            {agentOn ? (
              <RoomContext.Provider value={room}>
                <ShadowPortalProvider container={portalContainer ?? null}>
                  <RoomAudioRenderer />
                  <StartAudio label="Start Audio" />
                  <AgentAudioEnsurePlay />
                  <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      opacity: currentError ? 0 : 1,
                      pointerEvents: currentError ? 'none' : 'auto',
                    }}
                  >
                    <BelloPopupView
                      config={agentConfig}
                      onDisplayError={setCurrentError}
                      disabled={!open}
                      sessionStarted={open}
                      agentMessages={agentMessages}
                    />
                  </motion.div>
                </ShadowPortalProvider>
              </RoomContext.Provider>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  UI preview - Agent disabled
                </p>
              </div>
            )}

            <InfoCollectionModal
              open={infoModal.open}
              fields={infoModal.fields}
              reason={infoModal.reason}
              theme={theme === 'light' ? 'light' : 'dark'}
              onSubmit={handleInfoSubmit}
              onDismiss={handleInfoDismiss}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
