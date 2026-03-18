import type {
  ConnectionDetails,
  InitOptions,
  PublicConfig,
} from './types';

declare const __BELLO_API_URL__: string;

const API_BASE =
  typeof __BELLO_API_URL__ !== 'undefined'
    ? __BELLO_API_URL__
    : 'https://www.heybello.dev/api';

function getBaseUrl(opts: Pick<InitOptions, 'apiBaseUrl'>): string {
  return (opts.apiBaseUrl ?? API_BASE).replace(/\/+$/, '');
}

function normalizeVars(
  value: unknown
): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (raw == null) continue;
    out[key.startsWith('--') ? key : `--${key}`] = String(raw);
  }

  return Object.keys(out).length ? out : undefined;
}

async function fetchJson(
  url: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(url, init);
  const text = await res.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function extractWidgetConfig(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) return null;

  const project = asRecord(record.project);
  const nestedWidgetConfig = project && asRecord(project.widget_config);
  if (nestedWidgetConfig) return nestedWidgetConfig;

  const widgetConfig = asRecord(record.widget_config);
  if (widgetConfig) return widgetConfig;

  return record;
}

function extractConnectionDetails(
  value: unknown
): ConnectionDetails | null {
  const record = asRecord(value);
  if (!record) return null;

  const serverUrl = record.livekit_url ?? record.serverUrl;
  const participantToken = record.token ?? record.participantToken;
  const sessionId = record.session_id ?? record.sessionId ?? '';

  if (
    typeof serverUrl !== 'string' ||
    typeof participantToken !== 'string'
  ) {
    return null;
  }

  return {
    serverUrl,
    participantToken,
    sessionId: typeof sessionId === 'string' ? sessionId : '',
  };
}

function readString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readTheme(
  record: Record<string, unknown>
): PublicConfig['theme'] | undefined {
  const value = readString(record, 'theme');
  return value === 'light' || value === 'dark' ? value : undefined;
}

function readPosition(
  record: Record<string, unknown>
): PublicConfig['position'] | undefined {
  const value = readString(record, 'position');
  return value === 'bottom-right' ||
    value === 'bottom-left' ||
    value === 'top-right' ||
    value === 'top-left'
    ? value
    : undefined;
}

/**
 * Fetch widget config from the server.
 * Called on SDK init to get the latest config (theme, colors, titles, position).
 */
export async function fetchWidgetConfig(
  opts: InitOptions
): Promise<PublicConfig> {
  const base = getBaseUrl(opts);
  const headers = { Accept: 'application/json' };
  const configUrl =
    `${base}/api/widget/config/${encodeURIComponent(opts.projectId)}` +
    `?key=${encodeURIComponent(opts.widgetApiKey)}`;
  const projectUrl =
    `${base}/api/projects/${encodeURIComponent(opts.projectId)}`;

  let wc: Record<string, unknown> | null = null;

  try {
    const widgetRes = await fetchJson(configUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers,
    });
    if (widgetRes.ok) {
      wc = extractWidgetConfig(widgetRes.data);
    }
  } catch (err) {
    try {
      const projectRes = await fetchJson(projectUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers,
      });
      if (!projectRes.ok) {
        throw new Error(`Config fetch failed: ${projectRes.status}`);
      }
      wc = extractWidgetConfig(projectRes.data);
    } catch {
      throw err;
    }
  }

  if (!wc) {
    const projectRes = await fetchJson(projectUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers,
    });
    if (!projectRes.ok) {
      throw new Error(`Config fetch failed: ${projectRes.status}`);
    }
    wc = extractWidgetConfig(projectRes.data);
  }

  if (!wc) {
    throw new Error('Config fetch failed: invalid response');
  }

  return {
    widgetTitle: readString(wc, 'widget_title') ?? 'Chat with AI',
    widgetSubtitle:
      readString(wc, 'widget_subtitle') ?? 'Ask me anything',
    widgetButtonTitle:
      readString(wc, 'widget_button_title') ?? 'Start chat',
    accentColor: readString(wc, 'accent_color') ?? '#1FD5F9',
    theme: readTheme(wc) ?? 'dark',
    position: readPosition(wc) ?? 'bottom-right',
    themeVars:
      normalizeVars(wc.theme_vars) ??
      normalizeVars(wc.themeVars) ??
      normalizeVars(wc.css_vars),
  };
}

/**
 * Fetch LiveKit connection details from the public widget token endpoint.
 */
export async function fetchConnectionDetails(
  opts: InitOptions
): Promise<ConnectionDetails> {
  const base = getBaseUrl(opts);
  const projectId = encodeURIComponent(opts.projectId);
  const init = {
    method: 'POST',
    mode: 'cors' as const,
    credentials: 'omit' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widget_api_key: opts.widgetApiKey }),
  };
  const endpoints = [
    `${base}/api/widget/livekit-token/${projectId}`,
    `${base}/api/widget/livekit/token/${projectId}`,
    `${base}/api/livekit/token/${projectId}`,
  ];

  let lastStatus = 0;
  let lastError: unknown = null;
  let details: ConnectionDetails | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetchJson(endpoint, init);
      lastStatus = res.status;
      if (!res.ok) {
        continue;
      }
      details = extractConnectionDetails(res.data);
      if (details) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!details) {
    if (lastError) throw lastError;
    throw new Error(`Token fetch failed: ${lastStatus || 'unknown'}`);
  }

  return details;
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
    const base = baseUrl.replace(/\/+$/, '');
    const encodedSessionId = encodeURIComponent(sessionId);
    const endpoints = [
      `${base}/api/widget/sessions/${encodedSessionId}/end`,
      `${base}/api/sessions/${encodedSessionId}/end`,
    ];

    void (async () => {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          });
          if (res.ok) return;
        } catch {
          // try the next endpoint
        }
      }
    })();
  } catch {
    // fire-and-forget
  }
}
