'use client';

import { MiniKitProvider as MKProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'wagmi/chains';
import type { ReactNode } from 'react';

export function MiniKitProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <MKProvider 
      projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID} 
      chain={base}
      config={{
        appearance: {
          mode: "dark",
          theme: "snake",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        }
      }}
    >
      {children}
    </MKProvider>
  );
} 