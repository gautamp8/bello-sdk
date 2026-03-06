import type { ReactNode } from 'react';

export type AgentRichMessage = {
  id: string;
  message: string;
  url?: string | null;
  timestamp: number;
};

export type EmbedErrorDetails = {
  title: string;
  description: string | ReactNode;
};
