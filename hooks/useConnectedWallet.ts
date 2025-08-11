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
  const [quickAuthToken, setQuickAuthToken] = useState<string | null>(null);
  const [quickAuthUser, setQuickAuthUser] = useState<{ fid: number; primaryAddress?: string } | null>(null);
  const [isQuickAuthAuthenticated, setIsQuickAuthAuthenticated] = useState(false);

  // Find the active wallet - prefer external wallet over privy wallet
  const externalWallet = wallets?.find(
    (wallet) => wallet.walletClientType !== "privy"
  );
  const privyWallet = wallets?.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const activeWallet = externalWallet || privyWallet;
  const connectedWallet = activeWallet?.address as Address | undefined;

  // Simple function to store Quick Auth info for backend requests
  const storeQuickAuthInfo = async (token: string, fid: number) => {
    try {
      console.log('🔐 Storing Quick Auth info for FID:', fid);
      setQuickAuthToken(token);
      setQuickAuthUser({ fid });
      setIsQuickAuthAuthenticated(true);
      console.log('✅ Quick Auth info stored - can be used for authenticated backend requests');
    } catch (error) {
      console.error('❌ Error storing Quick Auth info:', error);
    }
  };

  // Check if we're running inside a Farcaster client and get user context with Quick Auth
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
          
          // Try to get Quick Auth token for automatic authentication
          try {
            console.log('🔍 Checking Quick Auth availability:', {
              hasQuickAuth: !!sdk.quickAuth,
              hasGetToken: !!sdk.quickAuth?.getToken
            });
            
            if (sdk.quickAuth?.getToken) {
              console.log('🔐 Attempting to get Quick Auth token...');
              const { token } = await sdk.quickAuth.getToken();
              console.log('🔍 Quick Auth token result:', { hasToken: !!token });
              
              if (token) {
                setQuickAuthToken(token);
                console.log('✅ Quick Auth token obtained successfully');
                
                // Store Quick Auth info for later use
                await storeQuickAuthInfo(token, context.user.fid);
                console.log('🔄 Quick Auth info stored during context initialization');
              } else {
                console.log('⚠️ Quick Auth token not available');
              }
            } else {
              console.log('⚠️ Quick Auth not available in SDK');
            }
          } catch (authError) {
            console.log('❌ Quick Auth failed:', authError);
          }
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
        return { needsLogin: true };
      }
      
      if (wallets.length === 0) {
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
    console.log('🔍 Auto-connect check:', {
      isInFarcaster,
      hasAttemptedAutoConnect,
      authenticated,
      farcasterUser: !!farcasterUser,
      privyReady
    });

    if (
      !isInFarcaster || 
      hasAttemptedAutoConnect || 
      authenticated ||
      !privyReady ||
      !farcasterUser
    ) {
      console.log('🚫 Auto-connect skipped - conditions not met');
      return;
    }

    try {
      setHasAttemptedAutoConnect(true);
      setIsConnecting(true);
      
      console.log('🎯 Auto-connecting Farcaster user:', farcasterUser.username);
      
      // Use Farcaster login method - this should use the farcasterFrame connector
      await login({
        loginMethods: ['farcaster']
      });
      
      console.log('✅ Farcaster auto-connect successful!');
      
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
    if (isInFarcaster && farcasterUser && !hasAttemptedAutoConnect && !authenticated) {
      // Small delay to ensure SDK is fully loaded
      const timer = setTimeout(() => {
        autoConnectInFarcaster();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInFarcaster, farcasterUser, hasAttemptedAutoConnect, authenticated, autoConnectInFarcaster]);

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
    isAuthenticated: authenticated, // Use Privy authentication state
    connectWallet,
    hasExternalWallet: !!externalWallet,
    hasPrivyWallet: !!privyWallet,
    farcasterUsername: finalFarcasterUsername,
    farcasterPfpUrl: finalFarcasterPfpUrl,
    isInFarcaster,
    hasAttemptedAutoConnect,
    quickAuthToken,
    isQuickAuthAuthenticated,
    quickAuthUser,
    // Expose the whole farcaster profile if needed for other details later
    farcasterUser: farcasterUser || farcasterProfile 
  };
};

export default useConnectedWallet; 