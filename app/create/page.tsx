'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useDisconnect } from 'wagmi';
import Link from 'next/link';
import { CONTRACT_ADDRESS, contractABI, getNFTMetadata } from '../utils/contract';

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [mintError, setMintError] = useState<string | null>(null);

  const { writeContract, isSuccess, data: mintData, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: nftExists } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: contractABI,
    functionName: 'exists',
    args: [mintedTokenId || BigInt(0)],
    query: { enabled: mintedTokenId !== null },
  });

  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (writeError) {
      setMintError(writeError.message);
      setIsMinting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && mintData) {
      setTxHash(mintData);
    }
  }, [isSuccess, mintData]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setMintedTokenId(BigInt(1));
      setIsMinting(false);
      setMintError(null);
    }
  }, [isConfirmed, txHash]);

  useEffect(() => {
    const fetchNFTMetadata = async () => {
      if (mintedTokenId && nftExists) {
        try {
          const metadata = await getNFTMetadata(mintedTokenId);
          setMintedNFTs(prev => [...prev, { tokenId: mintedTokenId, metadata }]);
        } catch (error) {
          console.error('Error fetching NFT metadata:', error);
          setMintError('Error fetching NFT metadata');
        }
      }
    };
    fetchNFTMetadata();
  }, [mintedTokenId, nftExists]);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleMint = async () => {
    if (!address || !audioFile || !nftName || !nftDescription || !imageFile) return;
    setIsMinting(true);
    setMintError(null);
    try {
      // In a real app, upload audioFile and imageFile to IPFS and use the resulting URLs
      const audioURI = 'ipfs://placeholder-audio-uri';
      const imageURI = 'ipfs://placeholder-image-uri';
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: 'mint',
        args: [address, nftName, nftDescription, audioURI, imageURI, BigInt(1)],
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      setMintError(error instanceof Error ? error.message : 'Failed to mint NFT');
      setIsMinting(false);
    }
  };

  const getExplorerLink = (hash: `0x${string}`) => `https://basescan.org/tx/${hash}`;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Audio NFT Creator</h1>
        {!mounted ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : !isConnected ? (
          <div className="text-center text-gray-400">
            Please connect your wallet to create an NFT
          </div>
        ) : (
          <div className="space-y-8">
            {/* Audio Upload Section */}
            <div className="bg-white/5 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {audioPreview && (
                <div className="mt-4">
                  <audio controls className="w-full">
                    <source src={audioPreview} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
            {/* Image Upload Section */}
            <div className="bg-white/5 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Upload Artwork Image</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="mt-4 flex justify-center">
                  <img src={imagePreview} alt="Artwork Preview" className="max-h-48 rounded-lg border border-white/20" />
                </div>
              )}
            </div>
            {/* NFT Details Form */}
            <div className="bg-white/5 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">NFT Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full p-2 rounded bg-white/10 border border-white/20"
                    placeholder="Enter NFT name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    className="w-full p-2 rounded bg-white/10 border border-white/20"
                    placeholder="Enter NFT description"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            {/* Mint Button and Status */}
            {audioFile && imageFile && nftName && nftDescription && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button
                    onClick={handleMint}
                    disabled={isMinting || isConfirming}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinting ? 'Preparing Transaction...' : 
                     isConfirming ? 'Confirming Transaction...' : 
                     'Mint NFT'}
                  </button>
                </div>

                {mintError && (
                  <div className="text-center text-red-500 mt-2">
                    {mintError}
                  </div>
                )}

                {txHash && (
                  <div className="text-center space-y-2">
                    <div className="text-green-500">
                      {isConfirmed ? 'NFT Minted Successfully!' : 'Transaction Submitted!'}
                    </div>
                    <a
                      href={getExplorerLink(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View on BaseScan
                    </a>
                  </div>
                )}
              </div>
            )}
            {/* NFT Gallery */}
            {mintedNFTs.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Your NFTs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mintedNFTs.map((nft) => (
                    <div key={nft.tokenId.toString()} className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-xl font-semibold mb-2">{nft.metadata.name}</h3>
                      <p className="text-sm text-gray-400 mb-4">{nft.metadata.description}</p>
                      {nft.metadata.audioURI && (
                        <audio controls className="w-full">
                          <source src={nft.metadata.audioURI} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {nft.metadata.imageURI && (
                        <img src={nft.metadata.imageURI} alt="NFT Artwork" className="mt-4 max-h-32 rounded border border-white/20" />
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created by: {nft.metadata.creator.slice(0, 6)}...{nft.metadata.creator.slice(-4)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 