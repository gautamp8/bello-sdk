export type Theme = 'light' | 'dark';

export type InitOptions = {
  /** Preferred identifier for SDK usage */
  projectId: string;
  /** Preferred API key for SDK usage */
  widgetApiKey: string;
  /** Alias for projectId (useful for script-tag users) */
  projectKey?: string;
  /** Alias for widgetApiKey (useful for script-tag users) */
  apiKey?: string;
  apiBaseUrl?: string;
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left';
  theme?: Theme;
  accentColor?: string;
  widgetTitle?: string;
  widgetSubtitle?: string;
  widgetButtonTitle?: string;

  /** Master switch: when false, no LiveKit connect (UI-only). Default: true */
  agentEnabled?: boolean;

  /** Voice playback & visualizer toggle. Default: true */
  voiceEnabled?: boolean;

  /** Optional CSS variables map (e.g. {"--bello-bg":"#101010"}) */
  themeVars?: Record<string, string>;
};

export type PublicConfig = {
  widgetTitle: string;
  widgetSubtitle: string;
  widgetButtonTitle: string;
  accentColor: string;
  theme: Theme;
  position: NonNullable<InitOptions['position']>;
  /** Server-provided CSS variables */
  themeVars?: Record<string, string>;
};

export type ConnectionDetails = {
  serverUrl: string;
  participantToken: string;
  sessionId: string;
};

export type Cmd =
  | ['init', InitOptions]
  | ['open']
  | ['close']
  | ['update', Partial<InitOptions>];

export type BelloQueue = Cmd[] & { push?: (c: Cmd) => number };

export type AgentRichMessage = {
  id: string;
  message: string;
  url?: string | null;
  timestamp: number;
};

export type InfoModalState = {
  open: boolean;
  fields: string[];
  reason: string;
  resolve: ((value: string) => void) | null;
};
