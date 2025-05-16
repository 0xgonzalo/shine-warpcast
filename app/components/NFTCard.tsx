'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { useState, useEffect } from 'react';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

interface NFTCardProps {
  tokenId: bigint;
}

export default function NFTCard({ tokenId }: NFTCardProps) {
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getMetadata',
    args: [tokenId],
  });

  const { writeContract, isPending, isSuccess, data: txData } = useWriteContract();
  const [showModal, setShowModal] = useState(false);
  const { playAudio, currentAudio, isPlaying } = useAudio();

  const handlePlayAudio = () => {
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      // If it's the same audio, toggle play/pause
      if (currentAudio?.src === audioUrl) {
        playAudio(audioUrl, data.name);
      } else {
        // If it's a different audio, play it
        playAudio(audioUrl, data.name);
      }
    }
  };

  const handleCollect = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'buy',
      args: [tokenId],
      value: BigInt(777000000000000), // 0.000777 ETH in wei
    });
  };

  useEffect(() => {
    if (isSuccess && txData) {
      setShowModal(true);
    }
  }, [isSuccess, txData]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError || !data) return null;

  const { setFrameReady, isFrameReady } = useMiniKit();

  return (
    <>
      <div className="p-4 border rounded-lg bg-white/5">
        <h3 className="text-lg font-semibold mb-2">{data.name}</h3>
        <p className="text-xs text-gray-500 mb-2">
          Creator: {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
        </p>
        {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' && (
          <div className="relative group cursor-pointer" onClick={handlePlayAudio}>
            <img
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              className={`w-full h-48 object-cover rounded-lg mb-2 transition-all duration-300 ${
                currentAudio?.src === getIPFSGatewayURL(data.audioURI) && isPlaying
                  ? 'ring-2 ring-blue-500'
                  : 'hover:opacity-90'
              }`}
            />
            {data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri' && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                currentAudio?.src === getIPFSGatewayURL(data.audioURI) && isPlaying ? 'opacity-100' : ''
              }`}>
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  {currentAudio?.src === getIPFSGatewayURL(data.audioURI) && isPlaying ? (
                    <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleCollect}
          disabled={isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Collecting...' : 'Collect'}
        </button>
      </div>
      {showModal && txData && (
        <CollectedModal
          nft={{ 
            imageURI: getIPFSGatewayURL(data.imageURI), 
            name: data.name 
          }}
          txHash={txData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
} 