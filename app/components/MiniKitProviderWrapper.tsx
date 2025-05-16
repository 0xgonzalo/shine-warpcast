'use client';

import { MiniKitProvider as MKProvider } from '@coinbase/onchainkit/minikit';
import { baseSepolia } from 'wagmi/chains';
import type { ReactNode } from 'react';

export function MiniKitProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <MKProvider 
      projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID} 
      chain={baseSepolia}
      config={{
        appearance: {
          mode: "dark",
          theme: "snake",
        }
      }}
    >
      {children}
    </MKProvider>
  );
} 