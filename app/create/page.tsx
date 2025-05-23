'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, isSuccess, data: mintData, error: writeError } = useWriteContract();
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [mintError, setMintError] = useState<string | null>(null);
  const { playAudio, currentAudio, isPlaying } = useAudio();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

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

  const handlePlayPreview = () => {
    if (audioPreview) {
      playAudio(audioPreview, 'Audio Preview');
    }
  };

  const handleMint = async () => {
    if (!address || !nftName || !nftDescription || !audioFile || !imageFile) return;
    setIsMinting(true);
    setMintError(null);
    try {
      // Upload files to IPFS
      const [audioURI, imageURI] = await Promise.all([
        uploadToIPFS(audioFile),
        uploadToIPFS(imageFile)
      ]);

      // Upload metadata to IPFS
      const metadataURI = await uploadMetadataToIPFS({
        name: nftName,
        description: nftDescription,
        audioURI,
        imageURI
      });

      // Mint NFT with the metadata URI
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: 'mint',
        args: [
          address as `0x${string}`,
          nftName,
          nftDescription,
          audioURI,
          imageURI,
          BigInt(1)
        ],
      });
    } catch (error) {
      console.error('Minting error:', error);
      setMintError(error instanceof Error ? error.message : 'Failed to mint NFT');
      setIsMinting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Upload Your Music 🎵</h1>
        {!isConnected ? (
          <div className="text-center space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!connector.ready}
              >
                {connector.name}
              </button>
            ))}
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
                <button
                  onClick={handlePlayPreview}
                  className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
                    currentAudio?.src === audioPreview && isPlaying
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {currentAudio?.src === audioPreview && isPlaying
                    ? 'Playing Preview...'
                    : 'Play Preview'}
                </button>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="bg-white/5 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Upload Cover Art</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Cover art preview"
                    className="max-w-xs rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Metadata Section */}
            <div className="bg-white/5 p-6 rounded-lg space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Song Details</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Song Name</label>
                <input
                  type="text"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter song name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none h-24"
                  placeholder="Enter song description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleMint}
                  disabled={isMinting || isConfirming || !audioFile || !imageFile || !nftName || !nftDescription}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting ? 'Preparing Transaction...' :
                    isConfirming ? 'Confirming Transaction...' :
                      'Upload Music'}
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
                    {isConfirmed ? 'Song Minted Successfully!' : 'Transaction Submitted!'}
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on BaseScan
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 