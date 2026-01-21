import { useEffect, useRef } from 'react';
import type { InitOptions } from './types';
import { initWidget, updateWidget } from './embed-runtime';

export default function BelloWidget(props: InitOptions) {
  const inited = useRef(false);
  useEffect(() => {
    if (!inited.current) {
      initWidget(props);
      inited.current = true;
    } else {
      updateWidget(props);
    }
  }, [props]);
  return null;
}
