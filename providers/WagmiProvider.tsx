import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { createConfig, WagmiProvider as WProvider, http, fallback } from "wagmi";
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { base } from "viem/chains";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

const queryClient = new QueryClient();

// Build transport with fallback RPCs for resilience
const buildTransport = () => {
  const transports = [];

  // Primary: Alchemy (if configured)
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    transports.push(http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
      timeout: 10000,
      retryCount: 2,
      retryDelay: 1000,
    }));
  }

  // Fallback RPCs (public Base RPCs)
  transports.push(
    http('https://mainnet.base.org', { timeout: 10000, retryCount: 1 }),
    http('https://base.llamarpc.com', { timeout: 10000, retryCount: 1 }),
    http('https://1rpc.io/base', { timeout: 10000, retryCount: 1 }),
  );

  return fallback(transports, { rank: true });
};

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    metaMask(),
    coinbaseWallet({ appName: 'Shine Music NFT' }),
    injected(),
  ],
  transports: {
    [base.id]: buildTransport(),
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