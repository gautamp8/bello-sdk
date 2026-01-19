import * as React from 'react';

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [message, setMessage] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = message.trim();
    if (!txt) return;
    onSend(txt);
    setMessage('');
  };

  React.useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <form className="chat-input-row" onSubmit={submit}>
      <input
        ref={inputRef}
        type="text"
        className="chat-input"
        value={message}
        // disabled={disabled}
        autoComplete="off"
        placeholder={disabled ? 'Connecting…' : 'Type a message…'}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="Message"
      />
      <button
        type="submit"
        className="bello-trigger small"
        disabled={disabled || message.trim().length === 0}
        aria-label="Send"
      >
        Send
      </button>
    </form>
  );
}
