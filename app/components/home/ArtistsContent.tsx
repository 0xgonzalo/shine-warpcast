'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMostCollectedArtists } from '../../utils/contract';
import { getFarcasterUserByAddress, getMockFarcasterUser, FarcasterUser } from '../../utils/farcaster';
import { getIPFSGatewayURL } from '../../utils/pinata';

// Import Farcaster Frame SDK
let sdk: any = null;
if (typeof window !== 'undefined') {
  import('@farcaster/frame-sdk').then((module) => {
    sdk = module.sdk;
  });
}

interface Artist {
  address: `0x${string}`;
  collectionCount: number;
  tokenCount: number;
  exampleToken: {
    tokenId: bigint;
    name: string;
    imageURI: string;
  } | null;
  farcasterUser?: FarcasterUser | null;
}

// Cache for artists data (5 minutes cache)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let artistsCache: { data: Artist[]; timestamp: number } | null = null;

export default function ArtistsContent() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchArtists = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) return;
      
      // Check cache first
      if (artistsCache && Date.now() - artistsCache.timestamp < CACHE_DURATION) {
        console.log('📦 Using cached artists data');
        setArtists(artistsCache.data);
        setIsLoading(false);
        return;
      }

      try {
        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        console.log('🎨 Fetching most collected artists...');
        
        // Get most collected artists from smart contract
        const contractArtists = await getMostCollectedArtists(6);
        console.log('📊 Contract artists:', contractArtists);

        // Only enrich with Farcaster data for first 3 artists to reduce load
        const enrichedArtists = await Promise.all(
          contractArtists.map(async (artist, index) => {
            try {
              // Only fetch Farcaster data for top 3 artists to reduce API calls
              let farcasterUser = null;
              if (index < 3) {
                farcasterUser = await getFarcasterUserByAddress(artist.address) || 
                               getMockFarcasterUser(artist.address);
              }
              
              return {
                ...artist,
                farcasterUser
              };
            } catch (error) {
              console.error(`Error fetching Farcaster data for ${artist.address}:`, error);
              return {
                ...artist,
                farcasterUser: null
              };
            }
          })
        );

        // Cache the results
        artistsCache = {
          data: enrichedArtists,
          timestamp: Date.now()
        };

        setArtists(enrichedArtists);
        console.log('✅ Artists loaded:', enrichedArtists);
      } catch (error) {
        console.error('Error fetching artists:', error);
        setError('Failed to load artists. Please try again later.');
        setArtists([]);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchArtists();
  }, []); // Empty dependency array - only fetch once

  const handleArtistClick = (artist: Artist) => {
    // Navigate to artist's profile
    router.push(`/profile/${artist.address}`);
  };

  const handleFollowClick = (e: React.MouseEvent, artist: Artist) => {
    e.stopPropagation();
    
    // If we have Farcaster user data, use the Frame SDK to show their profile
    if (artist.farcasterUser && sdk) {
      console.log('Showing Farcaster profile for:', artist.farcasterUser.username);
      try {
        // Add timeout to prevent hanging
        Promise.race([
          sdk.actions.viewProfile({ fid: artist.farcasterUser.fid }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]).catch((error) => {
          console.error('Error showing Farcaster profile:', error);
          // Fallback to navigating to their profile page
          router.push(`/profile/${artist.address}`);
        });
      } catch (error) {
        console.error('Error showing Farcaster profile:', error);
        // Fallback to navigating to their profile page
        router.push(`/profile/${artist.address}`);
      }
    } else {
      console.log('Viewing profile for wallet address:', artist.address);
      // For non-Farcaster users, navigate to their profile page
      router.push(`/profile/${artist.address}`);
    }
  };

  const generateGradient = (address: string) => {
    const gradients = [
      "from-blue-400 to-purple-600",
      "from-green-400 to-blue-600", 
      "from-purple-400 to-pink-600",
      "from-orange-400 to-red-600",
      "from-teal-400 to-blue-600",
      "from-indigo-400 to-purple-600"
    ];
    // Use address to deterministically pick a gradient
    const index = parseInt(address.slice(-2), 16) % gradients.length;
    return gradients[index];
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Popular Artists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 py-2 md:p-4 rounded-lg animate-pulse">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-8 bg-gray-300 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Popular Artists</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#5D2DA0] text-white px-4 py-2 rounded-lg hover:bg-[#4A2380] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Popular Artists</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        {artists.map((artist) => (
          <div 
            key={artist.address} 
            className="flex items-center space-x-4 py-2 md:p-4 rounded-lg hover:bg-gray-50 hover:bg-opacity-30 transition-colors cursor-pointer"
            onClick={() => handleArtistClick(artist)}
          >
            {/* Artist Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
              {artist.farcasterUser?.pfpUrl ? (
                <img 
                  src={artist.farcasterUser.pfpUrl} 
                  alt={artist.farcasterUser.displayName || artist.farcasterUser.username || 'Artist'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : artist.exampleToken?.imageURI ? (
                <img 
                  src={getIPFSGatewayURL(artist.exampleToken.imageURI)} 
                  alt={artist.exampleToken.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${generateGradient(artist.address)} rounded-full`}></div>
              )}
            </div>
            
            {/* Artist Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-sm md:text-md">
                {artist.farcasterUser?.displayName || 
                 artist.farcasterUser?.username || 
                 `${artist.address.slice(0, 6)}...${artist.address.slice(-4)}`}
              </h3>
              <p className="text-gray-500 text-xs md:text-sm">
                {artist.farcasterUser?.followerCount ? 
                  `${formatFollowerCount(artist.farcasterUser.followerCount)} followers` :
                  `${artist.collectionCount} collections • ${artist.tokenCount} tracks`
                }
              </p>
            </div>
            
            {/* Follow Button */}
            <button 
              onClick={(e) => handleFollowClick(e, artist)}
              className="bg-[#5D2DA0] text-white text-xs md:text-sm px-6 py-2 rounded-full hover:bg-[#4A2380] transition-colors"
            >
              {artist.farcasterUser ? 'Follow' : 'View'}
            </button>
          </div>
        ))}
        
        {artists.length === 0 && !isLoading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No artists found. Create some music to see popular artists!
          </div>
        )}
      </div>
    </div>
  );
} 