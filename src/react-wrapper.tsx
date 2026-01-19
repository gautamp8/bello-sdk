'use client';
import { useEffect, useRef } from 'react';
import type { InitOptions } from './types';

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const exist = document.querySelector(`script[src="${src}"]`);
    if (exist) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
}

export default function BelloWidget(
  props: InitOptions & { embedSrc?: string }
) {
  const inited = useRef(false);
  useEffect(() => {
    const src =
      props.embedSrc ||
      (import.meta as any)?.env?.VITE_BELLO_EMBED_SRC ||
      '/bello-embed.iife.js';
    (async () => {
      await loadScriptOnce(src);
      (window as any).Bello = (window as any).Bello || [];
      if (!inited.current) {
        (window as any).Bello.push(['init', props]);
        inited.current = true;
      } else {
        (window as any).Bello.push(['update', props]);
      }
    })();
  }, [props]);
  return null;
}
