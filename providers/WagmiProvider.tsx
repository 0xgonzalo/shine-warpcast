import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { createConfig, WagmiProvider as WProvider, http } from "wagmi";
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { base } from "viem/chains";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    metaMask(),
    coinbaseWallet({ appName: 'Shine Music NFT' }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
});

export function WagmiProvider({ 
  children,
}: { 
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WProvider config={config}>
        {children}
      </WProvider>
    </QueryClientProvider>
  );
}