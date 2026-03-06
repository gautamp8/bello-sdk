import type { InitOptions, Theme } from '../types';

export type AgentConfig = {
  projectId: string;
  design?: {
    widgetTitle: string;
    widgetSubtitle: string;
    widgetButtonTitle: string;
    theme: Theme;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    accentColor?: string;
  };
};

export function mapInitOptionsToAgentConfig(opts: InitOptions): AgentConfig {
  const theme = (opts.theme ?? 'dark') as Theme;
  const position = (opts.position ?? 'bottom-right') as
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left';

  return {
    projectId: opts.projectId,
    design: {
      widgetTitle: opts.widgetTitle ?? 'Chat with AI',
      widgetSubtitle: opts.widgetSubtitle ?? 'Ask me anything',
      widgetButtonTitle: opts.widgetButtonTitle ?? 'Start chat',
      theme,
      position,
      accentColor: opts.accentColor,
    },
  };
}
