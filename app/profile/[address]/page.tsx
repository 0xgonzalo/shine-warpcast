'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESS, getNFTMetadata, publicClient, getTotalSongCount, checkSongExists, getUserCollection, generatePseudoFarcasterId } from '../../utils/contract';
import { useParams } from 'next/navigation';
import NFTCard from '@/app/components/NFTCard';
import { useFarcaster } from '../../context/FarcasterContext';
import { useTheme } from '../../context/ThemeContext';
import Image from 'next/image';

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

  // Fetch NFTs for both tabs
  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    
    (async () => {
      try {
        const created: NFT[] = [];
        const collected: NFT[] = [];

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

        // For collected songs, use the new contract's getUserCollection function
        // Generate pseudo-FID from wallet address for collection lookup
        const farcasterId = generatePseudoFarcasterId(walletAddress);

        console.log('🔍 Fetching collection for Farcaster ID:', farcasterId.toString());
        const userCollectionSongIds = await getUserCollection(farcasterId) as bigint[];
        console.log('🎵 User owns songs:', userCollectionSongIds.map((id: bigint) => id.toString()));

        // Get metadata for collected songs
        for (const songId of userCollectionSongIds) {
          try {
            const exists = await checkSongExists(songId);
            if (exists) {
              const metadata = await getNFTMetadata(songId);
              collected.push({ tokenId: songId, metadata });
            }
          } catch (error) {
            console.error(`❌ Error fetching metadata for collected song ${songId}:`, error);
          }
        }

        // For created songs, scan through existing songs and check creator
        const maxScanRange = Math.min(Number(totalSongs), 50); // Limit scan to avoid too many calls
        for (let i = 1; i <= maxScanRange; i++) {
          const songId = BigInt(i);
          try {
            const exists = await checkSongExists(songId);
            if (exists) {
              const metadata = await getNFTMetadata(songId);
              // Check if user is creator
              if (metadata.creator?.toLowerCase() === walletAddress.toLowerCase()) {
                created.push({ tokenId: songId, metadata });
              }
            }
          } catch (error) {
            console.error(`❌ Error checking song ${songId}:`, error);
            // Continue with next song
          }
        }

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
  }, [walletAddress]);

  // No need for ready checks with OnchainKit

  return (
    <main className={`min-h-screen p-8 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Farcaster User Info Section */}
        {isOwnProfile && farcasterUser ? (
          <div className="flex flex-col items-center mb-8">
            {/* Farcaster Avatar */}
            {farcasterUser.pfpUrl && (
              <Image
                src={farcasterUser.pfpUrl}
                alt={farcasterUser.username || "Farcaster User"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full mb-4 border-2 border-blue-500"
              />
            )}
            
            {/* Farcaster Username */}
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              @{farcasterUser.username || 'Unknown User'}
            </h1>
            
            {/* Farcaster Display Name */}
            {farcasterUser.displayName && (
              <p className={`text-xl mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {farcasterUser.displayName}
              </p>
            )}
            
            {/* Farcaster Bio */}
            {farcasterUser.bio && (
              <p className={`text-center mb-4 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {farcasterUser.bio}
              </p>
            )}
            
            {/* Farcaster ID */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              FID: {farcasterUser.fid}
            </p>
            
            {/* Wallet Address */}
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <h1 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {isOwnProfile ? 'My Profile' : 'Profile'}
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