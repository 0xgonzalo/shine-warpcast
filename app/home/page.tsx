'use client';

import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { AudioProvider } from '../context/AudioContext';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';
import NFTExists from '../components/NFTExists';

const MAX_SCAN = 20; // Scan token IDs 1 to 20

export default function HomePage() {
  const [mobileColumns, setMobileColumns] = useState(1);
  const { setFrameReady, isFrameReady } = useMiniKit();
 
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const tokenIds = Array.from({ length: MAX_SCAN }, (_, i) => BigInt(i + 1)).slice(3);

  return (
    <AudioProvider>
      <main className="min-h-screen p-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-center">New Releases</h1>
            
            <div className="flex space-x-2 md:hidden">
              <button 
                onClick={() => setMobileColumns(1)}
                className={`p-2 border ${mobileColumns === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded flex items-center justify-center w-10 h-10`}
                aria-label="Single column view"
              >
                <div className="w-6 h-6 border-2 border-current"></div>
              </button>
              <button 
                onClick={() => setMobileColumns(2)}
                className={`p-2 border ${mobileColumns === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded flex items-center justify-center w-10 h-10`}
                aria-label="Double column view"
              >
                <div className="flex space-x-1">
                  <div className="w-4 h-4 border-2 border-current"></div>
                  <div className="w-4 h-4 border-2 border-current"></div>
                </div>
              </button>
            </div>
          </div>
          
          <div className={`grid ${mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 gap-6`}>
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
