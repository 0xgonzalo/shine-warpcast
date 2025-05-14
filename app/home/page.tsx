'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getNFTMetadata, checkNFTExists } from '../utils/contract';

const MAX_TOKEN_ID = 2000; // Set this to a high value based on your contract's activity

export default function HomeFeedPage() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastCheckedId, setLastCheckedId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNFTs = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);
    try {
      const batchSize = 50;
      const startId = lastCheckedId;
      const endId = Math.min(startId + batchSize - 1, MAX_TOKEN_ID);
      console.log(`Checking NFTs from ID ${startId} to ${endId}`);
      const checks = Array.from({ length: endId - startId + 1 }, (_, i) => {
        const tokenId = BigInt(startId + i);
        return checkNFTExists(tokenId);
      });
      const existsResults = await Promise.all(checks);
      console.log('Exists results:', existsResults);
      const fetchPromises = existsResults.map(async (exists, index) => {
        const tokenId = BigInt(startId + index);
        if (exists) {
          try {
            console.log(`Fetching metadata for token ${tokenId}`);
            const metadata = await getNFTMetadata(tokenId);
            if (metadata.audioURI === 'ipfs://placeholder-audio-uri') {
              metadata.audioURI = '';
            }
            if (metadata.imageURI === 'ipfs://placeholder-image-uri') {
              metadata.imageURI = '';
            }
            return { tokenId, metadata };
          } catch (e) {
            console.error(`Error fetching metadata for token ${tokenId}:`, e);
            return null;
          }
        }
        return null;
      });
      const results = await Promise.all(fetchPromises);
      const newItems = results.filter((item): item is { tokenId: bigint; metadata: any } => item !== null);
      console.log(`Successfully fetched ${newItems.length} NFTs:`, newItems.map(nft => nft.tokenId.toString()));
      setLastCheckedId(endId + 1);
      if (endId >= MAX_TOKEN_ID) {
        setHasMore(false);
      }
      setNfts(prev => {
        const combined = [...prev, ...newItems];
        const unique = Array.from(new Map(combined.map(item => [item.tokenId.toString(), item])).values());
        return unique.sort((a, b) => Number(b.tokenId - a.tokenId));
      });
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchNFTs();
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">NFT Feed</h1>
          <div className="space-x-4">
            <button
              onClick={() => {
                setLastCheckedId(0);
                setHasMore(true);
                setNfts([]);
                setError(null);
                fetchNFTs();
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh All'}
            </button>
            <button
              onClick={fetchNFTs}
              disabled={loading || !hasMore}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : hasMore ? 'Load More' : 'No More NFTs'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}
        <div className="bg-white/5 rounded-lg p-6 min-h-[200px]">
          {loading && nfts.length === 0 ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <div key={nft.tokenId.toString()} className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{nft.metadata.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{nft.metadata.description}</p>
                  {nft.metadata.audioURI && nft.metadata.audioURI !== 'ipfs://placeholder-audio-uri' && (
                    <audio controls className="w-full">
                      <source src={nft.metadata.audioURI} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {nft.metadata.imageURI && nft.metadata.imageURI !== 'ipfs://placeholder-image-uri' && (
                    <img 
                      src={nft.metadata.imageURI} 
                      alt={nft.metadata.name} 
                      className="w-full h-48 object-cover rounded-lg mt-2 mb-2"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Created by: {nft.metadata.creator.slice(0, 6)}...{nft.metadata.creator.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500">Token ID: {nft.tokenId.toString()}</p>
                </div>
              ))}
              {nfts.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-400">No NFTs found.</div>
              )}
            </div>
          )}
          {loading && nfts.length > 0 && (
            <div className="text-center text-gray-400 mt-4">Loading more NFTs...</div>
          )}
        </div>
      </div>
    </main>
  );
} 