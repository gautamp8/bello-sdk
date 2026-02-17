import type {
  ConnectionDetails,
  InitOptions,
  PublicConfig,
} from './types';

declare const __BELLO_API_URL__: string;

const API_BASE =
  typeof __BELLO_API_URL__ !== 'undefined'
    ? __BELLO_API_URL__
    : 'https://api.heybello.dev';

function getBaseUrl(opts: Pick<InitOptions, 'apiBaseUrl'>): string {
  return (opts.apiBaseUrl ?? API_BASE).replace(/\/+$/, '');
}

/**
 * Fetch widget config from the server.
 * Called on SDK init to get the latest config (theme, colors, titles, position).
 */
export async function fetchWidgetConfig(
  opts: InitOptions
): Promise<PublicConfig> {
  const base = getBaseUrl(opts);
  const res = await fetch(
    `${base}/api/widget/config/${encodeURIComponent(opts.projectId)}?key=${encodeURIComponent(opts.widgetApiKey)}`,
    {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    }
  );
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);

  const wc = await res.json();

  return {
    widgetTitle: wc.widget_title ?? 'Chat with AI',
    widgetSubtitle: wc.widget_subtitle ?? 'Ask me anything',
    widgetButtonTitle: wc.widget_button_title ?? 'Start chat',
    accentColor: wc.accent_color ?? '#1FD5F9',
    theme: wc.theme ?? 'dark',
    position: wc.position ?? 'bottom-right',
  };
}

/**
 * Fetch LiveKit connection details from the public widget token endpoint.
 */
export async function fetchConnectionDetails(
  opts: InitOptions
): Promise<ConnectionDetails> {
  const base = getBaseUrl(opts);
  const res = await fetch(
    `${base}/api/widget/livekit/token/${encodeURIComponent(opts.projectId)}`,
    {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_api_key: opts.widgetApiKey }),
    }
  );
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const j = await res.json();
  return {
    serverUrl: j.livekit_url ?? j.serverUrl,
    participantToken: j.token ?? j.participantToken,
    sessionId: j.session_id ?? j.sessionId ?? '',
  };
}

/**
 * Report session end. Fire-and-forget.
 */
export function endWidgetSession(
  baseUrl: string,
  sessionId: string
): void {
  if (!sessionId) return;
  try {
    fetch(
      `${baseUrl.replace(/\/+$/, '')}/api/widget/sessions/${encodeURIComponent(sessionId)}/end`,
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }
    ).catch(() => {});
  } catch {
    // fire-and-forget
  }
}
