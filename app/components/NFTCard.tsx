'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { useState, useEffect } from 'react';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import useConnectedWallet from '@/hooks/useConnectedWallet';
import { useRouter } from 'next/navigation';

interface NFTCardProps {
  tokenId: bigint;
}

export default function NFTCard({ tokenId }: NFTCardProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getMetadata',
    args: [tokenId],
  });

  const { writeContract, isPending, isSuccess, data: txData, error: txError } = useWriteContract();
  const [showModal, setShowModal] = useState(false);
  const { playAudio, currentAudio, isPlaying, addToQueue } = useAudio();
  const { isAuthenticated } = useConnectedWallet();

  const handlePlayAudio = () => {
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      if (currentAudio?.src === audioUrl) {
        playAudio(audioUrl, data.name);
      } else {
        playAudio(audioUrl, data.name);
      }
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      addToQueue(audioUrl, data.name);
    }
  };

  const handleCollect = () => {
    if (!isAuthenticated) {
      console.warn("Attempted to collect while not authenticated.");
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'buy',
      args: [tokenId],
      value: BigInt(777000000000000), // 0.000777 ETH in wei
    });
  };

  const handleCreatorClick = () => {
    if (data?.creator) {
      router.push(`/profile/${data.creator}`);
    } else {
      console.warn('Creator address not available for this NFT.');
    }
  };

  useEffect(() => {
    if (isSuccess && txData) {
      setShowModal(true);
    }
  }, [isSuccess, txData]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError || !data) return null;

  const isAudioAvailable = data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri';

  return (
    <>
      <div className="w-full bg-gradient-to-r from-[#323232] to-[#232323] text-white rounded-lg shadow-lg overflow-hidden p-2 transition-all duration-300 hover:shadow-2xl">
        <div
          className="w-full aspect-square bg-gradient-to-r from-[#282828] to-[#232323] rounded-md mb-2 relative cursor-pointer group flex items-center justify-center"
          onClick={isAudioAvailable ? handlePlayAudio : undefined}
        >
          {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' ? (
            <img
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-600">
              <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 12v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
          )}
          {isAudioAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                {isPlaying && currentAudio?.src === getIPFSGatewayURL(data.audioURI) ? (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between md:px-2 mb-2">
          <div>
            <h3 
              className="md:text-lg text-sm font-semibold cursor-pointer hover:text-purple-300 transition-colors"
              onClick={() => router.push(`/token/${tokenId}`)}
            >
              {data.name}
            </h3>
            <p 
              className="md:text-xs text-[10px] text-gray-500 cursor-pointer hover:underline"
              onClick={handleCreatorClick}
            >
              {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
            </p>
          </div>
          {isAudioAvailable && (
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
          disabled={isPending || !isAuthenticated}
          className="w-full px-4 py-2 bg-gradient-to-r from-[#5D2DA0] to-[#821FA5] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Collecting...' : 'Collect'}
        </button>

        {txError && (
          <div className="mt-2 text-sm text-red-500 text-center px-2">
            {'Transaction failed. Please try again.'}
          </div>
        )}
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