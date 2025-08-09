'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getTotalPriceForInstaBuy, userOwnsSong, generatePseudoFarcasterId } from '../utils/contract';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import useConnectedWallet from '@/hooks/useConnectedWallet';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

// Types for the new contract
interface SongMetadata {
  title: string;
  artistName: string;
  mediaURI: string;
  metadataURI: string;
  artistAddress: `0x${string}`;
  tags: string[];
  price: bigint;
  timesBought: bigint;
  isAnSpecialEdition: boolean;
  specialEditionName: string;
  maxSupplySpecialEdition: bigint;
}

// Legacy metadata interface for backward compatibility
interface LegacyMetadata {
  name: string;
  description: string;
  audioURI: string;
  imageURI: string;
  creator: `0x${string}`;
}

interface NFTCardProps {
  tokenId: bigint;
}

export default function NFTCard({ tokenId }: NFTCardProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { data: rawData, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getSongMetadata',
    args: [tokenId],
  });

  // Convert new SongMetadata to legacy format for backward compatibility
  const data: LegacyMetadata | undefined = rawData ? {
    name: (rawData as SongMetadata).title,
    description: '', // Not available in new contract
    audioURI: (rawData as SongMetadata).mediaURI,
    imageURI: (rawData as SongMetadata).metadataURI,
    creator: (rawData as SongMetadata).artistAddress
  } : undefined;

  const { writeContract, isPending, isSuccess, data: txData, error: txError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isReceiptError } = useWaitForTransactionReceipt({
    hash: (txData as `0x${string}` | undefined),
  });
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const { playAudio, currentAudio, isPlaying, addToQueue } = useAudio();
  const { isAuthenticated, farcasterUser, connectedWallet } = useConnectedWallet();

  const handlePlayAudio = () => {
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      const imageUrl = data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' 
        ? getIPFSGatewayURL(data.imageURI) 
        : undefined;
      const artist = data.creator ? `${data.creator.slice(0, 6)}...${data.creator.slice(-4)}` : undefined;
      
      playAudio(audioUrl, data.name, artist, imageUrl);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      const imageUrl = data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' 
        ? getIPFSGatewayURL(data.imageURI) 
        : undefined;
      const artist = data.creator ? `${data.creator.slice(0, 6)}...${data.creator.slice(-4)}` : undefined;
      addToQueue(audioUrl, data.name, artist, imageUrl);
    }
  };

  const handleCollect = async () => {
    if (!isAuthenticated || !connectedWallet) {
      console.warn("Attempted to collect while not authenticated or no wallet connected.");
      return;
    }

    // Get Farcaster ID - use real FID if available, otherwise generate pseudo-FID from wallet
    let farcasterId: bigint;
    if (farcasterUser?.fid) {
      farcasterId = BigInt(farcasterUser.fid);
      console.log('🎯 [NFTCard] Using real Farcaster ID:', farcasterId.toString());
    } else {
      farcasterId = generatePseudoFarcasterId(connectedWallet);
      console.log('🎯 [NFTCard] Using pseudo-Farcaster ID for wallet:', connectedWallet, '→', farcasterId.toString());
    }
    
    try {
      // Check if user already owns this song
      const alreadyOwns = await userOwnsSong(farcasterId, tokenId);
      if (alreadyOwns) {
        console.warn('❌ [NFTCard] User already owns this song');
        return;
      }

      // Get the correct total price (song price + operation fee)
      const totalPrice = await getTotalPriceForInstaBuy(tokenId);
      console.log('💰 [NFTCard] Total price (including fees):', totalPrice.toString(), 'wei');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'instaBuy',
        args: [
          tokenId, // songId
          farcasterId // Use actual or pseudo Farcaster ID
        ],
        value: totalPrice, // Use correct price including operation fee
      });
    } catch (error) {
      console.error('❌ [NFTCard] Error preparing collect transaction:', error);
    }
  };

  const handleCreatorClick = () => {
    if (data?.creator) {
      router.push(`/profile/${data.creator}`);
    } else {
      console.warn('Creator address not available for this NFT.');
    }
  };

  useEffect(() => {
    if (isConfirmed && receipt && receipt.status === 'success' && data && !hasShownModal) {
      setShowModal(true);
      setHasShownModal(true);
    }
  }, [isConfirmed, receipt, data, hasShownModal]);

  // Reset hasShownModal when a new transaction starts
  useEffect(() => {
    if (isPending) {
      setHasShownModal(false);
    }
  }, [isPending]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError || !data) return null;

  const isAudioAvailable = data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri';

  return (
    <>
      <div className={`w-full rounded-lg shadow-lg overflow-hidden p-2 transition-all duration-300 hover:shadow-2xl ${
        isDarkMode 
          ? 'bg-gradient-to-r from-[#323232] to-[#232323] text-white' 
          : 'bg-white/20 border border-[#0000FE] text-[#0000FE]'
      }`}>
        <div
          className="w-full aspect-square bg-gradient-to-r from-[#282828] to-[#232323] rounded-md mb-2 relative cursor-pointer group flex items-center justify-center"
          onClick={isAudioAvailable ? handlePlayAudio : undefined}
        >
          {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' ? (
            <Image
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              width={300}
              height={300}
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
                {(() => {
                  // Extract IPFS hash for comparison
                  const getIPFSHash = (url: string): string | null => {
                    const match = url.match(/\/ipfs\/([^/?#]+)/);
                    return match ? match[1] : null;
                  };
                  
                  const audioUrl = getIPFSGatewayURL(data.audioURI);
                  const newHash = getIPFSHash(audioUrl);
                  const currentHash = currentAudio?.src ? getIPFSHash(currentAudio.src) : null;
                  const isSameContent = newHash && currentHash && newHash === currentHash;
                  
                  return isPlaying && isSameContent ? (
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  );
                })()}
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
              className={`md:text-xs text-[10px] cursor-pointer hover:underline ${
                isDarkMode ? 'text-gray-400' : 'text-[#0000FE]'
              }`}
              onClick={handleCreatorClick}
            >
              {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
            </p>
          </div>
          {isAudioAvailable && (
            <button
              onClick={handleAddToQueue}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20' 
                  : 'bg-[#0000FE]/10 hover:bg-white/20'
              }`}
              title="Add to queue"
            >
              <svg className={`w-4 h-4 ${
                isDarkMode ? 'text-white' : 'text-[#0000FE]'
              }`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleCollect}
          disabled={isPending || !isAuthenticated}
          className={`w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#5D2DA0] to-[#821FA5] hover:bg-purple-700' 
              : 'bg-[#0000FE] hover:bg-blue-800'
          }`}
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
          onClose={() => {
            setShowModal(false);
            // Reset hasShownModal when user manually closes modal
            setHasShownModal(false);
          }}
        />
      )}
    </>
  );
} 