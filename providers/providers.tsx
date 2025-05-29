'use client';

import type { ReactNode } from 'react';
import { WagmiConfigProvider } from './WagmiProvider';
import { AudioProvider } from '@/app/context/AudioContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiConfigProvider>
      <AudioProvider>
        {children}
      </AudioProvider>
    </WagmiConfigProvider>
  );
} 