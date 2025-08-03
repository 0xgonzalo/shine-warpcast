import NFTExists from '../NFTExists';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentlyCollectedNFTs } from '../../utils/contract';
import { getIPFSGatewayURL } from '../../utils/pinata';
import { useAudio } from '../../context/AudioContext';
import Image from 'next/image';
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

interface FeedContentProps {
  mobileColumns: number;
  setMobileColumns: (columns: number) => void;
}

interface CollectedNFT {
  tokenId: bigint;
  metadata: {
    name: string;
    description: string;
    audioURI: string;
    imageURI: string;
    creator: string;
  };
  collectedAt: bigint;
}

const MAX_SCAN = 20; // Scan token IDs 1 to 20

export default function FeedContent({ mobileColumns, setMobileColumns }: FeedContentProps) {
  const router = useRouter();
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const tokenIds = Array.from({ length: MAX_SCAN }, (_, i) => BigInt(i + 1)).slice(3);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [recentlyCollected, setRecentlyCollected] = useState<CollectedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyCollected = async () => {
      try {
        setIsLoading(true);
        const collected = await getRecentlyCollectedNFTs(5); // Get top 5 recently collected
        setRecentlyCollected(collected);
      } catch (error) {
        console.error('Error fetching recently collected NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyCollected();
  }, []);

  const handleMenuToggle = (tokenId: bigint) => {
    const numericId = Number(tokenId);
    setOpenMenuId(openMenuId === numericId ? null : numericId);
  };

  const handleAction = (action: string, songTitle: string) => {
    console.log(`${action} for ${songTitle}`);
    setOpenMenuId(null);
  };

  const handlePlaySong = (nft: CollectedNFT) => {
    // Check if audio is available
    if (!nft.metadata.audioURI || nft.metadata.audioURI === 'ipfs://placeholder-audio-uri') {
      console.warn('No audio available for this NFT');
      return;
    }

    // Get the IPFS gateway URL for the audio
    const audioUrl = getIPFSGatewayURL(nft.metadata.audioURI);
    
    // Use the audio context to play the song
    playAudio(audioUrl, nft.metadata.name);
    console.log(`Playing song: ${nft.metadata.name}`);
  };

  const handleViewToken = (tokenId: bigint) => {
    // Navigate to the token detail page
    router.push(`/token/${tokenId.toString()}`);
    console.log(`Navigating to token page for token ID: ${tokenId}`);
  };

  const handleViewArtistProfile = (creator: string) => {
    // Navigate to the artist's profile page
    console.log(`Viewing artist profile for: ${creator}`);
    router.push(`/profile/${creator}`);
  };

  const generateGradient = (tokenId: bigint) => {
    const gradients = [
      "from-orange-500 via-red-500 to-blue-600",
      "from-blue-600 via-teal-500 to-purple-600",
      "from-yellow-500 via-orange-500 to-red-500",
      "from-purple-500 via-pink-500 to-red-500",
      "from-green-500 via-blue-500 to-purple-600"
    ];
    return gradients[Number(tokenId) % gradients.length];
  };

  // Helper function to check if a song is currently playing
  const isCurrentlyPlaying = (nft: CollectedNFT) => {
    if (!nft.metadata.audioURI || nft.metadata.audioURI === 'ipfs://placeholder-audio-uri') {
      return false;
    }
    const audioUrl = getIPFSGatewayURL(nft.metadata.audioURI);
    return currentAudio?.src === audioUrl && isPlaying;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="md:text-4xl text-2xl font-bold text-center">New Releases</h1>
      </div>
      
      {/* NFTExists Cards as a horizontal slider */}
      <div className="mb-12">
        <KeenNFTSlider tokenIds={tokenIds} />
      </div>

      {/* Recently Collected Songs Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Recently Collected</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-100 animate-pulse">
                <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentlyCollected.length > 0 ? (
          <div className="space-y-3">
            {recentlyCollected.map((nft) => (
              <div key={nft.tokenId.toString()} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 hover:bg-opacity-20 transition-colors relative">
                {/* Album artwork */}
                <div 
                  className={`w-16 h-16 max-w-[64px] max-h-[64px] bg-gradient-to-br ${generateGradient(nft.tokenId)} rounded-lg flex-shrink-0 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => handlePlaySong(nft)}
                >
                  {/* Use actual image if available */}
                  {nft.metadata.imageURI && nft.metadata.imageURI !== 'ipfs://placeholder-image-uri' ? (
                    <Image 
                      src={getIPFSGatewayURL(nft.metadata.imageURI)} 
                      alt={nft.metadata.name}
                      width={64}
                      height={64}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    /* Abstract art pattern fallback */
                    <div className="absolute inset-0">
                      <div className="absolute top-1 left-2 w-4 h-4 bg-white/30 rounded-full"></div>
                      <div className="absolute top-3 right-1 w-6 h-6 bg-white/20 rounded-lg rotate-45"></div>
                      <div className="absolute bottom-1 left-1 w-5 h-5 bg-white/25 rounded-full"></div>
                      <div className="absolute bottom-2 right-2 w-3 h-8 bg-white/30 rounded-full rotate-12"></div>
                    </div>
                  )}
                  
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {isCurrentlyPlaying(nft) ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                </div>
                
                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-lg text-white truncate cursor-pointer hover:text-purple-300 transition-colors"
                    onClick={() => handleViewToken(nft.tokenId)}
                  >
                    {nft.metadata.name}
                  </h3>
                  <p 
                    className="text-gray-300 text-sm cursor-pointer hover:text-purple-300 transition-colors"
                    onClick={() => handleViewArtistProfile(nft.metadata.creator)}
                  >
                    {nft.metadata.creator.slice(0, 6)}...{nft.metadata.creator.slice(-4)}
                  </p>
                </div>
                
                {/* Three dots menu */}
                <div className="relative">
                  <button 
                    onClick={() => handleMenuToggle(nft.tokenId)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {openMenuId === Number(nft.tokenId) && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <div className="py-1">
                        <button 
                          onClick={() => handleAction('Add to queue', nft.metadata.name)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add to queue</span>
                        </button>
                        <button 
                          onClick={() => handleAction('Like', nft.metadata.name)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>Like</span>
                        </button>
                        <button 
                          onClick={() => handleAction('Collect', nft.metadata.name)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span>Collect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No recently collected songs found.</p>
            <p className="text-sm mt-2">Songs will appear here when users collect them!</p>
          </div>
        )}
      </div>
    </>
  );
}

function KeenNFTSlider({ tokenIds }: { tokenIds: bigint[] }) {
  const [availableTokenIds, setAvailableTokenIds] = useState<bigint[]>([]);
  useEffect(() => {
    let isMounted = true;
    async function checkExists() {
      const { checkNFTExists } = await import('../../utils/contract');
      const checks = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const exists = await checkNFTExists(tokenId);
            return exists ? tokenId : null;
          } catch {
            return null;
          }
        })
      );
      if (isMounted) setAvailableTokenIds(checks.filter(Boolean) as bigint[]);
    }
    checkExists();
    return () => { isMounted = false; };
  }, [tokenIds]);

  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    mode: 'free-snap',
    slides: { perView: 2.2, spacing: 12, origin: 'auto' },
    breakpoints: {
      '(min-width: 640px)': { slides: { perView: 3.2, spacing: 20, origin: 'auto' } },
      '(min-width: 1024px)': { slides: { perView: 4.2, spacing: 24, origin: 'auto' } },
    },
  });

  // Refresh slider when availableTokenIds change
  useEffect(() => {
    if (slider.current) {
      slider.current.update();
    }
  }, [availableTokenIds, slider]);

  return (
    <div ref={sliderRef} className="keen-slider py-2">
      {availableTokenIds.map((tokenId) => (
        <div key={tokenId.toString()} className="keen-slider__slide">
          <NFTExists tokenId={tokenId} />
        </div>
      ))}
    </div>
  );
} 