import { usePrivy, useWallets, User } from "@privy-io/react-auth";
import { useEffect, useState, useCallback } from "react";
import { Address } from "viem";

// Import Farcaster Frame SDK
let sdk: any = null;
if (typeof window !== 'undefined') {
  // Dynamically import the SDK only on client side
  import('@farcaster/frame-sdk').then((module) => {
    sdk = module.sdk;
  });
}

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
}

const useConnectedWallet = () => {
  const { wallets, ready: walletsReady } = useWallets();
  const { user, logout, authenticated, ready: privyReady, linkWallet, login } = usePrivy();
  const [isConnecting, setIsConnecting] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false);

  // Find the active wallet - prefer external wallet over privy wallet
  const externalWallet = wallets?.find(
    (wallet) => wallet.walletClientType !== "privy"
  );
  const privyWallet = wallets?.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const activeWallet = externalWallet || privyWallet;
  const connectedWallet = activeWallet?.address as Address | undefined;

  // Check if we're running inside a Farcaster client and get user context
  useEffect(() => {
    const initializeFarcasterContext = async () => {
      if (typeof window === 'undefined' || !sdk) return;

      try {
        // Check if we're in a Farcaster context
        const context = await sdk.context;
        if (context?.user) {
          setIsInFarcaster(true);
          setFarcasterUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
            bio: context.user.bio
          });
          console.log('🎯 Farcaster user context detected:', context.user);
          console.log('🔄 Auto-connect will be attempted...');
        } else {
          setIsInFarcaster(false);
          console.log('📱 Not running in Farcaster client');
        }
      } catch (error) {
        console.log('📱 Not in Farcaster context:', error);
        setIsInFarcaster(false);
      }
    };

    // Wait a bit for SDK to load
    const timer = setTimeout(initializeFarcasterContext, 100);
    return () => clearTimeout(timer);
  }, []);

  // Extract Farcaster details - prioritize Frame SDK data over Privy data
  const farcasterProfile = user?.farcaster;
  const finalFarcasterUsername = farcasterUser?.username || farcasterProfile?.username;
  const finalFarcasterPfpUrl = farcasterUser?.pfpUrl || farcasterProfile?.pfp;

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

  // Auto-connect when running in Farcaster
  const autoConnectInFarcaster = useCallback(async () => {
    if (
      !isInFarcaster || 
      hasAttemptedAutoConnect || 
      authenticated || 
      !privyReady ||
      !farcasterUser
    ) {
      return;
    }

    try {
      setHasAttemptedAutoConnect(true);
      setIsConnecting(true);
      console.log('🎯 Auto-connecting Farcaster user:', farcasterUser.username);
      
      // Attempt to login with Farcaster as the preferred method
      await login({
        loginMethods: ['farcaster']
      });
      
      console.log('✅ Auto-connect successful for Farcaster user!');
      
    } catch (error) {
      console.error('❌ Auto-connect failed:', error);
      // Reset the attempt flag so user can manually connect if needed
      setHasAttemptedAutoConnect(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isInFarcaster, hasAttemptedAutoConnect, authenticated, privyReady, farcasterUser, login]);

  // Trigger auto-connect when Farcaster context is detected
  useEffect(() => {
    if (isInFarcaster && farcasterUser && !hasAttemptedAutoConnect) {
      // Small delay to ensure all initialization is complete
      const timer = setTimeout(() => {
        autoConnectInFarcaster();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInFarcaster, farcasterUser, hasAttemptedAutoConnect, autoConnectInFarcaster]);

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
    farcasterUsername: finalFarcasterUsername,
    farcasterPfpUrl: finalFarcasterPfpUrl,
    isInFarcaster,
    hasAttemptedAutoConnect,
    // Expose the whole farcaster profile if needed for other details later
    farcasterUser: farcasterUser || farcasterProfile 
  };
};

export default useConnectedWallet; 