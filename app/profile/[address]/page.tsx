'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getNFTMetadata, getTotalSongCount, checkSongExists, getUserCollection, generatePseudoFarcasterId } from '../../utils/contract';
import { useParams, useSearchParams } from 'next/navigation';
import NFTCard from '@/app/components/NFTCard';
import { useFarcaster } from '../../context/FarcasterContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '@coinbase/onchainkit/identity';
import { getFarcasterUserByAddress, getFarcasterUserByFid } from '../../utils/farcaster';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

const TABS = ['Created', 'Collected'] as const;
type Tab = (typeof TABS)[number];

interface NFTMetadata {
  name: string;
  description: string;
  audioURI: string;
  imageURI: string;
  creator: `0x${string}`;
}

interface NFT {
  tokenId: bigint;
  metadata: NFTMetadata;
}

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { address: paramAddress } = params;
  const { address: connectedAddress } = useAccount();
  const { isDarkMode } = useTheme();
  const { context: farcasterContext } = useFarcaster();
  const [activeTab, setActiveTab] = useState<Tab>('Created');
  const [createdNFTs, setCreatedNFTs] = useState<NFT[]>([]);
  const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the address from URL params, fallback to connected wallet
  const walletAddress = (paramAddress as `0x${string}`) || connectedAddress;
  const isOwnProfile = walletAddress?.toLowerCase() === connectedAddress?.toLowerCase();
  
  // Extract Farcaster user data from context
  const farcasterUser = farcasterContext?.user;
  const [farcasterProfile, setFarcasterProfile] = useState<any>(null);
  
  // Debug: Log the Farcaster context to understand its structure
  useEffect(() => {
    console.log('🔍 Farcaster Context:', farcasterContext);
    console.log('👤 Farcaster User:', farcasterUser);
    console.log('👤 Farcaster Client:', farcasterContext?.client);
  }, [farcasterContext, farcasterUser]);

  // Load Farcaster profile for the viewed wallet address
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        // Only prefill from context if viewing own profile
        if (isOwnProfile && farcasterContext?.user) {
          if (!cancelled) setFarcasterProfile(farcasterContext.user);
        }
        if (!walletAddress) return;
        // Prefer fetching by FID if provided (free Neynar plan supports by-fid)
        const fidQuery = searchParams?.get('fid');
        let user = fidQuery
          ? await getFarcasterUserByFid(fidQuery)
          : await getFarcasterUserByAddress(walletAddress);

        // If address path failed on free plan, try the Mini App context fid as a fallback for own profile only
        if (!user && isOwnProfile && farcasterContext?.client?.fid) {
          user = await getFarcasterUserByFid(farcasterContext.client.fid);
        }
        if (cancelled) return;
        if (user) {
          console.log('✅ Loaded Farcaster user:', {
            fid: user.fid,
            username: user.username,
            primaryAddress: user.primaryAddress,
            allAddresses: user.allAddresses,
            verifiedAddresses: user.verifiedAddresses,
          });
          // Normalize to the shape used by the UI below
          // Include primaryAddress and allAddresses for consistent display
          setFarcasterProfile({
            fid: user.fid,
            username: user.username,
            display_name: user.displayName,
            pfp_url: user.pfpUrl,
            profile: { bio: { text: user.bio } },
            primaryAddress: user.primaryAddress,
            allAddresses: user.allAddresses,
          });
          return;
        }
        setFarcasterProfile(null);
      } catch (err) {
        console.warn('Failed to load Farcaster profile for address:', walletAddress, err);
        setFarcasterProfile(null);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [walletAddress, isOwnProfile, farcasterContext, searchParams]);

  // Fetch NFTs for both tabs
  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);

    (async () => {
      try {
        const created: NFT[] = [];
        const collectedMap = new Map<string, NFT>(); // Use map to dedupe

        // Get total song count to know the valid range
        const totalSongs = await getTotalSongCount();
        console.log('📊 Total songs in contract:', totalSongs.toString());

        if (totalSongs === BigInt(0)) {
          console.log('⚠️ No songs found in contract');
          setCreatedNFTs([]);
          setCollectedNFTs([]);
          setLoading(false);
          return;
        }

        // For collected songs, query:
        // 1. Real FID if available (from Farcaster profile)
        // 2. Pseudo-FIDs for ALL addresses owned by this user
        // This handles songs collected from any of the user's wallets
        const realFid = farcasterProfile?.fid || farcasterContext?.user?.fid;

        // Build set of all addresses to generate pseudo-FIDs for
        const allUserAddresses = new Set<string>();
        allUserAddresses.add(walletAddress.toLowerCase());
        if ((farcasterProfile as any)?.allAddresses) {
          for (const addr of (farcasterProfile as any).allAddresses) {
            allUserAddresses.add(addr.toLowerCase());
          }
        }

        // Collect FIDs to query (deduplicated)
        const fidsToQuery = new Set<string>();

        // Add real FID if available
        if (realFid) {
          fidsToQuery.add(BigInt(realFid).toString());
        }

        // Add pseudo-FIDs for all user addresses
        Array.from(allUserAddresses).forEach(addr => {
          const pseudoFid = generatePseudoFarcasterId(addr as `0x${string}`);
          fidsToQuery.add(pseudoFid.toString());
        });

        const fidsArray = Array.from(fidsToQuery);
        const addressesArray = Array.from(allUserAddresses);
        console.log('🔍 Fetching collection for FIDs:', fidsArray);
        console.log('🔍 From addresses:', addressesArray);

        // Query all FIDs and merge results
        for (const fidStr of fidsArray) {
          const fid = BigInt(fidStr);
          try {
            const userCollectionSongIds = await getUserCollection(fid) as bigint[];
            console.log(`🎵 FID ${fid} owns songs:`, userCollectionSongIds.map((id: bigint) => id.toString()));

            // Get metadata for collected songs
            for (const songId of userCollectionSongIds) {
              // Skip if already processed
              if (collectedMap.has(songId.toString())) continue;

              try {
                const exists = await checkSongExists(songId);
                if (exists) {
                  const metadata = await getNFTMetadata(songId);
                  collectedMap.set(songId.toString(), { tokenId: songId, metadata });
                }
              } catch (error) {
                console.error(`❌ Error fetching metadata for collected song ${songId}:`, error);
              }
            }
          } catch (error) {
            console.error(`❌ Error fetching collection for FID ${fid}:`, error);
          }
        }

        // For created songs, scan through ALL existing songs (no artificial limit)
        // Use batch processing to avoid overwhelming RPC
        // Reuse allUserAddresses from above for creator matching
        const totalSongsNum = Number(totalSongs);
        const BATCH_SIZE = 10;

        console.log('🔍 Checking created songs for addresses:', Array.from(allUserAddresses));

        for (let batchStart = 1; batchStart <= totalSongsNum; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalSongsNum);
          const batchPromises: Promise<void>[] = [];

          for (let i = batchStart; i <= batchEnd; i++) {
            const songId = BigInt(i);
            batchPromises.push(
              (async () => {
                try {
                  const exists = await checkSongExists(songId);
                  if (exists) {
                    const metadata = await getNFTMetadata(songId);
                    // Check if user is creator (match against any of user's addresses)
                    if (metadata.creator && allUserAddresses.has(metadata.creator.toLowerCase())) {
                      created.push({ tokenId: songId, metadata });
                    }
                  }
                } catch (error) {
                  console.error(`❌ Error checking song ${songId}:`, error);
                }
              })()
            );
          }

          await Promise.all(batchPromises);
        }

        // Sort created by tokenId descending (newest first)
        created.sort((a, b) => Number(b.tokenId - a.tokenId));

        // Convert collected map to array and sort by tokenId descending
        const collected = Array.from(collectedMap.values())
          .sort((a, b) => Number(b.tokenId - a.tokenId));

        console.log('🎨 Created NFTs found:', created.length);
        console.log('🎵 Collected NFTs found:', collected.length);

        setCreatedNFTs(created);
        setCollectedNFTs(collected);
      } catch (error) {
        console.error('❌ Error fetching NFTs:', error);
        setCreatedNFTs([]);
        setCollectedNFTs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress, farcasterProfile?.fid, farcasterContext?.user?.fid]);

  // No need for ready checks with OnchainKit

  return (
    <main className={`min-h-screen p-8 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Farcaster User Info Section */}
        {(farcasterProfile || (isOwnProfile && farcasterContext)) ? (
          <div className="flex flex-col items-center mb-8">
            {/* Farcaster Avatar */}
            <div className="mb-4">
              {(() => {
                const avatarUrl =
                  // Neynar shape
                  (farcasterProfile as any)?.pfp_url ||
                  (farcasterProfile as any)?.pfp?.url ||
                  // Context user possible shapes
                  (farcasterContext as any)?.user?.pfpUrl ||
                  (farcasterContext as any)?.user?.pfp?.url ||
                  (farcasterUser as any)?.pfpUrl ||
                  (farcasterUser as any)?.pfp?.url ||
                  undefined;

                if (avatarUrl) {
                  return (
                    // Use native img to avoid Next/Image optimization issues in mini apps
                    <img
                      src={avatarUrl}
                      alt={(farcasterProfile as any)?.username || 'Farcaster User'}
                      width={80}
                      height={80}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover"
                    />
                  );
                }

                return (
                  <div className="w-20 h-20">
                    <Avatar
                      address={walletAddress}
                      className="w-20 h-20 border-2 border-blue-500"
                    />
                  </div>
                );
              })()}
            </div>
            
            {/* Farcaster Username */}
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              @{
                (farcasterProfile as any)?.username ||
                (isOwnProfile ? (farcasterContext as any)?.user?.username : undefined) ||
                'Unknown User'
              }
            </h1>
            
            {/* Farcaster Display Name */}
            {farcasterProfile?.display_name && (
              <p className={`text-xl mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {farcasterProfile.display_name}
              </p>
            )}
            
            {/* Farcaster Bio */}
            {farcasterProfile?.profile?.bio?.text && (
              <p className={`text-center mb-4 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {farcasterProfile.profile.bio.text}
              </p>
            )}
            
            {/* Farcaster ID */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              FID: {farcasterProfile?.fid || farcasterContext?.client?.fid || 'Unknown'}
            </p>

            {/* Wallet Address - Show primary/canonical address from Farcaster profile */}
            {(() => {
              const displayAddress = (farcasterProfile as any)?.primaryAddress || walletAddress;
              return displayAddress ? (
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
                </p>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <h1 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Profile
            </h1>
            {walletAddress && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}
          </div>
        )}
        
        {walletAddress ? (
          <>
            <div className="flex justify-start mb-6 gap-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 text-2xl focus:outline-none transition-colors ${
                    activeTab === tab 
                      ? `font-semibold ${isDarkMode ? 'text-white' : 'text-blue-600'}` 
                      : `font-normal ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-blue-500'}`
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className={`rounded-b-lg p-6 min-h-[200px] ${
              isDarkMode ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              {loading ? (
                <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(activeTab === 'Created' ? createdNFTs : collectedNFTs).map((nft) => (
                    <NFTCard key={nft.tokenId.toString()} tokenId={nft.tokenId} />
                  ))}
                  {((activeTab === 'Created' ? createdNFTs : collectedNFTs).length === 0 && !loading) && (
                    <div className={`col-span-full text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No NFTs found.</div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Invalid wallet address
          </div>
        )}
      </div>
    </main>
  );
} 