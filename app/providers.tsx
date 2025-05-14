'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors';

// Ensure the environment variable is set
if (typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID !== 'string') {
  throw new Error('Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable');
}

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'Audio NFT DApp' }),
    injected(), // fallback for any injected wallet
  ],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6', // blue-500
          showWalletLoginFirst: true,
        },
        loginMethods: ['wallet'],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}

