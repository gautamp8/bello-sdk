import * as React from 'react';
import { LogLevel, setLogLevel } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export const useDebugMode = ({ logLevel }: { logLevel?: LogLevel } = {}) => {
  const room = useRoomContext();

  React.useEffect(() => {
    setLogLevel(logLevel ?? 'debug');

    // @ts-expect-error - Expose room for debugging purposes in development
    window.__lk_room = room;

    return () => {
      // @ts-expect-error - Clean up debug room reference
      window.__lk_room = undefined;
    };
  }, [room, logLevel]);
};