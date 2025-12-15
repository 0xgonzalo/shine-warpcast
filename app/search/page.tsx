'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSongMetadata, getTotalSongCount, checkSongExists } from '../utils/contract';
import NFTExists from '../components/NFTExists';
import { useRouter } from 'next/navigation';

interface SongWithMetadata {
  tokenId: bigint;
  title: string;
  artistName: string;
}

interface SearchUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  custodyAddress?: string;
  verifiedAddresses?: string[];
}

export default function SearchPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [allSongs, setAllSongs] = useState<SongWithMetadata[]>([]);
  const [artists, setArtists] = useState<SearchUser[]>([]);

  // Load all songs on component mount
  useEffect(() => {
    let isMounted = true;

    async function loadSongs() {
      try {
        setIsLoadingSongs(true);
        const total = await getTotalSongCount();

        // Load last 60 songs for better performance
        const maxToScan = Math.min(Number(total), 60);
        const startId = Number(total);
        const endId = Math.max(1, startId - maxToScan + 1);

        const candidates: bigint[] = [];
        for (let i = startId; i >= endId; i--) {
          candidates.push(BigInt(i));
        }

        // Check existence in parallel
        const existence = await Promise.all(
          candidates.map(async (id) => {
            try {
              const exists = await checkSongExists(id);
              return exists ? id : null;
            } catch {
              return null;
            }
          })
        );

        const existingIds = existence.filter(Boolean) as bigint[];

        // Fetch metadata for all existing songs
        const songsWithMetadata: SongWithMetadata[] = [];
        for (const id of existingIds) {
          try {
            const meta = await getSongMetadata(id);
            songsWithMetadata.push({
              tokenId: id,
              title: meta.title || '',
              artistName: meta.artistName || '',
            });
          } catch {
            // ignore failures for individual songs
          }
        }

        if (isMounted) setAllSongs(songsWithMetadata);
      } finally {
        if (isMounted) setIsLoadingSongs(false);
      }
    }

    loadSongs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Search for artists when query changes
  useEffect(() => {
    let isMounted = true;

    async function searchArtists() {
      const query = searchQuery.trim();
      if (!query) {
        setArtists([]);
        return;
      }

      try {
        setIsSearchingArtists(true);
        const response = await fetch(`/api/farcaster/search?q=${encodeURIComponent(query)}&limit=10`);

        if (!response.ok) {
          console.error('Failed to search artists');
          if (isMounted) setArtists([]);
          return;
        }

        const data = await response.json();
        if (isMounted) setArtists(data.users || []);
      } catch (error) {
        console.error('Error searching artists:', error);
        if (isMounted) setArtists([]);
      } finally {
        if (isMounted) setIsSearchingArtists(false);
      }
    }

    // Debounce the search
    const timer = setTimeout(() => {
      searchArtists();
    }, 300);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [searchQuery]);

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artistName.toLowerCase().includes(query)
    );
  }, [allSongs, searchQuery]);

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const generateGradient = (fid: number) => {
    const gradients = [
      "from-blue-400 to-purple-600",
      "from-green-400 to-blue-600",
      "from-purple-400 to-pink-600",
      "from-orange-400 to-red-600",
      "from-teal-400 to-blue-600",
      "from-indigo-400 to-purple-600",
    ];
    const index = fid % gradients.length;
    return gradients[index];
  };

  const handleArtistClick = (artist: SearchUser) => {
    // Navigate to artist profile using their wallet address
    // Priority: verified address > custody address
    // Also pass FID as query param so profile page can fetch user data by FID
    const walletAddress = artist.verifiedAddresses?.[0] || artist.custodyAddress;
    if (walletAddress) {
      router.push(`/profile/${walletAddress}?fid=${artist.fid}`);
    }
  };

  const showResults = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
            Search
          </h1>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs or artists..."
              className={`w-full px-4 py-3 rounded-lg border text-base ${
                isDarkMode
                  ? 'bg-white/10 text-white border-white/20 placeholder-white/50'
                  : 'bg-white text-foreground border-foreground placeholder-foreground/70'
              }`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-white/50 hover:text-white' : 'text-foreground/50 hover:text-foreground'
                }`}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading State for Initial Load */}
        {isLoadingSongs && !showResults && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
            <p>Loading songs...</p>
          </div>
        )}

        {/* Empty State */}
        {!showResults && !isLoadingSongs && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-lg">Search for songs or artists</p>
            <p className="text-sm mt-2">Try searching for &quot;water&quot;, &quot;pop&quot;, or an artist name</p>
          </div>
        )}

        {/* Search Results */}
        {showResults && (
          <div className="space-y-8">
            {/* Songs Section */}
            <div>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                Songs {filteredSongs.length > 0 && `(${filteredSongs.length})`}
              </h2>

              {isLoadingSongs ? (
                <div className={`text-center py-8 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                  <p>Searching songs...</p>
                </div>
              ) : filteredSongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredSongs.map((song) => (
                    <NFTExists key={song.tokenId.toString()} tokenId={song.tokenId} />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>No songs found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>

            {/* Artists Section */}
            <div>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                Artists {artists.length > 0 && `(${artists.length})`}
              </h2>

              {isSearchingArtists ? (
                <div className={`text-center py-8 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                  <p>Searching artists...</p>
                </div>
              ) : artists.length > 0 ? (
                <div className="space-y-2">
                  {artists.map((artist) => (
                    <div
                      key={artist.fid}
                      onClick={() => handleArtistClick(artist)}
                      className={`flex items-center space-x-4 p-3 rounded-lg transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'hover:bg-white/10'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {/* Artist Avatar */}
                      <div className="w-12 h-12 flex-shrink-0">
                        {artist.pfpUrl ? (
                          <img
                            src={artist.pfpUrl}
                            alt={artist.displayName || artist.username || 'Artist'}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              // Replace with gradient fallback on error
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-br ${generateGradient(artist.fid)} rounded-full`}
                          style={{ display: artist.pfpUrl ? 'none' : 'block' }}
                        ></div>
                      </div>

                      {/* Artist Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                          {artist.displayName || artist.username || `User ${artist.fid}`}
                        </h3>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {artist.username ? `@${artist.username}` : `FID: ${artist.fid}`}
                          {artist.followerCount !== undefined && artist.followerCount > 0 && (
                            <> • {formatFollowerCount(artist.followerCount)} followers</>
                          )}
                        </p>
                      </div>

                      {/* View Profile Button */}
                      <button
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-foreground text-white hover:bg-foreground/90'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArtistClick(artist);
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>No artists found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
