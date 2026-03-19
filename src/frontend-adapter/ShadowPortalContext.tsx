import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';

const ShadowPortalContext = createContext<HTMLElement | null>(null);

export function ShadowPortalProvider({
  container,
  children,
}: PropsWithChildren<{ container: HTMLElement | null }>) {
  return (
    <ShadowPortalContext.Provider value={container}>
      {children}
    </ShadowPortalContext.Provider>
  );
}

export function useShadowPortalContainer() {
  return useContext(ShadowPortalContext);
}
