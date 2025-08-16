'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from './WagmiProvider';
import { AudioProvider } from '@/app/context/AudioContext';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''} 
      chain={base}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </OnchainKitProvider>
  );
} 