'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';

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
        <h1 className="text-4xl font-bold mb-8 text-center">Audio NFT Creator</h1>
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
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleMint}
                  disabled={isMinting || isConfirming || !audioFile || !imageFile || !nftName || !nftDescription}
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
      <GlobalAudioPlayer />
    </main>
  );
} 