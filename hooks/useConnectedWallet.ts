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

  // Quick Auth authentication function
  const authenticateWithQuickAuth = async (token: string, fid: number) => {
    try {
      console.log('🔐 Authenticating with Quick Auth for FID:', fid);
      
      // Set Quick Auth user info
      setQuickAuthUser({ fid });
      setIsQuickAuthAuthenticated(true);
      setHasAttemptedAutoConnect(true);
      
      console.log('✅ Quick Auth authentication successful!');
      
      // Call ready to dismiss splash screen
      if (sdk?.actions?.ready) {
        await sdk.actions.ready();
      }
      
    } catch (error) {
      console.error('❌ Quick Auth authentication failed:', error);
      setIsQuickAuthAuthenticated(false);
      setQuickAuthUser(null);
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
                
                // Automatically authenticate with Quick Auth immediately
                await authenticateWithQuickAuth(token, context.user.fid);
                console.log('🔄 Quick Auth completed during context initialization');
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

  // Handle wallet connection - prioritize Quick Auth when in Farcaster
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // If in Farcaster with Quick Auth, use that instead of Privy
      if (isInFarcaster && quickAuthToken && farcasterUser) {
        console.log('🔐 Using Quick Auth for wallet connection');
        await authenticateWithQuickAuth(quickAuthToken, farcasterUser.fid);
        return { success: true, quickAuth: true };
      }
      
      // Fallback to Privy for non-Farcaster users
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

  // Auto-connect when running in Farcaster with Quick Auth
  const autoConnectInFarcaster = useCallback(async () => {
    console.log('🔍 Auto-connect check:', {
      isInFarcaster,
      hasAttemptedAutoConnect,
      isQuickAuthAuthenticated,
      farcasterUser: !!farcasterUser,
      quickAuthToken: !!quickAuthToken
    });

    if (
      !isInFarcaster || 
      hasAttemptedAutoConnect || 
      isQuickAuthAuthenticated ||
      !farcasterUser
    ) {
      console.log('🚫 Auto-connect skipped - conditions not met');
      return;
    }

    try {
      setIsConnecting(true);
      
      if (quickAuthToken) {
        console.log('🎯 Auto-connecting Farcaster user with Quick Auth:', farcasterUser.username);
        
        // Use Quick Auth - bypass Privy entirely
        await authenticateWithQuickAuth(quickAuthToken, farcasterUser.fid);
        console.log('✅ Quick Auth auto-connect successful!');
        return; // Exit early to prevent Privy fallback
      } else {
        console.log('⚠️ Quick Auth token not available, skipping Privy fallback to prevent modal');
        // Don't use Privy fallback - just mark as attempted to prevent loops
        setHasAttemptedAutoConnect(true);
      }
      
    } catch (error) {
      console.error('❌ Auto-connect failed:', error);
      // Reset the attempt flag so user can manually connect if needed
      setHasAttemptedAutoConnect(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isInFarcaster, hasAttemptedAutoConnect, isQuickAuthAuthenticated, farcasterUser, quickAuthToken]);

  // Trigger auto-connect when Farcaster context is detected
  useEffect(() => {
    if (isInFarcaster && farcasterUser && !hasAttemptedAutoConnect && !isQuickAuthAuthenticated) {
      // If Quick Auth is available, wait a bit longer for token to be ready
      // Otherwise, proceed with standard timing
      const delay = quickAuthToken ? 300 : 1000; // Longer delay for Privy fallback
      const timer = setTimeout(() => {
        autoConnectInFarcaster();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInFarcaster, farcasterUser, hasAttemptedAutoConnect, quickAuthToken, isQuickAuthAuthenticated, autoConnectInFarcaster]);

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
    // Prioritize Quick Auth authentication when available
    isAuthenticated: isQuickAuthAuthenticated || authenticated,
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