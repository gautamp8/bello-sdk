import type { BelloQueue } from './types';
declare global {
  interface Window {
    Bello?: BelloQueue;
  }
}
export {};