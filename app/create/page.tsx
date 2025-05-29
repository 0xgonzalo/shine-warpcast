'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, publicClient } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useFarcaster } from '../context/FarcasterContext';
import { encodeFunctionData, parseGwei } from 'viem';

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
  const isFarcasterFrame = connector?.id === 'farcasterFrame' || (isSDKLoaded && context?.client?.name === 'farcaster');

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
        isFarcasterFrame
      });
      
      // For Farcaster Mini Apps, use direct SDK approach
      if (isFarcasterFrame && ethProvider) {
        setDebugInfo('Using Farcaster SDK transaction method...');
        await mintWithFarcasterSDK(mintArgs);
      } else {
        setDebugInfo('Simulating transaction...');
        
        // First simulate the transaction to catch any issues
        try {
          const simulation = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: contractABI,
            functionName: 'mint',
            args: mintArgs,
            account: address as `0x${string}`,
          });
          
          console.log('✅ Transaction simulation successful:', simulation);
          setDebugInfo('Simulation successful, submitting transaction...');
          
          // Now execute with wagmi
          writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: contractABI,
            functionName: 'mint',
            args: mintArgs,
            gas: BigInt(600000), // Increased gas limit
          });
        } catch (simulationError) {
          console.error('❌ Transaction simulation failed:', simulationError);
          throw new Error(`Transaction would fail: ${simulationError instanceof Error ? simulationError.message : 'Unknown simulation error'}`);
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

  // Enhanced Farcaster SDK transaction method
  const mintWithFarcasterSDK = async (mintArgs: readonly [`0x${string}`, string, string, string, string, bigint]) => {
    if (!ethProvider) {
      throw new Error('Farcaster eth provider not available');
    }

    console.log('🔄 Using Farcaster SDK transaction method...');
    setDebugInfo('Preparing Farcaster-optimized transaction...');
    
    try {
      // First, let's verify the contract exists and is accessible
      const code = await ethProvider.request({
        method: 'eth_getCode',
        params: [CONTRACT_ADDRESS, 'latest'],
      });
      
      if (code === '0x') {
        throw new Error('Contract not found at specified address');
      }
      
      console.log('✅ Contract verified at address:', CONTRACT_ADDRESS);
      
      // Encode the function call
      const data = encodeFunctionData({
        abi: contractABI,
        functionName: 'mint',
        args: mintArgs,
      });

      // Check if the mint function is payable (might need ETH value)
      // Some contracts require a small payment to avoid spam
      const testValue = '0x0'; // Start with 0, but we might need to add value
      
      console.log('🔍 Testing transaction with simulation...');
      
      // Try to simulate the call first
      try {
        const callResult = await ethProvider.request({
          method: 'eth_call',
          params: [{
            to: CONTRACT_ADDRESS,
            from: address,
            data,
            value: testValue,
          }, 'latest'],
        });
        
        console.log('✅ eth_call simulation successful:', callResult);
      } catch (callError) {
        console.log('⚠️ eth_call failed, this might be expected for state-changing functions:', callError);
      }

      setDebugInfo('Estimating gas for transaction...');

      // Estimate gas using the Farcaster provider
      const gasEstimate = await ethProvider.request({
        method: 'eth_estimateGas',
        params: [{
          to: CONTRACT_ADDRESS,
          from: address,
          data,
          value: testValue,
        }],
      });

      console.log('⛽ Gas estimate:', gasEstimate);
      
      // Add 50% buffer to gas estimate for Farcaster compatibility
      const gasLimit = BigInt(Math.floor(parseInt(gasEstimate, 16) * 1.5));
      
      setDebugInfo(`Gas estimated: ${gasLimit.toString()}, getting network info...`);

      // Get current gas price
      const gasPrice = await ethProvider.request({
        method: 'eth_gasPrice',
        params: [],
      });

      // Get chain ID to verify we're on the right network
      const chainId = await ethProvider.request({
        method: 'eth_chainId',
        params: [],
      });

      console.log('🌐 Network info:', {
        chainId: parseInt(chainId, 16),
        gasPrice,
        gasLimit: gasLimit.toString()
      });

      // Verify we're on Base Sepolia (chain ID 84532)
      if (parseInt(chainId, 16) !== 84532) {
        throw new Error(`Wrong network! Expected Base Sepolia (84532), got ${parseInt(chainId, 16)}`);
      }

      setDebugInfo('Sending transaction to Farcaster wallet...');

      // For Farcaster, try EIP-1559 transaction format which is better recognized
      // Get the base fee from the latest block
      const latestBlock = await ethProvider.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      });

      let txParams;
      
      // If the network supports EIP-1559, use it for better wallet recognition
      if (latestBlock.baseFeePerGas) {
        const baseFeePerGas = BigInt(latestBlock.baseFeePerGas);
        const maxPriorityFeePerGas = parseGwei('2'); // 2 gwei tip
        const maxFeePerGas = baseFeePerGas * BigInt(2) + maxPriorityFeePerGas; // 2x base fee + tip
        
        txParams = {
          to: CONTRACT_ADDRESS,
          from: address,
          data,
          gas: `0x${gasLimit.toString(16)}`,
          maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
          value: testValue,
          type: '0x2', // EIP-1559 transaction type
        };
        
        console.log('📤 Using EIP-1559 transaction parameters:', txParams);
      } else {
        // Fallback to legacy transaction
        txParams = {
          to: CONTRACT_ADDRESS,
          from: address,
          data,
          gas: `0x${gasLimit.toString(16)}`,
          gasPrice: gasPrice,
          value: testValue,
        };
        
        console.log('📤 Using legacy transaction parameters:', txParams);
      }

      const txHash = await ethProvider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      console.log('✅ Transaction sent via Farcaster SDK:', txHash);
      setTxHash(txHash as `0x${string}`);
      setDebugInfo(`Transaction submitted: ${txHash}`);
      setIsMinting(false);
      
      return txHash;
    } catch (error) {
      console.error('❌ Farcaster SDK transaction failed:', error);
      
      // If the error suggests the transaction needs payment, try with a small value
      if (error instanceof Error && (error.message.includes('revert') || error.message.includes('insufficient'))) {
        console.log('🔄 Trying transaction with small ETH value...');
        setDebugInfo('Retrying with payment value...');
        
        try {
          return await mintWithFarcasterSDKWithValue(mintArgs);
        } catch (retryError) {
          console.error('❌ Retry with value also failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  };

  // Alternative method with ETH value for contracts that require payment
  const mintWithFarcasterSDKWithValue = async (mintArgs: readonly [`0x${string}`, string, string, string, string, bigint]) => {
    if (!ethProvider) {
      throw new Error('Farcaster eth provider not available');
    }

    console.log('🔄 Trying transaction with ETH value...');
    
    const data = encodeFunctionData({
      abi: contractABI,
      functionName: 'mint',
      args: mintArgs,
    });

    // Try with a small amount of ETH (0.001 ETH = 1000000000000000 wei)
    const ethValue = '0x38D7EA4C68000'; // 0.001 ETH in hex

    const gasEstimate = await ethProvider.request({
      method: 'eth_estimateGas',
      params: [{
        to: CONTRACT_ADDRESS,
        from: address,
        data,
        value: ethValue,
      }],
    });

    const gasLimit = BigInt(Math.floor(parseInt(gasEstimate, 16) * 1.5));
    const gasPrice = await ethProvider.request({
      method: 'eth_gasPrice',
      params: [],
    });

    const txHash = await ethProvider.request({
      method: 'eth_sendTransaction',
      params: [{
        to: CONTRACT_ADDRESS,
        from: address,
        data,
        gas: `0x${gasLimit.toString(16)}`,
        gasPrice: gasPrice,
        value: ethValue,
      }],
    });

    console.log('✅ Transaction with value sent:', txHash);
    setTxHash(txHash as `0x${string}`);
    setDebugInfo(`Transaction with payment submitted: ${txHash}`);
    setIsMinting(false);
    
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
        
        // Test mint function simulation
        try {
          const testMintArgs: readonly [`0x${string}`, string, string, string, string, bigint] = [
            address as `0x${string}`,
            'Test Song',
            'Test Description',
            'ipfs://QmTestAudio',
            'ipfs://QmTestImage',
            BigInt(1)
          ];
          
          const simulation = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: contractABI,
            functionName: 'mint',
            args: testMintArgs,
            account: address as `0x${string}`,
          });
          
          console.log('✅ Mint function simulation successful:', simulation);
          setDebugInfo(`Contract fully accessible: ${CONTRACT_ADDRESS} - Mint function OK`);
        } catch (mintError) {
          console.log('⚠️ Mint simulation failed:', mintError);
          setDebugInfo(`Contract accessible but mint may have issues: ${mintError instanceof Error ? mintError.message : 'Unknown error'}`);
        }
        
      } catch (readError) {
        console.log('Contract exists but read failed:', readError);
        setDebugInfo(`Contract at ${CONTRACT_ADDRESS} exists but may have different ABI`);
      }
      
    } catch (error) {
      console.error('❌ Contract test failed:', error);
      setDebugInfo(`Contract test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test Farcaster Mini App environment
  const testFarcasterEnvironment = async () => {
    try {
      console.log('🧪 Testing Farcaster environment...');
      setDebugInfo('Testing Farcaster Mini App environment...');
      
      if (!isFarcasterFrame) {
        setDebugInfo('Not in Farcaster frame environment');
        return;
      }
      
      if (!ethProvider) {
        throw new Error('Farcaster eth provider not available');
      }
      
      // Test basic provider functionality
      const chainId = await ethProvider.request({ method: 'eth_chainId' });
      console.log('Chain ID:', chainId);
      
      const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
      console.log('Connected accounts:', accounts);
      
      // Test gas estimation
      const testData = encodeFunctionData({
        abi: contractABI,
        functionName: 'mint',
        args: [
          address as `0x${string}`,
          'Test Song',
          'Test Description', 
          'ipfs://test-audio',
          'ipfs://test-image',
          BigInt(1)
        ],
      });
      
      const gasEstimate = await ethProvider.request({
        method: 'eth_estimateGas',
        params: [{
          to: CONTRACT_ADDRESS,
          from: address,
          data: testData,
        }],
      });
      
      console.log('✅ Gas estimation successful:', gasEstimate);
      setDebugInfo(`Farcaster environment OK - Chain: ${parseInt(chainId, 16)}, Gas est: ${parseInt(gasEstimate, 16)}`);
      
    } catch (error) {
      console.error('❌ Farcaster environment test failed:', error);
      setDebugInfo(`Farcaster test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              
              {/* Debug test buttons */}
              <div className="flex justify-center mt-2">
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
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
                  <button
                    onClick={testFarcasterEnvironment}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    Test Farcaster
                  </button>
                </div>
              </div>
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
                  <br />
                  Context: {context?.client?.name || 'None'} | Chain: {context?.client?.chain || 'Unknown'}
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
              
              {/* Farcaster-specific troubleshooting info */}
              {isFarcasterFrame && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-xs text-yellow-200">
                  <div className="font-semibold mb-1">⚠️ Farcaster Wallet Scanner Notice</div>
                  <div className="space-y-1 text-yellow-300/80">
                    <div>• If you see &quot;No state changes detected&quot;, this is a wallet security feature</div>
                    <div>• The transaction should still work - check BaseScan for confirmation</div>
                    <div>• Use the test buttons above to verify everything is working</div>
                    <div>• Some new contracts trigger false positives in wallet scanners</div>
                  </div>
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