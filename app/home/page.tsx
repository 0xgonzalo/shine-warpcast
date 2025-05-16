'use client';

import { useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { AudioProvider } from '../context/AudioContext';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';
import NFTExists from '../components/NFTExists';

const MAX_SCAN = 20; // Scan token IDs 1 to 20

export default function HomePage() {
   
  const { setFrameReady, isFrameReady } = useMiniKit();
 
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const tokenIds = Array.from({ length: MAX_SCAN }, (_, i) => BigInt(i + 1));

  return (
    <AudioProvider>
      <main className="min-h-screen p-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center mx-auto w-full">Music Feed</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokenIds.map((tokenId) => (
              <NFTExists key={tokenId.toString()} tokenId={tokenId} />
            ))}
          </div>
        </div>
        <GlobalAudioPlayer />
      </main>
    </AudioProvider>
  );
}
