'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESS, getNFTMetadata, publicClient } from '../../utils/contract';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useParams } from 'next/navigation';

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
      // Get all token IDs (for demo, scan first 20)
      const tokenIds = Array.from({ length: 20 }, (_, i) => BigInt(i.toString()));
      const created: NFT[] = [];
      const collected: NFT[] = [];
      for (const tokenId of tokenIds) {
        try {
          const metadata = await getNFTMetadata(tokenId);
          // Check if user is creator
          if (metadata.creator?.toLowerCase() === walletAddress.toLowerCase()) {
            created.push({ tokenId, metadata });
          }
          // Check if user owns this NFT
          const balance = await publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'account', type: 'address' },
                  { name: 'id', type: 'uint256' },
                ],
                outputs: [{ name: '', type: 'uint256' }],
              },
            ],
            functionName: 'balanceOf',
            args: [walletAddress, tokenId],
          });
          if (balance && typeof balance === 'bigint' && balance > BigInt(0)) {
            collected.push({ tokenId, metadata });
          }
        } catch {
          // Token may not exist, skip
        }
      }
      setCreatedNFTs(created);
      setCollectedNFTs(collected);
      setLoading(false);
    })();
  }, [walletAddress]);

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
              <span className="text-xl font-semibold">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-center mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-blue-100/10'
                  }`}
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
                    <div key={nft.tokenId.toString()} className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">{nft.metadata.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{nft.metadata.description}</p>
                      {nft.metadata.imageURI && nft.metadata.imageURI !== 'ipfs://placeholder-image-uri' && (
                        <img
                          src={getIPFSGatewayURL(nft.metadata.imageURI)}
                          alt={nft.metadata.name}
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}
                      {nft.metadata.audioURI && nft.metadata.audioURI !== 'ipfs://placeholder-audio-uri' && (
                        <audio controls className="w-full">
                          <source src={getIPFSGatewayURL(nft.metadata.audioURI)} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Token ID: {nft.tokenId.toString()}
                      </p>
                    </div>
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