'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, publicClient } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useFarcaster } from '../context/FarcasterContext';
import { encodeFunctionData } from 'viem';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

export default function CreatePage() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, isSuccess, data: mintData, error: writeError, isPending } = useWriteContract();
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const { isSDKLoaded, isReady, context, ethProvider } = useFarcaster();
  const [manualTxHash, setManualTxHash] = useState<string>('');

  // Check if we're in a mobile environment
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isFarcasterFrame = connector?.id === 'farcasterFrame';

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      setMintError(`Transaction failed: ${writeError.message}`);
      setDebugInfo(`Error: ${writeError.name} - ${writeError.message}`);
      setIsMinting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && mintData) {
      console.log('Transaction submitted successfully:', mintData);
      setTxHash(mintData);
      setDebugInfo(`Transaction submitted: ${mintData}`);
      setIsMinting(false); // Stop the minting state when transaction is submitted
    }
  }, [isSuccess, mintData]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('Transaction confirmed:', txHash);
      setDebugInfo(`Transaction confirmed: ${txHash}`);
      // Reset form after successful confirmation
      setTimeout(() => {
        setNftName('');
        setNftDescription('');
        setAudioFile(null);
        setImageFile(null);
        setAudioPreview('');
        setImagePreview('');
        setTxHash(undefined);
        setDebugInfo('');
      }, 5000);
    }
  }, [isConfirmed, txHash]);

  useEffect(() => {
    if (isConfirming && txHash) {
      setDebugInfo(`Waiting for confirmation: ${txHash}`);
    }
  }, [isConfirming, txHash]);

  // Auto-connect to Farcaster frame if available
  useEffect(() => {
    if (isSDKLoaded && !isConnected && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcasterFrame');
      if (farcasterConnector && farcasterConnector.ready) {
        console.log('🔗 Auto-connecting to Farcaster frame...');
        connect({ connector: farcasterConnector });
      }
    }
  }, [isSDKLoaded, isConnected, connectors, connect]);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    
    if (file) {
      // Check if it's actually an audio file
      if (!file.type.startsWith('audio/')) {
        setFileError('Please select a valid audio file');
        return;
      }
      
      // Check file size (limit to 50MB)
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
    
    console.log('🎵 Starting mint process...', {
      address,
      nftName,
      nftDescription,
      audioFile: audioFile.name,
      imageFile: imageFile.name,
      connector: connector?.name,
      isFarcasterFrame,
      isSDKLoaded,
      ethProvider: !!ethProvider
    });
    
    setIsMinting(true);
    setMintError(null);
    setDebugInfo('Starting mint process...');
    
    try {
      // Upload files to IPFS
      console.log('📤 Starting IPFS uploads...');
      setDebugInfo('Uploading audio file to IPFS...');
      
      const audioURI = await uploadToIPFS(audioFile);
      console.log('✅ Audio uploaded:', audioURI);
      
      if (!audioURI || audioURI.includes('placeholder')) {
        throw new Error('Audio upload failed - got placeholder URI');
      }
      
      setDebugInfo('Uploading image file to IPFS...');
      const imageURI = await uploadToIPFS(imageFile);
      console.log('✅ Image uploaded:', imageURI);
      
      if (!imageURI || imageURI.includes('placeholder')) {
        throw new Error('Image upload failed - got placeholder URI');
      }
      
      console.log('✅ Both files uploaded successfully:', { audioURI, imageURI });
      setDebugInfo('Files uploaded, creating metadata...');

      // Upload metadata to IPFS
      const metadataURI = await uploadMetadataToIPFS({
        name: nftName,
        description: nftDescription,
        audioURI,
        imageURI
      });
      
      console.log('✅ Metadata uploaded:', metadataURI);
      
      if (!metadataURI || metadataURI.includes('placeholder')) {
        throw new Error('Metadata upload failed - got placeholder URI');
      }
      
      setDebugInfo('Metadata uploaded, preparing transaction...');

      // Validate contract address
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.length < 10) {
        throw new Error('Invalid contract address');
      }

      const mintArgs: readonly [`0x${string}`, string, string, string, string, bigint] = [
        address as `0x${string}`,
        nftName,
        nftDescription,
        audioURI,
        imageURI,
        BigInt(1)
      ];

      console.log('🔗 Transaction details:', {
        contractAddress: CONTRACT_ADDRESS,
        functionName: 'mint',
        args: mintArgs,
        connector: connector?.name,
        gasLimit: 500000
      });
      
      setDebugInfo('Submitting transaction to wallet...');

      try {
        // First try with wagmi
        writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractABI,
          functionName: 'mint',
          args: mintArgs,
          // Add explicit gas settings for mobile compatibility
          gas: BigInt(500000), // Set a reasonable gas limit
        });
        
        console.log('📝 writeContract called successfully');
      } catch (wagmiError) {
        console.warn('⚠️ Wagmi method failed, trying Farcaster SDK...', wagmiError);
        
        // Fallback to Farcaster SDK method
        if (ethProvider && isFarcasterFrame) {
          setDebugInfo('Trying alternative transaction method...');
          const txHash = await mintWithFarcasterSDK(mintArgs);
          setTxHash(txHash as `0x${string}`);
          setDebugInfo(`Transaction submitted via Farcaster SDK: ${txHash}`);
        } else {
          throw wagmiError;
        }
      }
      
    } catch (error) {
      console.error('❌ Minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';
      setMintError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      setIsMinting(false);
    }
  };

  // Alternative transaction method using Farcaster SDK directly
  const mintWithFarcasterSDK = async (mintArgs: readonly [`0x${string}`, string, string, string, string, bigint]) => {
    if (!ethProvider) {
      throw new Error('Farcaster eth provider not available');
    }

    console.log('🔄 Trying alternative method with Farcaster SDK...');
    
    // Encode the function call
    const data = encodeFunctionData({
      abi: contractABI,
      functionName: 'mint',
      args: mintArgs,
    });

    // Send transaction using Farcaster's eth provider
    const txHash = await ethProvider.request({
      method: 'eth_sendTransaction',
      params: [{
        to: CONTRACT_ADDRESS,
        data,
        gas: '0x7A120', // 500000 in hex
      }],
    });

    console.log('✅ Transaction sent via Farcaster SDK:', txHash);
    return txHash;
  };

  // Test wallet connection
  const testWalletConnection = async () => {
    try {
      console.log('🧪 Testing wallet connection...');
      setDebugInfo('Testing wallet connection...');
      
      if (ethProvider) {
        const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
        console.log('✅ Accounts:', accounts);
        setDebugInfo(`Connected accounts: ${accounts.length}`);
      } else {
        setDebugInfo('No eth provider available');
      }
    } catch (error) {
      console.error('❌ Wallet test failed:', error);
      setDebugInfo(`Wallet test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test IPFS connection
  const testIPFSConnection = async () => {
    try {
      console.log('🧪 Testing IPFS connection...');
      setDebugInfo('Testing IPFS connection...');
      
      // Check environment variables
      const hasApiKey = !!(process.env.NEXT_PUBLIC_PINATA_API_KEY);
      const hasSecretKey = !!(process.env.NEXT_PUBLIC_PINATA_SECRET_KEY);
      
      console.log('Environment check:', {
        hasApiKey,
        hasSecretKey,
        apiKeyLength: process.env.NEXT_PUBLIC_PINATA_API_KEY?.length || 0,
        secretKeyLength: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY?.length || 0
      });
      
      if (!hasApiKey || !hasSecretKey) {
        throw new Error('Missing Pinata API credentials');
      }
      
      // Create a test file
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const testURI = await uploadToIPFS(testFile);
      console.log('✅ Test upload successful:', testURI);
      setDebugInfo(`IPFS test successful: ${testURI}`);
      
    } catch (error) {
      console.error('❌ IPFS test failed:', error);
      setDebugInfo(`IPFS test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test contract connection
  const testContractConnection = async () => {
    try {
      console.log('🧪 Testing contract connection...');
      setDebugInfo('Testing contract connection...');
      
      // Test if contract exists at the address
      const bytecode = await publicClient.getBytecode({ address: CONTRACT_ADDRESS as `0x${string}` });
      console.log('Contract bytecode exists:', !!bytecode);
      
      if (!bytecode) {
        throw new Error('No contract found at the specified address');
      }
      
      // Test if we can call a read function (like checking if token exists)
      try {
        const exists = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: contractABI,
          functionName: 'exists',
          args: [BigInt(1)],
        });
        console.log('✅ Contract read test successful:', exists);
        setDebugInfo(`Contract accessible: ${CONTRACT_ADDRESS}`);
      } catch (readError) {
        console.log('Contract exists but read failed:', readError);
        setDebugInfo(`Contract at ${CONTRACT_ADDRESS} exists but may have different ABI`);
      }
      
    } catch (error) {
      console.error('❌ Contract test failed:', error);
      setDebugInfo(`Contract test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
                  disabled={isMinting || isConfirming || isPending || !audioFile || !imageFile || !nftName || !nftDescription}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Waiting for Wallet...' :
                    isMinting ? 'Preparing Transaction...' :
                    isConfirming ? 'Confirming Transaction...' :
                      'Upload Music'}
                </button>
              </div>
              
              {/* Wallet test button for debugging */}
              {(isMobile || isFarcasterFrame) && (
                <div className="flex justify-center mt-2 space-x-2">
                  <button
                    onClick={testWalletConnection}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                  >
                    Test Wallet
                  </button>
                  <button
                    onClick={testIPFSConnection}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                  >
                    Test IPFS
                  </button>
                  <button
                    onClick={testContractConnection}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                  >
                    Test Contract
                  </button>
                </div>
              )}
              {mintError && (
                <div className="text-center text-red-500 mt-2">
                  {mintError}
                </div>
              )}
              {debugInfo && (
                <div className="text-center text-blue-400 mt-2 text-sm">
                  {debugInfo}
                </div>
              )}
              {(isMobile || isFarcasterFrame) && (
                <div className="text-center text-xs text-gray-500 mt-2">
                  Mobile: {isMobile ? 'Yes' : 'No'} | Farcaster: {isFarcasterFrame ? 'Yes' : 'No'} | Wallet: {connector?.name || 'None'}
                  <br />
                  SDK: {isSDKLoaded ? 'Loaded' : 'Loading'} | Ready: {isReady ? 'Yes' : 'No'} | ETH Provider: {ethProvider ? 'Available' : 'None'}
                </div>
              )}
              {txHash && (
                <div className="text-center space-y-2">
                  <div className="text-green-500">
                    {isConfirmed ? 'Song Minted Successfully!' : 'Transaction Submitted!'}
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
              
              {/* Manual transaction verification for debugging */}
              {(isMobile || isFarcasterFrame) && !txHash && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Debug: Manual Transaction Verification</div>
                  <input
                    type="text"
                    placeholder="Enter transaction hash if you see one in your wallet"
                    value={manualTxHash}
                    onChange={(e) => setManualTxHash(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none text-xs"
                  />
                  {manualTxHash && (
                    <button
                      onClick={() => setTxHash(manualTxHash as `0x${string}`)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
                    >
                      Verify Transaction
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 