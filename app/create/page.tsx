'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useFarcaster } from '../context/FarcasterContext';
import { encodeFunctionData, parseGwei } from 'viem';
import Image from 'next/image';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

export default function CreatePage() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [mintError, setMintError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const { isSDKLoaded, ethProvider } = useFarcaster();

  // Auto-connect to Farcaster frame when SDK loads
  useEffect(() => {
    if (isSDKLoaded && !isConnected && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcasterFrame');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isSDKLoaded, isConnected, connectors, connect]);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setFileError('Please select a valid audio file');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setFileError('Audio file must be less than 50MB');
        return;
      }
      
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
    if (!address || !nftName || !nftDescription || !audioFile || !imageFile) {
      setMintError('Please fill in all fields and upload both audio and image files');
      return;
    }

    if (!ethProvider) {
      setMintError('Farcaster wallet not available. Please make sure you are in the Farcaster app.');
      return;
    }
    
    setIsMinting(true);
    setMintError(null);
    setStatus('Uploading files to IPFS...');
    
    try {
      // Upload files to IPFS
      const [audioURI, imageURI] = await Promise.all([
        uploadToIPFS(audioFile),
        uploadToIPFS(imageFile)
      ]);
      
      setStatus('Creating metadata...');
      
      // Upload metadata to IPFS
      const metadataURI = await uploadMetadataToIPFS({
        name: nftName,
        description: nftDescription,
        audioURI,
        imageURI
      });
      
      setStatus('Sending transaction...');

      // Prepare transaction data
      const mintArgs: readonly [`0x${string}`, string, string, string, string, bigint] = [
        address as `0x${string}`,
        nftName,
        nftDescription,
        audioURI,
        imageURI,
        BigInt(1)
      ];

      const data = encodeFunctionData({
        abi: contractABI,
        functionName: 'mint',
        args: mintArgs,
      });

      // Estimate gas
      const gasEstimate = await ethProvider.request({
        method: 'eth_estimateGas',
        params: [{
          to: CONTRACT_ADDRESS,
          from: address,
          data,
        }],
      });

      const gasLimit = BigInt(Math.floor(parseInt(gasEstimate, 16) * 1.5));

      // Get current gas price
      const gasPrice = await ethProvider.request({
        method: 'eth_gasPrice',
        params: [],
      });

      // Send transaction
      const txHash = await ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: CONTRACT_ADDRESS,
          from: address,
          data,
          gas: `0x${gasLimit.toString(16)}`,
          gasPrice: gasPrice,
        }],
      });

      setTxHash(txHash as `0x${string}`);
      setStatus(`Transaction submitted: ${txHash}`);
      
      // Reset form after a delay
      setTimeout(() => {
        setNftName('');
        setNftDescription('');
        setAudioFile(null);
        setImageFile(null);
        setAudioPreview('');
        setImagePreview('');
        setTxHash(undefined);
        setStatus('');
      }, 10000);
      
    } catch (error) {
      console.error('Minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';
      setMintError(errorMessage);
      setStatus('');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Upload Your Music 🎵</h1>
        
        {!isSDKLoaded && (
          <div className="text-center py-8">
            <div className="text-lg">Loading Farcaster Mini App...</div>
          </div>
        )}
        
        {isSDKLoaded && !isConnected ? (
          <div className="text-center py-8">
            <div className="text-lg mb-4">Connecting to your Farcaster wallet...</div>
            <div className="text-sm text-gray-400">Please wait while we connect</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Audio Upload Section */}
            <div className="bg-white/5 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
              <div className="space-y-4">
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,.mp3,.wav,.ogg,.aac,.m4a"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <label
                  htmlFor="audio-upload"
                  className="block w-full p-4 border-2 border-dashed border-white/30 rounded-lg text-center cursor-pointer hover:border-white/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="text-4xl">🎵</div>
                    <div className="text-lg font-medium">
                      {audioFile ? audioFile.name : 'Choose Audio File'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Tap to select an audio file from your device
                    </div>
                  </div>
                </label>
                {fileError && (
                  <div className="text-red-500 text-sm text-center">
                    {fileError}
                  </div>
                )}
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
                  <Image
                    src={imagePreview}
                    alt="Cover art preview"
                    width={200}
                    height={200}
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
                  disabled={isMinting || !audioFile || !imageFile || !nftName || !nftDescription}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting ? 'Minting...' : 'Upload Music'}
                </button>
              </div>
              
              {status && (
                <div className="text-center text-blue-400 mt-2 text-sm">
                  {status}
                </div>
              )}
              
              {mintError && (
                <div className="text-center text-red-500 mt-2">
                  {mintError}
                </div>
              )}
              
              {txHash && (
                <div className="text-center space-y-2">
                  <div className="text-green-500">
                    Song Minted Successfully! 🎉
                  </div>
                  <div className="text-xs text-gray-400 break-all">
                    TX: {txHash}
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