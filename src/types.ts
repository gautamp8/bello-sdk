export type OrbStyle =
  | 'galaxy'
  | 'ocean-depths'
  | 'caribbean'
  | 'cherry-blossom'
  | 'emerald'
  | 'multi-color'
  | 'golden-glow'
  | 'volcanic';

export type Theme = 'light' | 'dark' | 'glass';

export type InitOptions = {
  projectId: string;
  apiBaseUrl?: string;
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left';
  theme?: Theme;
  orbStyle?: OrbStyle;
  widgetTitle?: string;
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
  widgetButtonTitle: string;
  orbStyle: OrbStyle;
  theme: Theme;
  position: NonNullable<InitOptions['position']>;
  /** Server-provided CSS variables */
  themeVars?: Record<string, string>;
};

export type ConnectionDetails = {
  serverUrl: string;
  participantToken: string;
};

export type Cmd =
  | ['init', InitOptions]
  | ['open']
  | ['close']
  | ['update', Partial<InitOptions>];

export type BelloQueue = Cmd[] & { push?: (c: Cmd) => number };
