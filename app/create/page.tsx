'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseEventLogs } from 'viem';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import { uploadToIPFS, uploadMetadataToIPFS } from '@/app/utils/pinata';
import { useAudio } from '../context/AudioContext';
import { useFarcaster } from '../context/FarcasterContext';
import { useTheme } from '../context/ThemeContext';
import CreatedModal from '../components/CreatedModal';
import AudioUploadSection from '../components/create/AudioUploadSection';
import ImageUploadSection from '../components/create/ImageUploadSection';
import SongDetailsForm from '../components/create/SongDetailsForm';
import SpecialEditionToggle from '../components/create/SpecialEditionToggle';
import TagInput from '../components/create/TagInput';
import MintButton from '../components/create/MintButton';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

export default function CreatePage() {
  const { isDarkMode } = useTheme();
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const [nftName, setNftName] = useState('');
  const [nftArtist, setNftArtist] = useState('');
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { playAudio, currentAudio, isPlaying } = useAudio();
  const { isSDKLoaded } = useFarcaster();

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
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

  const [createdTokenId, setCreatedTokenId] = useState<bigint | null>(null);

  useEffect(() => {
    if (isConfirmed && hash && createdNFT) {
      console.log('Transaction confirmed:', hash);
      // Try to parse the tokenId from logs
      try {
        if (receipt?.logs && Array.isArray(receipt.logs)) {
          const decoded: any[] = (parseEventLogs as any)({
            abi: contractABI as any,
            logs: receipt.logs as any,
          });
          const creationEvent: any = decoded.find((e: any) => e.eventName === 'NewSongDrop' || e.eventName === 'NewSpecialEditionSongDrop');
          const tokenId = (creationEvent?.args as any)?.audioId as bigint | undefined;
          if (tokenId !== undefined) {
            setCreatedTokenId(tokenId);
          }
        }
      } catch (err) {
        console.warn('Could not parse tokenId from receipt logs:', err);
      }
      setShowCreatedModal(true);
      setIsMinting(false);
    }
  }, [isConfirmed, hash, createdNFT, receipt, contractABI]);

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

  // Predefined genre options
  const genreOptions = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'R&B', 'Reggae', 'Folk',
    'Blues', 'Punk', 'Metal', 'Disco', 'Funk', 'Gospel', 'House', 'Techno', 'Dubstep', 'Ambient',
    'Indie', 'Alternative', 'Experimental', 'Lo-fi', 'Trap', 'Drill', 'Afrobeat', 'Latin', 'K-pop', 'Anime'
  ];

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags(prevTags => [...prevTags, trimmedTag]);
      setTagInput('');
    }
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
  }, []);

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  }, [tagInput, addTag]);

  const filteredGenres = genreOptions.filter(genre => 
    genre.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(genre)
  );

  const handleSpecialEditionToggle = useCallback(() => {
    setIsSpecialEdition(prev => !prev);
  }, []);

  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value);
  }, []);

  const handleMint = async () => {
    if (!address || !nftName || !nftDescription || !audioFile || !imageFile || !price) {
      setMintError('Please fill in all fields, set a price, and upload both audio and image files');
      return;
    }

    // Validate price
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      setMintError('Please enter a valid price greater than 0');
      return;
    }

    // Validate special edition fields if enabled
    if (isSpecialEdition) {
      if (!specialEditionName.trim()) {
        setMintError('Please enter a special edition name');
        return;
      }
      const editionsNum = parseInt(numberOfEditions);
      if (isNaN(editionsNum) || editionsNum <= 0) {
        setMintError('Please enter a valid number of editions greater than 0');
        return;
      }
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
        imageURI,
        tags
      });
      
      console.log('✅ Metadata uploaded:', metadataURI);

      // Store NFT details for the success modal
      setCreatedNFT({
        imageURI,
        name: nftName,
        description: nftDescription
      });

      // Prepare contract parameters with proper validation
      const priceInWei = BigInt(Math.floor(priceFloat * 1e18));
      const editionsCount = isSpecialEdition ? BigInt(parseInt(numberOfEditions)) : BigInt(0);
      
      console.log('📋 Contract parameters:', {
        title: nftName,
        artistName: nftArtist,
        mediaURI: audioURI,
        metadataURI: metadataURI, // Now using the actual metadata JSON URI
        artistAddress: address,
        tags: [],
        price: priceInWei.toString(),
        isAnSpecialEdition: isSpecialEdition,
        specialEditionName: isSpecialEdition ? specialEditionName : '',
        maxSupplySpecialEdition: editionsCount.toString()
      });

      // Create new song using the SongDataBase contract
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: 'newSong',
        args: [
          nftName.trim(), // title
          nftArtist.trim(), // artistName
          audioURI, // mediaURI
          metadataURI, // metadataURI - using the metadata JSON URI
          address as `0x${string}`, // artistAddress
          tags, // tags array
          priceInWei, // price in wei
          isSpecialEdition, // isAnSpecialEdition
          isSpecialEdition ? specialEditionName.trim() : '', // specialEditionName
          editionsCount // maxSupplySpecialEdition
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
    setNftArtist('');
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
    setTags([]);
    setTagInput('');
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
            <AudioUploadSection
              audioFile={audioFile}
              audioPreview={audioPreview}
              fileError={fileError}
              onAudioUpload={handleAudioUpload}
              onPlayPreview={handlePlayPreview}
              currentAudio={currentAudio}
              isPlaying={isPlaying}
            />

            <ImageUploadSection
              imageFile={imageFile}
              imagePreview={imagePreview}
              onImageUpload={handleImageUpload}
            />

            <SongDetailsForm
              nftName={nftName}
              nftArtist={nftArtist}
              nftDescription={nftDescription}
              price={price}
              onNameChange={(e) => setNftName(e.target.value)}
              onArtistChange={(e) => setNftArtist(e.target.value)}
              onDescriptionChange={(e) => setNftDescription(e.target.value)}
              onPriceChange={(e) => setPrice(e.target.value)}
            />

            <SpecialEditionToggle
              isSpecialEdition={isSpecialEdition}
              specialEditionName={specialEditionName}
              numberOfEditions={numberOfEditions}
              specialEditionPrice={specialEditionPrice}
              onSpecialEditionToggle={handleSpecialEditionToggle}
              onSpecialEditionNameChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialEditionName(e.target.value)}
              onNumberOfEditionsChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberOfEditions(e.target.value)}
              onSpecialEditionPriceChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialEditionPrice(e.target.value)}
            />

            <div className="space-y-4">
              <TagInput
                tags={tags}
                tagInput={tagInput}
                onTagInputChange={handleTagInputChange}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onTagInputKeyDown={handleTagInputKeyDown}
                filteredGenres={filteredGenres}
              />
              <MintButton
                isMinting={isMinting}
                isPending={isPending}
                isConnected={isConnected}
                onMint={handleMint}
              />
              
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
                    href={`https://basescan.org/tx/${hash}`}
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
          tokenPath={createdTokenId ? `/token/${createdTokenId}` : undefined}
          onClose={() => setShowCreatedModal(false)}
        />
      )}
    </main>
  );
} 