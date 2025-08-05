import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import songDataBaseABI from '../../abi/SongDataBase.json';

// Use the imported ABI from the generated file  
const contractABI = songDataBaseABI as any;

// Define types for the contract metadata
interface SongMetadata {
  title: string;
  artistName: string;
  mediaURI: string;
  metadataURI: string;
  artistAddress: `0x${string}`;
  tags: string[];
  price: bigint;
  timesBought: bigint;
  isAnSpecialEdition: boolean;
  specialEditionName: string;
  maxSupplySpecialEdition: bigint;
}

export const CONTRACT_ADDRESS = '0xF66464ccf2d0e56DFA15572c122C6474B0A1c82C';

// Create a public client for reading from the contract
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Contract interaction functions
export async function getSongMetadata(songId: bigint): Promise<SongMetadata> {
  try {
    const metadata = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'getSongMetadata',
      args: [songId],
    });
    return metadata as SongMetadata;
  } catch (error) {
    console.error('Error fetching song metadata:', error);
    throw error;
  }
}

export async function checkSongExists(songId: bigint) {
  try {
    console.log(`🔍 checkSongExists: Checking song ID ${songId}...`);
    const exists = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'songIdExists',
      args: [songId],
    });
    console.log(`✅ checkSongExists: Song ID ${songId} exists:`, exists);
    return exists;
  } catch (error) {
    console.error(`❌ checkSongExists: Error checking if song ${songId} exists:`, error);
    throw error;
  }
}

export async function getTotalSongCount(): Promise<bigint> {
  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'getTotalSongCount',
      args: [],
    });
    return count as bigint;
  } catch (error) {
    console.error('Error fetching total song count:', error);
    throw error;
  }
}

// Function to test contract connection
export async function testContractConnection() {
  try {
    console.log('🧪 Testing contract connection...');
    console.log('📍 Contract Address:', CONTRACT_ADDRESS);
    console.log('🌐 Network: Base Sepolia');
    
    // Try to get total song count as a simple test
    const count = await getTotalSongCount();
    console.log('✅ Contract connection successful! Total songs:', count.toString());
    return { success: true, totalSongs: count };
  } catch (error) {
    console.error('❌ Contract connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserCollection(farcasterId: bigint) {
  try {
    const collection = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'getUserCollection',
      args: [farcasterId],
    });
    return collection;
  } catch (error) {
    console.error('Error fetching user collection:', error);
    throw error;
  }
}

export async function getTotalPriceForBuy(songIds: bigint[]) {
  try {
    const totalPrice = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'getTotalPriceForBuy',
      args: [songIds],
    });
    return totalPrice;
  } catch (error) {
    console.error('Error calculating total price:', error);
    throw error;
  }
}

// Adapter function to convert new SongMetadata to old NFT metadata format
export function adaptSongMetadataToNFT(songMetadata: SongMetadata) {
  return {
    name: songMetadata.title,
    description: '', // Not available in new contract, could be derived from metadataURI
    audioURI: songMetadata.mediaURI,
    imageURI: songMetadata.metadataURI, // Using metadataURI as imageURI fallback
    creator: songMetadata.artistAddress
  };
}

// Legacy function that returns adapted metadata for backward compatibility
export async function getNFTMetadata(tokenId: bigint) {
  const songMetadata = await getSongMetadata(tokenId);
  return adaptSongMetadataToNFT(songMetadata);
}

// Legacy function names for backward compatibility
export const checkNFTExists = checkSongExists;

// Function to get recently collected songs using the new contract events
export async function getRecentlyCollectedSongs(limit: number = 10) {
  try {
    console.log('🔍 Fetching recently collected songs...');
    
    // Get the latest block number
    const latestBlock = await publicClient.getBlockNumber();
    console.log('📦 Latest block:', latestBlock.toString());
    
    // Look back more blocks to catch more events (10000 blocks ≈ ~33 hours on Base)
    const fromBlock = latestBlock - BigInt(10000);
    console.log('📦 Searching from block:', fromBlock.toString(), 'to', latestBlock.toString());
    
    // Get UserBuy and UserInstaBuy events
    const [userBuyLogs, userInstaBuyLogs] = await Promise.all([
      publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'UserBuy',
          inputs: [
            { name: 'audioIds', type: 'uint256[]', indexed: true },
            { name: 'farcasterId', type: 'uint256', indexed: true }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      }),
      publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'UserInstaBuy',
          inputs: [
            { name: 'audioId', type: 'uint256', indexed: true },
            { name: 'farcasterId', type: 'uint256', indexed: true }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      })
    ]);

    console.log('📋 UserBuy events found:', userBuyLogs.length);
    console.log('📋 UserInstaBuy events found:', userInstaBuyLogs.length);

    // Process events and extract song IDs
    const collectedSongs = new Map<string, { songId: bigint, blockNumber: bigint, farcasterId: bigint }>();
    
    // Process UserBuy events (multiple songs)
    userBuyLogs.forEach(log => {
      const audioIds = log.args.audioIds;
      const farcasterId = log.args.farcasterId;
      const blockNumber = log.blockNumber;
      
      if (audioIds && farcasterId && blockNumber) {
        audioIds.forEach(songId => {
          const key = `${songId}_${blockNumber}`;
          collectedSongs.set(key, { songId, blockNumber, farcasterId });
        });
      }
    });

    // Process UserInstaBuy events (single songs)
    userInstaBuyLogs.forEach(log => {
      const audioId = log.args.audioId;
      const farcasterId = log.args.farcasterId;
      const blockNumber = log.blockNumber;
      
      if (audioId && farcasterId && blockNumber) {
        const key = `${audioId}_${blockNumber}`;
        collectedSongs.set(key, { songId: audioId, blockNumber, farcasterId });
      }
    });

    // Convert to array and sort by most recent first
    const sortedCollections = Array.from(collectedSongs.values())
      .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
      .slice(0, limit);

    console.log('🎵 Collection events after processing:', sortedCollections.length);

    // If no collection events found, use fallback
    if (sortedCollections.length === 0) {
      console.log('⚠️ No collection events found, trying fallback approach...');
      return await getFallbackRecentSongs(limit);
    }

    // Get metadata for each collected song
    const recentlyCollected = [];
    for (const collection of sortedCollections) {
      try {
        console.log('📝 Fetching metadata for song:', collection.songId.toString());
        const songMetadata = await getSongMetadata(collection.songId);
        const metadata = adaptSongMetadataToNFT(songMetadata);
        recentlyCollected.push({
          songId: collection.songId,
          tokenId: collection.songId, // For backward compatibility
          metadata,
          collectedAt: collection.blockNumber,
          farcasterId: collection.farcasterId
        });
      } catch (error) {
        console.error(`❌ Error fetching metadata for song ${collection.songId}:`, error);
      }
    }

    console.log('🎉 Successfully fetched', recentlyCollected.length, 'recently collected songs');
    return recentlyCollected;
  } catch (error) {
    console.error('❌ Error fetching recently collected songs:', error);
    // Try fallback approach
    return await getFallbackRecentSongs(limit);
  }
}

// Legacy function name for backward compatibility
export const getRecentlyCollectedNFTs = getRecentlyCollectedSongs;

// Fallback function to get existing songs (for when no recent collections are found)
async function getFallbackRecentSongs(limit: number = 10) {
  console.log('🔄 Using fallback approach to get existing songs...');
  
  try {
    const recentlyCollected = [];
    
    // Get total song count first to know the range
    let totalSongs: bigint;
    try {
      totalSongs = await getTotalSongCount();
      console.log('📊 Total songs in contract:', totalSongs.toString());
    } catch (error) {
      console.log('⚠️ Could not get total song count, using manual scan...');
      totalSongs = BigInt(50); // Default fallback
    }
    
    // Scan in descending order to get most recent songs first
    const maxSongId = Math.min(Number(totalSongs), 50);
    for (let i = maxSongId; i >= 1 && recentlyCollected.length < limit; i--) {
      try {
        const songId = BigInt(i);
        const exists = await checkSongExists(songId);
        
        if (exists) {
          console.log('✅ Found existing song:', songId.toString());
          const songMetadata = await getSongMetadata(songId);
          const metadata = adaptSongMetadataToNFT(songMetadata);
          recentlyCollected.push({
            songId,
            tokenId: songId, // For backward compatibility
            metadata,
            collectedAt: BigInt(0) // No specific collection block
          });
        } else {
          console.log('❌ Song does not exist:', songId.toString());
        }
      } catch (error) {
        console.error(`❌ Error checking song ${i}:`, error);
        continue;
      }
    }
    
    console.log('🎵 Fallback found', recentlyCollected.length, 'existing songs (newest first)');
    return recentlyCollected;
  } catch (error) {
    console.error('❌ Fallback approach failed:', error);
    return [];
  }
}

// Export the contract ABI for use in the frontend
export { contractABI };

// Function to get most collected artists using the new contract events
export async function getMostCollectedArtists(limit: number = 6) {
  try {
    console.log('🎨 Fetching most collected artists...');
    
    // Use a smaller block range to reduce load
    const latestBlock = await publicClient.getBlockNumber();
    console.log('📦 Latest block:', latestBlock.toString());
    
    // Look back fewer blocks to reduce load (5000 blocks ≈ ~16 hours on Base)
    const fromBlock = latestBlock - BigInt(5000);
    console.log('📦 Searching from block:', fromBlock.toString(), 'to', latestBlock.toString());
    
    // Get UserBuy and UserInstaBuy events to analyze collections
    const [userBuyLogs, userInstaBuyLogs] = await Promise.all([
      publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'UserBuy',
          inputs: [
            { name: 'audioIds', type: 'uint256[]', indexed: true },
            { name: 'farcasterId', type: 'uint256', indexed: true }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      }),
      publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'UserInstaBuy',
          inputs: [
            { name: 'audioId', type: 'uint256', indexed: true },
            { name: 'farcasterId', type: 'uint256', indexed: true }
          ]
        },
        fromBlock,
        toBlock: 'latest'
      })
    ]);

    console.log('📋 UserBuy events found:', userBuyLogs.length);
    console.log('📋 UserInstaBuy events found:', userInstaBuyLogs.length);

    // If no events found, use fallback immediately
    if (userBuyLogs.length === 0 && userInstaBuyLogs.length === 0) {
      console.log('⚠️ No collection events found, using fallback...');
      return await getFallbackMostActiveCreators(limit);
    }

    // Process events and count collections per song
    const songCollectionCounts = new Map<string, number>();
    
    // Process UserBuy events (multiple songs)
    userBuyLogs.forEach(log => {
      const audioIds = log.args.audioIds;
      if (audioIds) {
        audioIds.forEach(songId => {
          const key = songId.toString();
          songCollectionCounts.set(key, (songCollectionCounts.get(key) || 0) + 1);
        });
      }
    });

    // Process UserInstaBuy events (single songs)
    userInstaBuyLogs.forEach(log => {
      const audioId = log.args.audioId;
      if (audioId) {
        const key = audioId.toString();
        songCollectionCounts.set(key, (songCollectionCounts.get(key) || 0) + 1);
      }
    });

    // Get unique song IDs (limit to avoid too many calls)
    const collectedSongIds = Array.from(songCollectionCounts.keys())
      .sort((a, b) => (songCollectionCounts.get(b) || 0) - (songCollectionCounts.get(a) || 0))
      .slice(0, 20)
      .map(id => BigInt(id));
    
    console.log('🎵 Processing', collectedSongIds.length, 'unique song IDs');

    // Batch metadata calls with error handling
    const songMetadataMap = new Map();
    const artistCollectionCounts: { [artist: string]: number } = {};
    const artistSongs: { [artist: string]: bigint[] } = {};

    // Process songs in smaller batches to avoid overwhelming the RPC
    const batchSize = 5;
    for (let i = 0; i < collectedSongIds.length; i += batchSize) {
      const batch = collectedSongIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (songId) => {
          try {
            const metadata = await getSongMetadata(songId);
            songMetadataMap.set(songId, metadata);
            
            const artist = metadata.artistAddress.toLowerCase();
            const songCollections = songCollectionCounts.get(songId.toString()) || 0;
            
            if (!artistCollectionCounts[artist]) {
              artistCollectionCounts[artist] = 0;
              artistSongs[artist] = [];
            }
            
            artistCollectionCounts[artist] += songCollections;
            artistSongs[artist].push(songId);
          } catch (error) {
            console.error(`❌ Error fetching metadata for song ${songId}:`, error);
          }
        })
      );
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < collectedSongIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // If still no data, use fallback
    if (Object.keys(artistCollectionCounts).length === 0) {
      console.log('⚠️ No artist data found, using fallback...');
      return await getFallbackMostActiveCreators(limit);
    }

    // Sort and limit results
    const sortedArtists = Object.entries(artistCollectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    console.log('🎨 Top artists by collections:', sortedArtists);

    // Build final result
    const topArtists = sortedArtists.map(([artist, totalCollections]) => {
      const songs = artistSongs[artist];
      const exampleSongId = songs[0];
      const exampleMetadata = songMetadataMap.get(exampleSongId);
      
      return {
        artist: artist as `0x${string}`,
        address: artist as `0x${string}`, // For backward compatibility
        totalCollections,
        collectionCount: totalCollections, // For backward compatibility
        tokenCount: songs.length,
        exampleToken: exampleMetadata ? {
          tokenId: exampleSongId,
          name: (exampleMetadata as SongMetadata).title,
          imageURI: (exampleMetadata as SongMetadata).metadataURI // Using metadataURI as imageURI fallback
        } : null
      };
    });

    console.log('🎉 Successfully fetched', topArtists.length, 'most collected artists');
    return topArtists;
  } catch (error) {
    console.error('❌ Error fetching most collected artists:', error);
    // Always fallback on error
    return await getFallbackMostActiveCreators(limit);
  }
}

// Fallback function to get creators with most songs (optimized)
async function getFallbackMostActiveCreators(limit: number = 6) {
  console.log('🔄 Using fallback approach to get most active creators...');
  
  try {
    const artistSongCounts: { [artist: string]: bigint[] } = {};
    
    // Get total song count first to know the range
    let totalSongs: bigint;
    try {
      totalSongs = await getTotalSongCount();
      console.log('📊 Total songs in contract:', totalSongs.toString());
    } catch (error) {
      console.log('⚠️ Could not get total song count, using manual scan...');
      totalSongs = BigInt(20); // Default fallback
    }
    
    // Scan fewer songs to reduce load
    const maxSongsToScan = Math.min(Number(totalSongs), 20);
    for (let i = 1; i <= maxSongsToScan && Object.keys(artistSongCounts).length < limit * 2; i++) {
      try {
        const songId = BigInt(i);
        const exists = await checkSongExists(songId);
        
        if (exists) {
          const metadata = await getSongMetadata(songId);
          const artist = metadata.artistAddress.toLowerCase();
          
          if (!artistSongCounts[artist]) {
            artistSongCounts[artist] = [];
          }
          artistSongCounts[artist].push(songId);
        }
        
        // Add small delay to avoid overwhelming the RPC
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`❌ Error checking song ${i}:`, error);
        continue;
      }
    }
    
    // Sort artists by song count
    const sortedArtists = Object.entries(artistSongCounts)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, limit);

    console.log('🎨 Top artists by song count:', sortedArtists.map(([artist, songs]) => [artist, songs.length]));

    // Build result without additional metadata calls
    const topArtists = await Promise.all(
      sortedArtists.map(async ([artist, songs]) => {
        try {
          // Get metadata for the first song only
          const exampleSongId = songs[0];
          const exampleMetadata = await getSongMetadata(exampleSongId);
          
          return {
            artist: artist as `0x${string}`,
            address: artist as `0x${string}`, // For backward compatibility
            totalCollections: 0, // No collection data in fallback
            collectionCount: 0, // For backward compatibility
            tokenCount: songs.length,
            exampleToken: {
              tokenId: exampleSongId,
              name: exampleMetadata.title,
              imageURI: exampleMetadata.metadataURI // Using metadataURI as imageURI fallback
            }
          };
        } catch (error) {
          console.error(`❌ Error getting example song for artist ${artist}:`, error);
          return {
            artist: artist as `0x${string}`,
            address: artist as `0x${string}`, // For backward compatibility
            totalCollections: 0,
            collectionCount: 0,
            tokenCount: songs.length,
            exampleToken: null
          };
        }
      })
    );
    
    console.log('🎵 Fallback found', topArtists.length, 'most active creators');
    return topArtists;
  } catch (error) {
    console.error('❌ Fallback approach failed:', error);
    return [];
  }
} 