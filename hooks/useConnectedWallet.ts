import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Address } from "viem";

const useConnectedWallet = () => {
  const { wallets, ready: walletsReady } = useWallets();
  const { logout, authenticated, ready: privyReady, linkWallet } = usePrivy();
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

  // Handle wallet disconnection
  const disconnectWallet = async () => {
    try {
      // Disconnect all wallets first
      for (const wallet of wallets) {
        await wallet.disconnect();
      }
      await logout();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
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
    disconnectWallet,
    hasExternalWallet: !!externalWallet,
    hasPrivyWallet: !!privyWallet
  };
};

export default useConnectedWallet; 