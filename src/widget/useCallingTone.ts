import { useEffect, useRef } from 'react';

/** Play a soft repeating dial tone using Web Audio API while the agent is connecting. */
export function useCallingTone(active: boolean) {
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
