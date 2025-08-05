import NFTExists from '../NFTExists';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentlyCollectedNFTs, getTotalSongCount } from '../../utils/contract';
import { getIPFSGatewayURL } from '../../utils/pinata';
import { useAudio } from '../../context/AudioContext';
import Image from 'next/image';
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'
import dynamic from 'next/dynamic';
import { useTheme } from '../../context/ThemeContext';

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

const MAX_DISPLAY = 15; // Show last 15 songs

const RecentlyCollectedSection = dynamic(() => import('./RecentlyCollectedSection'), { ssr: false, loading: () => <div>Loading recently collected...</div> });

export default function FeedContent({ mobileColumns, setMobileColumns }: FeedContentProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [recentlyCollected, setRecentlyCollected] = useState<CollectedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch latest token IDs dynamically
  useEffect(() => {
    const fetchLatestTokenIds = async () => {
      try {
        setIsLoadingTokens(true);
        console.log('🔍 Fetching total song count...');
        
        const totalSongs = await getTotalSongCount();
        console.log('📊 Total songs in contract:', totalSongs.toString());
        
        if (totalSongs === BigInt(0)) {
          console.log('⚠️ No songs found in contract');
          setTokenIds([]);
          return;
        }

        // Generate token IDs for the latest songs (reverse order, newest first)
        const latestTokenIds: bigint[] = [];
        const startId = totalSongs;
        const endId = totalSongs > BigInt(MAX_DISPLAY) ? totalSongs - BigInt(MAX_DISPLAY) + BigInt(1) : BigInt(1);
        
        // Add tokens from newest to oldest
        for (let i = startId; i >= endId; i--) {
          latestTokenIds.push(i);
        }
        
        console.log('🎵 Latest token IDs:', latestTokenIds.map(id => id.toString()));
        setTokenIds(latestTokenIds);
        
      } catch (error) {
        console.error('❌ Error fetching latest token IDs:', error);
        // Fallback to show at least some tokens if contract call fails
        setTokenIds([BigInt(1), BigInt(2), BigInt(3)]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchLatestTokenIds();
  }, [refreshKey]);

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

  const handleRefresh = () => {
    console.log('🔄 Refreshing feed...');
    setRefreshKey(prev => prev + 1);
  };

  const handleTestContract = async () => {
    console.log('🧪 Testing contract functions directly...');
    try {
      const { getTotalSongCount, checkSongExists, getSongMetadata } = await import('../../utils/contract');
      
      const total = await getTotalSongCount();
      console.log('📊 Total songs from contract:', total.toString());
      
      for (let i = 1; i <= Number(total); i++) {
        const songId = BigInt(i);
        console.log(`\n🔍 Testing song ID ${i}:`);
        
        try {
          const exists = await checkSongExists(songId);
          console.log(`  ✅ Song ${i} exists:`, exists);
          
          if (exists) {
            const metadata = await getSongMetadata(songId);
            console.log(`  📝 Song ${i} metadata:`, {
              title: metadata.title,
              artistName: metadata.artistName,
              artistAddress: metadata.artistAddress
            });
          }
        } catch (error) {
          console.log(`  ❌ Error with song ${i}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Contract test failed:', error);
    }
  };

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
      <div className="flex justify-between items-center mb-4">
        <h1 className={`md:text-4xl text-2xl font-bold text-center ${
          isDarkMode ? 'text-white' : 'text-[#0000FE]'
        }`}>New Releases</h1>
        <div className="flex gap-2">
          <button
            onClick={handleTestContract}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              isDarkMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            title="Test contract functions"
          >
            🧪 Test
          </button>
          <button
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-[#0000FE]/10 hover:bg-[#0000FE]/20 text-[#0000FE]'
            }`}
            title="Refresh to show latest songs"
          >
            <svg
              className={`w-5 h-5 ${isLoadingTokens ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* NFTExists Cards as a horizontal slider */}
      <div className="mb-12">
        {isLoadingTokens ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-white' : 'text-[#0000FE]'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
            <p>Loading latest releases...</p>
          </div>
        ) : tokenIds.length > 0 ? (
          <KeenNFTSlider tokenIds={tokenIds} />
        ) : (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>No songs available yet. Be the first to create one!</p>
          </div>
        )}
      </div>

      {/* Recently Collected Songs Section */}
      <RecentlyCollectedSection />
    </>
  );
}

function KeenNFTSlider({ tokenIds }: { tokenIds: bigint[] }) {
  const [availableTokenIds, setAvailableTokenIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkExists() {
      setIsLoading(true);
      const { checkNFTExists } = await import('../../utils/contract');
      const checks = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const exists = await checkNFTExists(tokenId);
            return exists ? tokenId : null;
          } catch (error) {
            return null;
          }
        })
      );
      if (isMounted) {
        setAvailableTokenIds(checks.filter(Boolean) as bigint[]);
        setIsLoading(false);
      }
    }
    if (tokenIds.length > 0) {
      checkExists();
    } else {
      setAvailableTokenIds([]);
      setIsLoading(false);
    }
    return () => { isMounted = false; };
  }, [tokenIds]);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    mode: 'free-snap',
    slides: { perView: 'auto', spacing: 12 },
    breakpoints: {
      '(min-width: 640px)': { slides: { perView: 'auto', spacing: 20 } },
      '(min-width: 1024px)': { slides: { perView: 'auto', spacing: 24 } },
    },
  });

  useEffect(() => {
    instanceRef.current?.update();
  }, [availableTokenIds, instanceRef]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
        <p>Verifying new releases...</p>
      </div>
    );
  }

  return (
    <div ref={sliderRef} className="keen-slider py-2">
      {availableTokenIds.map((tokenId) => (
        <div key={tokenId.toString()} className="keen-slider__slide" style={{ minWidth: '220px', maxWidth: '280px' }}>
          <NFTExists tokenId={tokenId} />
        </div>
      ))}
    </div>
  );
} 