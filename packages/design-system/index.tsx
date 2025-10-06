import type { ThemeProviderProps } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './providers/theme';
import { AuthProvider } from '@repo/auth/provider';

// Export ProxyImage component
export { ProxyImage } from './components/proxy-image';
export type { ProxyImageProps } from './components/proxy-image';

// Export proxy utilities and hooks
export { getProxiedImageUrl, needsProxy, smartImageUrl } from './lib/proxy-utils';
export { useProxyImage, useProxiedUrl } from './hooks/useProxyImage';
export type { UseProxyImageOptions, UseProxyImageState } from './hooks/useProxyImage';

type DesignSystemProviderProperties = ThemeProviderProps & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
};

export const DesignSystemProvider = ({
  children,
  privacyUrl,
  termsUrl,
  helpUrl,
  ...properties
}: DesignSystemProviderProperties) => (
  <ThemeProvider {...properties}>
    <AuthProvider privacyUrl={privacyUrl} termsUrl={termsUrl} helpUrl={helpUrl}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </AuthProvider>
  </ThemeProvider>
);
