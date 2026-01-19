declare global {
  interface Window {
    process?: any;
  }
}

if (
  typeof window !== 'undefined' &&
  (window as any).process == null
) {
  (window as any).process = {
    env: {
      NODE_ENV: (import.meta as any).env?.MODE || 'development',
    },
  };
}
export {};
