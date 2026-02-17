import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { useChat } from '@livekit/components-react';
import { useTrackToggle } from '@livekit/components-react';

/* ── Inline SVG Icons ── */

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5.29"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 3 3 9-3 9 19-9Z"/>
    <path d="M6 12h16"/>
  </svg>
);

const PhoneOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
    <line x1="22" x2="2" y1="2" y2="22"/>
  </svg>
);

/* ── Chat Input ── */

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const t = message.trim();
    if (!t) return;
    onSend(t);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bello-chat-input-row">
      <textarea
        ref={inputRef}
        value={message}
        placeholder="Type something..."
        onKeyDown={handleKeyDown}
        onChange={(e) => setMessage(e.target.value)}
        className="bello-chat-textarea"
        rows={1}
      />
      <button
        type="button"
        className="bello-send-btn"
        disabled={message.trim().length === 0}
        onClick={handleSend}
        aria-label="Send"
      >
        <SendIcon />
      </button>
    </div>
  );
}

/* ── Control Bar ── */

export interface ControlBarProps {
  onDisconnect?: () => void;
  isConnected?: boolean;
}

export function ControlBar({
  onDisconnect,
  isConnected = false,
}: ControlBarProps) {
  const { send } = useChat();
  const [chatOpen, setChatOpen] = useState(false);

  const { enabled: micEnabled, toggle: toggleMic } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  const handleSend = async (text: string) => {
    await send(text);
  };

  return (
    <div className="bello-control-bar">
      {/* Chat input (expandable) */}
      {chatOpen && (
        <div className="bello-chat-input-wrap">
          <ChatInput onSend={handleSend} />
        </div>
      )}

      {/* Controls row */}
      <div className="bello-controls-row">
        <div className="bello-controls-left">
          {/* Mic toggle */}
          <button
            type="button"
            className={`bello-mic-toggle ${micEnabled ? 'on' : 'off'}`}
            onClick={() => toggleMic()}
            aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <MicIcon /> : <MicOffIcon />}
          </button>

          {/* Chat toggle */}
          <button
            type="button"
            className={`bello-chat-toggle ${chatOpen ? 'on' : 'off'}`}
            onClick={() => setChatOpen(!chatOpen)}
            aria-label={chatOpen ? 'Close chat' : 'Open chat'}
          >
            <MessageIcon />
          </button>
        </div>

        {/* End call */}
        <button
          type="button"
          className="bello-end-btn"
          disabled={!isConnected}
          onClick={onDisconnect}
          aria-label="End call"
        >
          <PhoneOffIcon />
          <span>END</span>
        </button>
      </div>
    </div>
  );
}
