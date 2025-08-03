import NFTExists from '../NFTExists';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentlyCollectedNFTs } from '../../utils/contract';
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

const MAX_SCAN = 20; // Scan token IDs 1 to 20

const RecentlyCollectedSection = dynamic(() => import('./RecentlyCollectedSection'), { ssr: false, loading: () => <div>Loading recently collected...</div> });

export default function FeedContent({ mobileColumns, setMobileColumns }: FeedContentProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
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
      <div className="flex justify-between items-center mb-4">
        <h1 className={`md:text-4xl text-2xl font-bold text-center ${
          isDarkMode ? 'text-white' : 'text-[#0000FE]'
        }`}>New Releases</h1>
      </div>
      
      {/* NFTExists Cards as a horizontal slider */}
      <div className="mb-12">
        <KeenNFTSlider tokenIds={tokenIds} />
      </div>

      {/* Recently Collected Songs Section */}
      <RecentlyCollectedSection />
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