import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { createConfig, WagmiProvider as WProvider, http } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { baseSepolia } from "viem/chains";
import { metaMask, coinbaseWallet, injected } from "wagmi/connectors";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    farcasterFrame(),
    metaMask(),
    coinbaseWallet({ appName: 'Shine Music NFT' }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
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