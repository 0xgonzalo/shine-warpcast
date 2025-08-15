'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getTotalPriceForInstaBuy, userOwnsSong, generatePseudoFarcasterId } from '../utils/contract';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { shareOnFarcasterCast } from '@/app/utils/farcaster';
import { getFarcasterUserByAddress, getFarcasterUserByFid } from '../utils/farcaster';
import { useFarcaster } from '../context/FarcasterContext';

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
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const { playAudio, currentAudio, isPlaying, addToQueue } = useAudio();
  const { address, isConnected } = useAccount();
  const { context: farcasterContext } = useFarcaster();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = buttonRef.current && buttonRef.current.contains(target);
      const clickedMenu = menuContainerRef.current && menuContainerRef.current.contains(target);
      if (!clickedButton && !clickedMenu) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const loadCreatorHandle = async () => {
      try {
        const addr = (rawData as any)?.artistAddress || (data?.creator as string | undefined);
        if (!addr) return;

        // If the creator is the connected user and we have Farcaster context, use it directly
        if (address && addr.toLowerCase() === address.toLowerCase()) {
          const ctxUsername = (farcasterContext as any)?.user?.username;
          if (ctxUsername) {
            setCreatorHandle(ctxUsername);
            return;
          }
          // Try by fid via mini app context on free plan
          const ctxFid = (farcasterContext as any)?.client?.fid;
          if (ctxFid) {
            const user = await getFarcasterUserByFid(ctxFid);
            if (user?.username) {
              setCreatorHandle(user.username);
              return;
            }
          }
        }

        // Otherwise try mapping via address (will work if wallet is verified/custody)
        const user = await getFarcasterUserByAddress(addr);
        if (user?.username) {
          setCreatorHandle(user.username);
        } else {
          setCreatorHandle(null);
        }
      } catch {
        setCreatorHandle(null);
      }
    };
    loadCreatorHandle();
  }, [rawData, data?.creator, address, farcasterContext]);

  useEffect(() => {
    const updateMenuPosition = () => {
      if (!buttonRef.current || typeof window === 'undefined') return;
      const rect = buttonRef.current.getBoundingClientRect();
      const MENU_WIDTH = 176; // w-44 in px
      const margin = 8;
      const top = rect.bottom + margin;
      let left = rect.right - MENU_WIDTH;
      left = Math.min(left, window.innerWidth - MENU_WIDTH - margin);
      left = Math.max(left, margin);
      setMenuPos({ top, left });
    };
    if (isMenuOpen) {
      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);
      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition, true);
      };
    }
  }, [isMenuOpen]);

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
    if (!isConnected || !address) {
      console.warn("Attempted to collect while not connected or no wallet address.");
      return;
    }

    // Generate pseudo-FID from wallet address for collection
    const farcasterId = generatePseudoFarcasterId(address);
    console.log('🎯 [NFTCard] Using pseudo-Farcaster ID for wallet:', address, '→', farcasterId.toString());
    
    try {
      // Clear any previous ownership error
      setOwnershipError(null);
      
      // Check if user already owns this song
      const alreadyOwns = await userOwnsSong(farcasterId, tokenId);
      if (alreadyOwns) {
        console.warn('❌ [NFTCard] User already owns this song');
        setOwnershipError('You already own this song!');
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

  // Reset hasShownModal and clear errors when a new transaction starts
  useEffect(() => {
    if (isPending) {
      setHasShownModal(false);
      setOwnershipError(null);
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
          <div className="flex-1 min-w-0 mr-2">
            <h3 
              className="md:text-lg text-sm font-semibold cursor-pointer hover:text-purple-300 transition-colors truncate"
              onClick={() => router.push(`/token/${tokenId}`)}
              title={data.name}
            >
              {data.name}
            </h3>
            <p 
              className={`md:text-xs text-[10px] cursor-pointer hover:underline truncate ${
                isDarkMode ? 'text-gray-400' : 'text-[#0000FE]'
              }`}
              onClick={handleCreatorClick}
              title={creatorHandle ? `@${creatorHandle}` : `${data.creator?.slice(0, 6)}...${data.creator?.slice(-4)}`}
            >
              {creatorHandle ? `@${creatorHandle}` : `${data.creator?.slice(0, 6)}...${data.creator?.slice(-4)}`}
            </p>
          </div>
          {isAudioAvailable && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((v) => !v);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-[#0000FE]/10 hover:bg-white/20'
                }`}
                title="Options"
                ref={buttonRef}
              >
                <svg className={`w-4 h-4 ${
                  isDarkMode ? 'text-white' : 'text-[#0000FE]'
                }`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>

              {isMenuOpen && typeof window !== 'undefined' && createPortal(
                <div
                  ref={menuContainerRef}
                  className="w-44 bg-white rounded-lg shadow-lg border z-[9999] text-sm"
                  style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      handleAddToQueue(e);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add to queue
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = typeof window !== 'undefined' ? `${window.location.origin}/token/${tokenId}` : undefined;
                      shareOnFarcasterCast({ text: `Listen and collect ${data.name}${creatorHandle ? ` by @${creatorHandle}` : ''} on Shine! 🎵`, url });
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v12H5.17L4 17.17V4z" />
                    </svg>
                    Share on Farcaster
                  </button>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleCollect}
          disabled={isPending || !isConnected}
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

        {ownershipError && (
          <div className="mt-2 text-sm text-orange-500 text-center px-2">
            {ownershipError}
          </div>
        )}
      </div>
      {showModal && txData && (
        <CollectedModal
          nft={{ 
            imageURI: getIPFSGatewayURL(data.imageURI), 
            name: data.name,
            artistUsername: creatorHandle || undefined
          }}
          txHash={txData}
          tokenPath={`/token/${tokenId}`}
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