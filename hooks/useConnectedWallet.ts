import { usePrivy, useWallets, User } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Address } from "viem";

const useConnectedWallet = () => {
  const { wallets, ready: walletsReady } = useWallets();
  const { user, logout, authenticated, ready: privyReady, linkWallet } = usePrivy();
  const [isConnecting, setIsConnecting] = useState(false);

  // Find the active wallet - prefer external wallet over privy wallet
  const externalWallet = wallets?.find(
    (wallet) => wallet.walletClientType !== "privy"
  );
  const privyWallet = wallets?.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const activeWallet = externalWallet || privyWallet;
  const connectedWallet = activeWallet?.address as Address | undefined;

  // Extract Farcaster details if available
  const farcasterProfile = user?.farcaster;

  // Handle wallet connection
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      if (!authenticated) {
        // If not authenticated, we need to handle this in the component
        // since login() is not available in this hook
        return { needsLogin: true };
      }
      
      if (wallets.length === 0) {
        // If authenticated but no wallet, link a wallet
        await linkWallet();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { error };
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-logout if no wallets are connected after initialization
  useEffect(() => {
    if (privyReady && walletsReady && authenticated && !wallets.length) {
      logout();
    }
  }, [privyReady, walletsReady, authenticated, wallets.length, logout]);

  return {
    connectedWallet,
    activeWallet,
    isConnecting,
    isReady: privyReady && walletsReady,
    isAuthenticated: authenticated,
    connectWallet,
    hasExternalWallet: !!externalWallet,
    hasPrivyWallet: !!privyWallet,
    farcasterUsername: farcasterProfile?.username,
    farcasterPfpUrl: farcasterProfile?.pfp,
    // Expose the whole farcaster profile if needed for other details later
    farcasterUser: farcasterProfile 
  };
};

export default useConnectedWallet; 