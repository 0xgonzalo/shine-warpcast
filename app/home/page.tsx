'use client';

import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
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
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="md:text-4xl text-2xl font-bold text-center">New Releases</h1>
          
          <div className="flex space-x-2 md:hidden">
            <button 
              onClick={() => setMobileColumns(1)}
              className={`p-1.5 border ${mobileColumns === 1 ? 'bg-[#5D2DA0] text-white' : ''} rounded flex items-center justify-center w-8 h-8`}
              aria-label="Single column view"
            >
              <div className="w-4 h-4 border-2 border-current"></div>
            </button>
            <button 
              onClick={() => setMobileColumns(2)}
              className={`p-1.5 border ${mobileColumns === 2 ? 'bg-[#5D2DA0] text-white' : ''} rounded flex items-center justify-center w-8 h-8`}
              aria-label="Double column view"
            >
              <div className="flex space-x-0.5">
                <div className="w-3 h-3 border-2 border-current"></div>
                <div className="w-3 h-3 border-2 border-current"></div>
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
    </main>
  );
}
