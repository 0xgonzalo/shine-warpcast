'use client';

import { createConfig, http, WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    farcasterFrame()
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org')
  },
  ssr: false
});

const queryClient = new QueryClient();

export function WagmiConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}