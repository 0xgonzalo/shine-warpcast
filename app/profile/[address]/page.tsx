'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESS, getNFTMetadata, publicClient, getTotalSongCount, checkSongExists, getUserCollection, generatePseudoFarcasterId } from '../../utils/contract';
import { useParams } from 'next/navigation';
import NFTCard from '@/app/components/NFTCard';
import useConnectedWallet from '@/hooks/useConnectedWallet';

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
  const { ready, authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { farcasterUser } = useConnectedWallet();
  const [activeTab, setActiveTab] = useState<Tab>('Created');
  const [createdNFTs, setCreatedNFTs] = useState<NFT[]>([]);
  const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the address from URL params, fallback to connected wallet
  const walletAddress = (paramAddress as `0x${string}`) || connectedAddress;
  const isOwnProfile = walletAddress?.toLowerCase() === connectedAddress?.toLowerCase();

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
        // Get Farcaster ID - use real FID if available, otherwise generate pseudo-FID from wallet
        let farcasterId: bigint;
        if (farcasterUser?.fid) {
          farcasterId = BigInt(farcasterUser.fid);
        } else {
          farcasterId = generatePseudoFarcasterId(walletAddress);
        }

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
  }, [walletAddress, farcasterUser]);

  if (!ready || !walletsReady) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center text-gray-400">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isOwnProfile ? 'My Profile' : 'Profile'}
        </h1>
        {walletAddress ? (
          <>
            <div className="flex flex-col items-center mb-8">
            </div>
            <div className="flex justify-start mb-6 gap-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 text-2xl focus:outline-none transition-colors ${activeTab === tab ? 'font-semibold text-white' : 'font-normal text-[#692a7c] hover:text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="bg-white/5 rounded-b-lg p-6 min-h-[200px]">
              {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(activeTab === 'Created' ? createdNFTs : collectedNFTs).map((nft) => (
                    <NFTCard key={nft.tokenId.toString()} tokenId={nft.tokenId} />
                  ))}
                  {((activeTab === 'Created' ? createdNFTs : collectedNFTs).length === 0 && !loading) && (
                    <div className="col-span-full text-center text-gray-400">No NFTs found.</div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">
            Invalid wallet address
          </div>
        )}
      </div>
    </main>
  );
} 