'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PrivyProvider from './PrivyProvider';
import { WagmiProvider } from './WagmiProvider';
import { AudioProvider } from '@/app/context/AudioContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
} 