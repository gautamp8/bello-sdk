import type {
  ConnectionDetails,
  InitOptions,
  PublicConfig,
} from './types';

function normalizeVars(
  v: unknown
): Record<string, string> | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, any>)) {
    if (val == null) continue;
    const key = k.startsWith('--') ? k : `--${k}`;
    out[key] = String(val);
  }
  return Object.keys(out).length ? out : undefined;
}

export async function fetchPublicConfig(
  opts: InitOptions
): Promise<PublicConfig> {
  const base = opts.apiBaseUrl ?? '';
  const res = await fetch(
    `${base}/api/projects/${encodeURIComponent(opts.projectId)}`,
    {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    }
  );
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);

  const project = await res.json();
  const wc =
    project?.project?.widget_config ?? project?.widget_config ?? {};

  const themeVars =
    normalizeVars(wc.theme_vars) ||
    normalizeVars(wc.themeVars) ||
    normalizeVars(wc.css_vars) ||
    undefined;

  return {
    widgetTitle:
      wc.widget_title ?? opts.widgetTitle ?? 'Chat with AI',
    widgetButtonTitle:
      wc.widget_button_title ??
      opts.widgetButtonTitle ??
      'Start chat',
    orbStyle: wc.orb_style ?? opts.orbStyle ?? 'galaxy',
    theme: wc.theme ?? opts.theme ?? 'dark',
    position: wc.position ?? opts.position ?? 'bottom-right',
    themeVars,
  };
}

export async function fetchConnectionDetails(
  opts: InitOptions
): Promise<ConnectionDetails> {
  const base = opts.apiBaseUrl ?? '';
  const res = await fetch(
    `${base}/api/livekit/token/${encodeURIComponent(opts.projectId)}`,
    {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const j = await res.json();
  return {
    serverUrl: j.serverUrl ?? j.livekit_url,
    participantToken: j.participantToken ?? j.token,
  };
}
