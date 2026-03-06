import { createRoot } from 'react-dom/client';
import { ensureContainer, createShadowHost } from './mountShadow';
import type { InitOptions, Theme, Cmd } from './types';
import { fetchWidgetConfig } from './api';
import { BelloWidget } from './widget/BelloWidget';
import cssText from './index.css?inline';
import frontendWidgetCss from './generated/frontend-widget.css?inline';
import './polyfills';

let currentOpts: InitOptions | null = null;
let root: ReturnType<typeof createRoot> | null = null;
let shadowRootRef: ShadowRoot | null = null;
let hostEl: HTMLElement | null = null; // host element to carry CSS vars
let portalContainerRef: HTMLElement | null = null;

function mirrorHeadStylesInto(shadow: ShadowRoot) {
  const seen = new WeakSet<Node>();
  const copy = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'STYLE' && !seen.has(node)) {
      const style = document.createElement('style');
      style.textContent =
        (node as HTMLStyleElement).textContent ?? '';
      shadow.appendChild(style);
      seen.add(node);
    }
  };
  document.head.querySelectorAll('style').forEach((n) => copy(n));
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach(copy);
  });
  mo.observe(document.head, { childList: true });
}

function applyThemeVars(vars?: Record<string, string>) {
  if (!hostEl || !vars) return;
  for (const [k, v] of Object.entries(vars))
    hostEl.style.setProperty(k, v);
}

function resolveKeys(opts: InitOptions): InitOptions {
  const projectId =
    opts.projectId || (opts as any).projectKey || '';
  const widgetApiKey =
    opts.widgetApiKey || (opts as any).apiKey || '';

  return {
    ...opts,
    projectId,
    widgetApiKey,
  };
}

async function mount(opts: InitOptions) {
  const normalizedOpts = resolveKeys(opts);
  if (!normalizedOpts.projectId || !normalizedOpts.widgetApiKey) {
    console.warn(
      '[Bello] projectId/projectKey and widgetApiKey/apiKey are required. Widget will not initialize.',
    );
    return;
  }

  // Fetch server config first, then merge with local overrides
  let serverCfg;
  try {
    serverCfg = await fetchWidgetConfig(normalizedOpts);
  } catch (e) {
    console.warn('[Bello] Failed to fetch widget config, using defaults:', e);
    serverCfg = null;
  }

  // Merge: server config as base, then data attribute overrides on top
  currentOpts = {
    agentEnabled: normalizedOpts.agentEnabled ?? true,
    voiceEnabled: normalizedOpts.voiceEnabled ?? true,
    ...normalizedOpts,
    theme: normalizedOpts.theme ?? serverCfg?.theme ?? 'dark',
    accentColor:
      normalizedOpts.accentColor ?? serverCfg?.accentColor ?? '#1FD5F9',
    position:
      normalizedOpts.position ?? serverCfg?.position ?? 'bottom-right',
    widgetTitle:
      normalizedOpts.widgetTitle ?? serverCfg?.widgetTitle ?? 'Chat with AI',
    widgetSubtitle:
      normalizedOpts.widgetSubtitle ??
      serverCfg?.widgetSubtitle ??
      'Ask me anything',
    widgetButtonTitle:
      normalizedOpts.widgetButtonTitle ??
      serverCfg?.widgetButtonTitle ??
      'Start chat',
    themeVars: {
      ...(serverCfg?.themeVars ?? {}),
      ...(normalizedOpts.themeVars ?? {}),
    },
  };
  const theme = (currentOpts.theme ?? 'dark') as Theme;

  const container = ensureContainer('bello-widget-root');
  hostEl = container; // CSS vars applied here; :host in shadow can read them
  const shadow = createShadowHost(container);
  shadowRootRef = shadow;

  // Keep widget styles authoritative inside shadow root.
  // Host page styles are not mirrored by default to avoid CSS drift.

  // base runtime CSS
  const runtimeStyle = document.createElement('style');
  runtimeStyle.textContent = cssText;
  shadow.appendChild(runtimeStyle);

  // generated frontend widget CSS (tailwind + component classes)
  const frontendStyle = document.createElement('style');
  frontendStyle.textContent = frontendWidgetCss;
  shadow.appendChild(frontendStyle);

  // apply CSS variables (API/user)
  applyThemeVars(currentOpts.themeVars);

  const anchor = document.createElement('div');
  anchor.style.position = 'fixed';
  anchor.style.zIndex = '2147483647';
  const pos = currentOpts.position ?? 'bottom-right';
  const map: Record<string, Partial<CSSStyleDeclaration>> = {
    'bottom-right': { bottom: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' },
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
  };
  Object.assign(anchor.style, map[pos]);

  const mountNode = document.createElement('div');
  const portalContainer = document.createElement('div');
  portalContainer.className = 'bello-portal-root';
  anchor.appendChild(mountNode);
  anchor.appendChild(portalContainer);
  portalContainerRef = portalContainer;

  shadow.appendChild(anchor);
  root = createRoot(mountNode);
  root.render(
    <BelloWidget
      opts={currentOpts}
      theme={theme}
      onClose={() => {}}
      portalContainer={portalContainer}
    />
  );
}

function rerender() {
  if (!root || !shadowRootRef || !currentOpts) return;
  applyThemeVars(currentOpts.themeVars);
  root.render(
    <BelloWidget
      opts={currentOpts}
      theme={(currentOpts.theme ?? 'dark') as Theme}
      onClose={() => {}}
      portalContainer={portalContainerRef}
    />
  );
}

export async function initWidget(opts: InitOptions) {
  if (typeof window === 'undefined') return;
  await mount(opts);
}

export function updateWidget(opts: Partial<InitOptions>) {
  if (typeof window === 'undefined') return;
  currentOpts = {
    ...(currentOpts ?? {}),
    ...(opts ?? {}),
  } as InitOptions;
  rerender();
}

export function dispatchWidgetEvent(type: 'open' | 'close') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('bello:event', { detail: { type } })
  );
}

export async function handleCommand(cmd: Cmd) {
  const [name, payload] = cmd;
  if (name === 'init') {
    await initWidget(payload);
    return;
  }
  if (name === 'update') {
    updateWidget(payload ?? {});
    return;
  }
  if (name === 'open' || name === 'close') {
    dispatchWidgetEvent(name);
  }
}
