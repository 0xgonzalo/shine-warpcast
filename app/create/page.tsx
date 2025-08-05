'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useFarcaster } from '../context/FarcasterContext';
import { useTheme } from '../context/ThemeContext';
import CreatedModal from '../components/CreatedModal';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

export default function CreatePage() {
  const { isDarkMode } = useTheme();
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdNFT, setCreatedNFT] = useState<{
    imageURI: string;
    name: string;
    description: string;
  } | null>(null);
  const [price, setPrice] = useState('');
  const [isSpecialEdition, setIsSpecialEdition] = useState(false);
  const [specialEditionName, setSpecialEditionName] = useState('');
  const [numberOfEditions, setNumberOfEditions] = useState('');
  const [specialEditionPrice, setSpecialEditionPrice] = useState('');
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const { isSDKLoaded } = useFarcaster();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Auto-connect to Farcaster frame if available and SDK is loaded
  useEffect(() => {
    if (isSDKLoaded && !isConnected && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcasterFrame');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isSDKLoaded, isConnected, connectors, connect]);

  useEffect(() => {
    if (writeError) {
      console.error('Transaction error:', writeError);
      setMintError(`Transaction failed: ${writeError.message}`);
      setIsMinting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isConfirmed && hash && createdNFT) {
      console.log('Transaction confirmed:', hash);
      setShowCreatedModal(true);
      setIsMinting(false);
    }
  }, [isConfirmed, hash, createdNFT]);

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
    
    setIsMinting(true);
    setMintError(null);
    
    try {
      console.log('🎵 Starting mint process...');
      
      // Upload files to IPFS
      const [audioURI, imageURI] = await Promise.all([
        uploadToIPFS(audioFile),
        uploadToIPFS(imageFile)
      ]);
      
      console.log('✅ Files uploaded:', { audioURI, imageURI });

      // Upload metadata to IPFS
      const metadataURI = await uploadMetadataToIPFS({
        name: nftName,
        description: nftDescription,
        audioURI,
        imageURI
      });
      
      console.log('✅ Metadata uploaded:', metadataURI);

      // Store NFT details for the success modal
      setCreatedNFT({
        imageURI,
        name: nftName,
        description: nftDescription
      });

      // Mint using Wagmi - this will work with Farcaster connector
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
      console.error('❌ Minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';
      setMintError(errorMessage);
      setIsMinting(false);
    }
  };

  const handleCloseCreatedModal = () => {
    setShowCreatedModal(false);
    setCreatedNFT(null);
    // Reset form after modal is closed
    setNftName('');
    setNftDescription('');
    setAudioFile(null);
    setImageFile(null);
    setAudioPreview('');
    setImagePreview('');
    setPrice('');
    setIsSpecialEdition(false);
    setSpecialEditionName('');
    setSpecialEditionPrice('');
    setNumberOfEditions('');
  };

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Upload Your Music 🎵</h1>
        
        {!isSDKLoaded && (
          <div className="text-center py-8">
            <div className="text-lg">Initializing Farcaster SDK...</div>
            <div className="text-sm text-gray-400 mt-2">Please wait while we connect to your wallet</div>
          </div>
        )}
        
        {isSDKLoaded && !isConnected ? (
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
                  className={`block w-full p-4 border-2 border-dashed ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-[#0000FE] hover:border-[#0000FE]/70'} rounded-lg text-center cursor-pointer transition-colors`}
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
              <div className="space-y-4">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className={`block w-full p-4 border-2 border-dashed ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-[#0000FE] hover:border-[#0000FE]/70'} rounded-lg text-center cursor-pointer transition-colors`}
                >
                  <div className="space-y-2">
                    <div className="text-4xl">🎨</div>
                    <div className="text-lg font-medium">
                      {imageFile ? imageFile.name : 'Choose Cover Art'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Tap to select an image file from your device
                    </div>
                  </div>
                </label>
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
                  className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none`}
                  placeholder="Enter song name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none h-24`}
                  placeholder="Enter song description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none`}
                  placeholder="0.001"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="special-edition"
                  checked={isSpecialEdition}
                  onChange={(e) => setIsSpecialEdition(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="special-edition" className="text-sm font-medium cursor-pointer">
                  Special Editions
                </label>
              </div>

              {isSpecialEdition && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Special Edition Name</label>
                    <input
                      type="text"
                      value={specialEditionName}
                      onChange={(e) => setSpecialEditionName(e.target.value)}
                      className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none`}
                      placeholder="Enter special edition name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Special Edition Price (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={specialEditionPrice}
                      onChange={(e) => setSpecialEditionPrice(e.target.value)}
                      className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none`}
                      placeholder="0.001"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Editions</label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfEditions}
                      onChange={(e) => setNumberOfEditions(e.target.value)}
                      className={`w-full px-3 py-2 bg-white/10 text-white rounded-lg border ${isDarkMode ? 'border-white/20' : 'border-[#0000FE]'} focus:border-blue-500 focus:outline-none`}
                      placeholder="Enter number of editions"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleMint}
                  disabled={
                    isMinting || 
                    isConfirming || 
                    isPending || 
                    !audioFile || 
                    !imageFile || 
                    !nftName || 
                    !nftDescription || 
                    !price ||
                    (isSpecialEdition && (!specialEditionName || !specialEditionPrice || !numberOfEditions))
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Waiting for Wallet...' :
                    isMinting ? 'Preparing Transaction...' :
                    isConfirming ? 'Confirming Transaction...' :
                      'Upload Music'}
                </button>
              </div>
              {mintError && (
                <div className="text-center text-red-500 mt-2">
                  {mintError}
                </div>
              )}
              
              {hash && (
                <div className="text-center space-y-2 mt-4">
                  <div className="text-green-500">
                    {isConfirmed ? 'Song Minted Successfully!' : 'Transaction Submitted!'}
                  </div>
                  <div className="text-xs text-gray-400 break-all">
                    TX: {hash}
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline block"
                  >
                    View on BaseScan
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Success Modal */}
      {showCreatedModal && createdNFT && hash && (
        <CreatedModal
          nft={createdNFT}
          txHash={hash}
          onClose={handleCloseCreatedModal}
        />
      )}
    </main>
  );
} 