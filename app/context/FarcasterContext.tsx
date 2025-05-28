'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface FarcasterContextType {
  isSDKLoaded: boolean;
  isReady: boolean;
  context: any;
  ethProvider: any;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  isReady: false,
  context: null,
  ethProvider: null,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [ethProvider, setEthProvider] = useState<any>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('🚀 Initializing Farcaster SDK...');
        
        // Initialize the SDK
        const result = await sdk.context;
        console.log('📱 Farcaster context:', result);
        setContext(result);
        
        // Get the eth provider
        if (sdk.wallet?.ethProvider) {
          console.log('💰 Farcaster wallet provider available');
          setEthProvider(sdk.wallet.ethProvider);
        }
        
        setIsSDKLoaded(true);
        
        // Call ready to dismiss the splash screen
        await sdk.actions.ready();
        console.log('✅ Farcaster SDK ready');
        setIsReady(true);
        
      } catch (error) {
        console.error('❌ Error initializing Farcaster SDK:', error);
        // Even if SDK fails, mark as loaded so app can continue
        setIsSDKLoaded(true);
        setIsReady(true);
      }
    };

    initializeSDK();
  }, []);

  return (
    <FarcasterContext.Provider value={{
      isSDKLoaded,
      isReady,
      context,
      ethProvider
    }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
} 