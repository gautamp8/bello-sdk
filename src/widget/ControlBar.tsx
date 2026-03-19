import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Track } from 'livekit-client';
import { motion } from 'motion/react';
import { useChat, useTrackToggle } from '@livekit/components-react';
import {
  LoaderIcon,
  MessageSquareTextIcon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
  SendHorizontalIcon,
} from 'lucide-react';

function MicStatusBars() {
  return (
    <span className="bello-mic-level" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ChatInput({
  chatOpen,
  onSend,
}: {
  chatOpen: boolean;
  onSend: (text: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatOpen) {
      inputRef.current?.focus();
    }
  }, [chatOpen]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      await onSend(text);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  };

  const disabled = sending || message.trim().length === 0;

  return (
    <div className="bello-chat-input-row">
      <textarea
        ref={inputRef}
        value={message}
        disabled={!chatOpen || sending}
        placeholder="Type something..."
        onKeyDown={handleKeyDown}
        onChange={(e) => setMessage(e.target.value)}
        className="bello-chat-textarea"
        rows={1}
      />
      <button
        type="button"
        className="bello-send-btn"
        disabled={disabled}
        onClick={handleSend}
        aria-label={sending ? 'Sending message' : 'Send message'}
      >
        {sending ? <LoaderIcon size={16} className="bello-spin" /> : <SendHorizontalIcon size={16} />}
      </button>
    </div>
  );
}

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
    <div className="bello-control-bar" aria-label="Voice assistant controls">
      <motion.div
        className="bello-chat-input-wrap"
        initial={false}
        animate={chatOpen ? 'visible' : 'hidden'}
        variants={{
          hidden: { height: 0, opacity: 0, marginBottom: 0 },
          visible: { height: 'auto', opacity: 1, marginBottom: 10 },
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <ChatInput chatOpen={chatOpen} onSend={handleSend} />
      </motion.div>

      <div className="bello-controls-row">
        <div className="bello-controls-left">
          <button
            type="button"
            className={`bello-mic-toggle ${micEnabled ? 'on with-bars' : 'off'}`}
            onClick={() => toggleMic()}
            aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <MicIcon size={18} /> : <MicOffIcon size={18} />}
            {micEnabled && <MicStatusBars />}
          </button>

          <button
            type="button"
            className={`bello-chat-toggle ${chatOpen ? 'on' : 'off'}`}
            onClick={() => setChatOpen(!chatOpen)}
            aria-label={chatOpen ? 'Close chat input' : 'Open chat input'}
            aria-pressed={chatOpen}
          >
            <MessageSquareTextIcon size={18} />
          </button>
        </div>

        <button
          type="button"
          className="bello-end-btn"
          disabled={!isConnected}
          onClick={onDisconnect}
          aria-label="End call"
        >
          <PhoneOffIcon size={18} />
          <span>END CALL</span>
        </button>
      </div>
    </div>
  );
}
