import { createRoot } from 'react-dom/client';
import { ensureContainer, createShadowHost } from './mountShadow';
import type { InitOptions, Theme, Cmd } from './types';
import { fetchPublicConfig } from './api';
import { BelloWidget } from './widget/BelloWidget';
import cssText from './index.css?inline';
import './polyfills';

let currentOpts: InitOptions | null = null;
let root: ReturnType<typeof createRoot> | null = null;
let shadowRootRef: ShadowRoot | null = null;
let hostEl: HTMLElement | null = null; // host element to carry CSS vars

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

async function mount(opts: InitOptions) {
  const publicCfg = await fetchPublicConfig(opts);
  currentOpts = {
    agentEnabled: opts.agentEnabled ?? true,
    voiceEnabled: opts.voiceEnabled ?? true,
    ...opts,
    theme: opts.theme ?? publicCfg.theme,
    orbStyle: opts.orbStyle ?? publicCfg.orbStyle,
    position: opts.position ?? publicCfg.position,
    widgetTitle: opts.widgetTitle ?? publicCfg.widgetTitle,
    widgetButtonTitle:
      opts.widgetButtonTitle ?? publicCfg.widgetButtonTitle,
    themeVars: {
      ...(publicCfg.themeVars ?? {}),
      ...(opts.themeVars ?? {}),
    },
  };
  const theme = (currentOpts.theme ?? 'dark') as Theme;

  const container = ensureContainer('bello-widget-root');
  hostEl = container; // CSS vars applied here; :host in shadow can read them
  const shadow = createShadowHost(container);
  shadowRootRef = shadow;

  // base CSS
  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
  mirrorHeadStylesInto(shadow);

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

  shadow.appendChild(anchor);
  root = createRoot(anchor);
  root.render(
    <BelloWidget
      opts={currentOpts}
      theme={theme}
      onClose={() => {}}
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
