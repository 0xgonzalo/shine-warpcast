import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { createConfig, WagmiProvider as WProvider } from "@privy-io/wagmi";
import { http, type State } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { baseSepolia } from "viem/chains";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    farcasterFrame(),
    metaMask(),
    coinbaseWallet({ appName: 'Shine' }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export function WagmiProvider({ 
  children,
  initialState
}: { 
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WProvider config={config} initialState={initialState}>
        {children}
      </WProvider>
    </QueryClientProvider>
  );
}