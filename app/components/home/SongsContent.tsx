import { useState, useEffect } from 'react';
import { getRecentlyCollectedNFTs } from '../../utils/contract';
import { getIPFSGatewayURL } from '../../utils/pinata';

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

export default function SongsContent() {
  const [recentlyCollected, setRecentlyCollected] = useState<CollectedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyCollected = async () => {
      try {
        setIsLoading(true);
        const collected = await getRecentlyCollectedNFTs(10); // Get top 10 recently collected
        setRecentlyCollected(collected);
      } catch (error) {
        console.error('Error fetching recently collected NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyCollected();
  }, []);

  const generateGradient = (tokenId: bigint) => {
    const gradients = [
      "from-blue-400 to-purple-600",
      "from-green-400 to-blue-600",
      "from-purple-400 to-pink-600",
      "from-orange-400 to-red-600",
      "from-teal-400 to-blue-600"
    ];
    return gradients[Number(tokenId) % gradients.length];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Recently Collected Songs</h2>
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-100 animate-pulse">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : recentlyCollected.length > 0 ? (
        <div className="space-y-4">
          {recentlyCollected.map((nft) => (
            <div key={nft.tokenId.toString()} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-12 h-12 bg-gradient-to-br ${generateGradient(nft.tokenId)} rounded-lg flex-shrink-0 relative overflow-hidden`}>
                {nft.metadata.imageURI && nft.metadata.imageURI !== 'ipfs://placeholder-image-uri' ? (
                  <img 
                    src={getIPFSGatewayURL(nft.metadata.imageURI)} 
                    alt={nft.metadata.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Abstract art pattern fallback */
                  <div className="absolute inset-0">
                    <div className="absolute top-1 left-2 w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="absolute top-2 right-1 w-4 h-4 bg-white/20 rounded-lg rotate-45"></div>
                    <div className="absolute bottom-1 left-1 w-3 h-3 bg-white/25 rounded-full"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-6 bg-white/30 rounded-full rotate-12"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{nft.metadata.name}</h3>
                <p className="text-gray-500">
                  {nft.metadata.creator.slice(0, 6)}...{nft.metadata.creator.slice(-4)}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
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
  );
} 