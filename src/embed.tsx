import type { InitOptions, Theme, Cmd } from './types';
import { handleCommand } from './embed-runtime';

declare global {
  interface Window {
    Bello?: Cmd[] & { push?: (c: Cmd) => number };
  }
}

const g = (
  typeof window !== 'undefined' ? window : (globalThis as any)
) as any;
const existing = Array.isArray(g.Bello) ? g.Bello : [];
const originalPush = existing.push?.bind(existing) ?? (() => 0);

g.Bello = existing;
g.Bello.push = ((...cmds: Cmd[]) => {
  cmds.forEach(handleCommand);
  return originalPush(...cmds);
}) as any;
try {
  (window as any).Bello = g.Bello;
} catch {}

// auto-init from script tag
(function auto() {
  const thisScript =
    (document.currentScript as HTMLScriptElement | null) ||
    (document.querySelector(
      'script[data-project-id][src*="bello-embed"]'
    ) as HTMLScriptElement | null);

  if (!thisScript) return;

  const projectId =
    thisScript.getAttribute('data-project-id') || undefined;
  const apiBaseUrl =
    thisScript.getAttribute('data-api-base-url') || undefined;
  const position = thisScript.getAttribute('data-position') as
    | InitOptions['position']
    | null;
  const theme = thisScript.getAttribute('data-theme') as Theme | null;
  const orbStyle = thisScript.getAttribute('data-orb-style') as
    | InitOptions['orbStyle']
    | null;
  const agentEnabledAttr = thisScript.getAttribute(
    'data-agent-enabled'
  );
  const voiceEnabledAttr = thisScript.getAttribute(
    'data-voice-enabled'
  );

  if (!projectId) return;

  g.Bello.push([
    'init',
    {
      projectId,
      apiBaseUrl,
      position: position ?? undefined,
      theme: theme ?? undefined,
      orbStyle: orbStyle ?? undefined,
      agentEnabled:
        agentEnabledAttr != null
          ? agentEnabledAttr !== 'false'
          : undefined,
      voiceEnabled:
        voiceEnabledAttr != null
          ? voiceEnabledAttr !== 'false'
          : undefined,
    },
  ]);
})();
