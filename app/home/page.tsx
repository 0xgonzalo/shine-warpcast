'use client';

import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { useState, useEffect } from 'react';
import CollectedModal from '../components/CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';

const MAX_SCAN = 20; // Scan token IDs 1 to 20

function NFTCard({ tokenId }: { tokenId: bigint }) {
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getMetadata',
    args: [tokenId],
  });

  const { writeContract, isPending, isSuccess, data: txData } = useWriteContract();
  const [clicked, setClicked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCollect = () => {
    setClicked(true);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'buy',
      args: [tokenId],
      value: BigInt(777000000000000), // 0.000777 ETH in wei
    });
  };

  useEffect(() => {
    if (isSuccess && txData) {
      setShowModal(true);
    }
  }, [isSuccess, txData]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError || !data) return null;

  return (
    <>
      <div className="p-4 border rounded-lg bg-white/5">
        <h3 className="text-lg font-semibold mb-2">{data.name}</h3>
        <p className="text-xs text-gray-500 mb-2">
          Creator: {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
        </p>
        {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' && (
          <img
            src={getIPFSGatewayURL(data.imageURI)}
            alt={data.name}
            className="w-full h-48 object-cover rounded-lg mb-2"
          />
        )}
        {data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri' && (
          <audio controls className="w-full mb-2">
            <source src={getIPFSGatewayURL(data.audioURI)} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
        <button
          onClick={handleCollect}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Collecting...' : 'Collect'}
        </button>
      </div>
      {showModal && txData && (
        <CollectedModal
          nft={{ 
            imageURI: getIPFSGatewayURL(data.imageURI), 
            name: data.name 
          }}
          txHash={txData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function NFTExists({ tokenId }: { tokenId: bigint }) {
  const { data: exists, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'exists',
    args: [tokenId],
  });

  if (isLoading || isError || !exists) return null;
  return <NFTCard tokenId={tokenId} />;
}

export default function HomePage() {
  const tokenIds = Array.from({ length: MAX_SCAN }, (_, i) => BigInt(i + 1));
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">NFT Gallery</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokenIds.map((tokenId) => (
            <NFTExists key={tokenId.toString()} tokenId={tokenId} />
          ))}
        </div>
      </div>
    </main>
  );
}
