'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { useState, useEffect } from 'react';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';

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
  const { playAudio, currentAudio, isPlaying, addToQueue } = useAudio();

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

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handlePlayAudio
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      addToQueue(audioUrl, data.name);
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


  return (
    <>
      <div className="rounded-lg bg-[#282828]">
      
        {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' && (
          <div className="relative group cursor-pointer" onClick={handlePlayAudio}>
            <img
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              className={`w-full h-[200] object-cover rounded-t-lg mb-2 transition-all duration-300 ${
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
        <div className="flex items-center justify-between px-2 mb-2">
          <div>
            <h3 className="text-lg font-semibold">{data.name}</h3>
            <p className="text-xs text-gray-500">
              {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
            </p>
          </div>
          {data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri' && (
            <button
              onClick={handleAddToQueue}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Add to queue"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleCollect}
          disabled={isPending}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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