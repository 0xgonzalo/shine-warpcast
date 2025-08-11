'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getTotalPriceForInstaBuy, userOwnsSong, generatePseudoFarcasterId } from '../../utils/contract';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../../context/AudioContext';
import { useTheme } from '../../context/ThemeContext';
import { useAccount } from 'wagmi';
import CollectedModal from '../../components/CollectedModal';
import Image from 'next/image';

// This is the legacy format the component expects
interface NFTMetadata {
  name: string;
  description: string;
  audioURI: string;
  imageURI: string;
  creator: `0x${string}`;
}

export default function TokenPage() {
  const params = useParams();
  const tokenId = BigInt(params.tokenId as string);
  const { isDarkMode } = useTheme();
  const { address, isConnected } = useAccount();
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTxHash, setCollectTxHash] = useState<string | null>(null);
  
  const { data: rawData, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getSongMetadata',
    args: [tokenId],
  });

  // Adapt the new contract data to the legacy format used by this component
  const data: NFTMetadata | undefined = rawData ? {
    name: (rawData as any).title,
    description: '', // Not available in new contract
    audioURI: (rawData as any).mediaURI,
    imageURI: (rawData as any).metadataURI, // Using metadataURI as a fallback for the image
    creator: (rawData as any).artistAddress
  } : undefined;

  // Extract price from raw data
  const tokenPrice = rawData ? (rawData as any).price : BigInt(0);

  const { currentAudio, isPlaying, playAudio, setIsPlaying, currentTime, duration, seekTo } = useAudio();
  const { writeContract, isPending: isCollectPending, isSuccess: isCollectSuccess, data: collectTxData, error: collectError } = useWriteContract();
  const { data: collectReceipt, isLoading: isCollectConfirming, isSuccess: isCollectConfirmed, isError: isCollectReceiptError } = useWaitForTransactionReceipt({
    hash: (collectTxData as `0x${string}` | undefined),
  });


  const handlePlayPause = () => {
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      if (currentAudio?.src === audioUrl) {
        setIsPlaying(!isPlaying);
      } else {
        playAudio(audioUrl, data.name);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format price from wei to ETH for display
  const formatPrice = (priceInWei: bigint) => {
    const ethValue = Number(priceInWei) / 1e18;
    return ethValue.toFixed(6).replace(/\.?0+$/, ''); // Remove trailing zeros
  };

  const handleCollect = async () => {
    if (!isConnected || !address) {
      console.warn("Attempted to collect while not connected or no wallet address.");
      return;
    }

    // Generate pseudo-FID from wallet address for collection
    const farcasterId = generatePseudoFarcasterId(address);
    console.log('🎯 [TokenPage] Using pseudo-Farcaster ID for wallet:', address, '→', farcasterId.toString());
    
    try {
      // Check if user already owns this song
      const alreadyOwns = await userOwnsSong(farcasterId, tokenId);
      if (alreadyOwns) {
        console.warn('❌ [TokenPage] User already owns this song');
        return;
      }

      // Get the correct total price (song price + operation fee)
      const totalPrice = await getTotalPriceForInstaBuy(tokenId);
      console.log('💰 [TokenPage] Total price (including fees):', totalPrice.toString(), 'wei');

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
      console.error('❌ [TokenPage] Error preparing collect transaction:', error);
    }
  };

  // Show modal on successful collect after confirmation
  useEffect(() => {
    if (isCollectConfirmed && collectReceipt && collectReceipt.status === 'success' && data) {
      setCollectTxHash((collectTxData as string) || null);
      setShowCollectModal(true);
    }
    if ((isCollectReceiptError || (isCollectConfirmed && collectReceipt && collectReceipt.status === 'reverted')) && collectTxData) {
      setShowCollectModal(false);
      setCollectTxHash(null);
    }
  }, [isCollectConfirmed, isCollectReceiptError, collectReceipt, collectTxData, data]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e]' 
          : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
        <div className={`text-lg ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Loading...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e]' 
          : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
        <div className={`text-lg ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Token not found</div>
      </div>
    );
  }

  const isAudioAvailable = data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri';
  const audioUrl = isAudioAvailable ? getIPFSGatewayURL(data.audioURI) : '';

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white' 
        : 'bg-transparent text-gray-800'
    }`}>
      {/* Starry background effect - only show in dark mode */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-60 animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pt-8">
        {/* Album Art */}
        <div className="w-64 h-64 mb-6 rounded-lg overflow-hidden shadow-2xl">
          {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' ? (
            <Image
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              width={256}
              height={256}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-600 to-gray-800' 
                : 'bg-gradient-to-br from-gray-200 to-gray-300'
            }`}>
              <svg className={`w-16 h-16 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Song Info */}
        <h1 className={`text-2xl font-bold mb-2 text-center ${
          isDarkMode ? 'text-white' : 'text-[#0000FE]'
        }`}>{data.name}</h1>
        <p className={`mb-6 text-center ${
          isDarkMode ? 'text-gray-300' : 'text-blue-800'
        }`}>
          {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
        </p>

        {/* Audio Controls */}
        {isAudioAvailable && (
          <>
            {/* Progress Bar */}
            <div className="w-full max-w-xs mb-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer slider ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-800'
                }`}
                style={{
                  background: isDarkMode 
                    ? `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 100%)`
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #94a3b8 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #94a3b8 100%)`
                }}
              />
              <div className={`flex justify-between text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-4 mb-6">


              <button className={`w-8 h-8 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18V6h2v6l8.5-6v12l-8.5-6v6z"/>
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform ${
                  isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isPlaying && currentAudio?.src === audioUrl ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button className={`w-8 h-8 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

            </div>

            {/* Collect Button */}
            <button
              onClick={handleCollect}
              disabled={!isConnected || isCollectPending}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                !isConnected
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : isCollectPending
                  ? isDarkMode
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 shadow-lg'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:scale-105 shadow-lg'
              }`}
            >
              {isCollectPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Collecting...</span>
                </div>
              ) : !isConnected ? (
                'Connect Wallet to Collect'
              ) : (
                `✨ Collect (${formatPrice(tokenPrice)} ETH)`
              )}
            </button>
          </>
        )}


      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${isDarkMode ? '#ffffff' : '#3b82f6'};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${isDarkMode ? '#ffffff' : '#3b82f6'};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Collect Success Modal */}
      {showCollectModal && data && collectTxHash && (
        <CollectedModal
          nft={{ imageURI: data.imageURI, name: data.name }}
          txHash={collectTxHash}
          tokenPath={`/token/${tokenId}`}
          onClose={() => setShowCollectModal(false)}
        />
      )}
    </div>
  );
} 