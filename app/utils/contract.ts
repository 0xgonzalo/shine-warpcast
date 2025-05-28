import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract ABI - using explicit format
const contractABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'audioURI', type: 'string' },
      { name: 'imageURI', type: 'string' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getMetadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'audioURI', type: 'string' },
        { name: 'imageURI', type: 'string' },
        { name: 'creator', type: 'address' }
      ]
    }]
  },
  {
    name: 'exists',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'TransferSingle',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const;

export const CONTRACT_ADDRESS = '0x3a1eEAa401F13Be2e30EB519Ed06b23f3Ff43BD6';

// Create a public client for reading from the contract
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Contract interaction functions
export async function getNFTMetadata(tokenId: bigint) {
  try {
    const metadata = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'getMetadata',
      args: [tokenId],
    });
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

export async function checkNFTExists(tokenId: bigint) {
  try {
    const exists = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractABI,
      functionName: 'exists',
      args: [tokenId],
    });
    return exists;
  } catch (error) {
    console.error('Error checking if NFT exists:', error);
    throw error;
  }
}

// Function to get recently collected NFTs
export async function getRecentlyCollectedNFTs(limit: number = 10) {
  try {
    console.log('🔍 Fetching recently collected NFTs...');
    
    // Get the latest block number
    const latestBlock = await publicClient.getBlockNumber();
    console.log('📦 Latest block:', latestBlock.toString());
    
    // Look back more blocks to catch more events (10000 blocks ≈ ~33 hours on Base)
    const fromBlock = latestBlock - BigInt(10000);
    console.log('📦 Searching from block:', fromBlock.toString(), 'to', latestBlock.toString());
    
    // Get Transfer events (excluding mints - where from is zero address)
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS as `0x${string}`,
      event: {
        type: 'event',
        name: 'TransferSingle',
        inputs: [
          { name: 'operator', type: 'address', indexed: true },
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'id', type: 'uint256', indexed: false },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      },
      fromBlock,
      toBlock: 'latest'
    });

    console.log('📋 Total transfer events found:', logs.length);

    // Filter out mints (where from is zero address) and get unique token IDs
    const collectionEvents = logs
      .filter(log => {
        const isNotMint = log.args.from !== '0x0000000000000000000000000000000000000000';
        if (isNotMint) {
          console.log('✅ Collection event found:', {
            tokenId: log.args.id?.toString(),
            from: log.args.from,
            to: log.args.to,
            block: log.blockNumber?.toString()
          });
        }
        return isNotMint;
      })
      .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber)) // Sort by most recent first
      .slice(0, limit);

    console.log('🎵 Collection events after filtering:', collectionEvents.length);

    // If no collection events found, let's try a fallback approach
    if (collectionEvents.length === 0) {
      console.log('⚠️ No collection events found, trying fallback approach...');
      return await getFallbackRecentSongs(limit);
    }

    // Get metadata for each collected NFT
    const recentlyCollected = [];
    for (const event of collectionEvents) {
      try {
        const tokenId = event.args.id;
        if (tokenId !== undefined) {
          console.log('📝 Fetching metadata for token:', tokenId.toString());
          const metadata = await getNFTMetadata(tokenId);
          recentlyCollected.push({
            tokenId,
            metadata,
            collectedAt: event.blockNumber
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching metadata for token ${event.args.id}:`, error);
      }
    }

    console.log('🎉 Successfully fetched', recentlyCollected.length, 'recently collected NFTs');
    return recentlyCollected;
  } catch (error) {
    console.error('❌ Error fetching recently collected NFTs:', error);
    // Try fallback approach
    return await getFallbackRecentSongs(limit);
  }
}

// Fallback function to get existing songs (for when no recent collections are found)
async function getFallbackRecentSongs(limit: number = 10) {
  console.log('🔄 Using fallback approach to get existing songs...');
  
  try {
    const recentlyCollected = [];
    
    // Skip the first 3 token IDs (0, 1, 2) and start from a higher token ID
    // Scan in descending order to get most recent tokens first
    for (let i = 50; i >= 3 && recentlyCollected.length < limit; i--) {
      try {
        const tokenId = BigInt(i);
        const exists = await checkNFTExists(tokenId);
        
        if (exists) {
          console.log('✅ Found existing token:', tokenId.toString());
          const metadata = await getNFTMetadata(tokenId);
          recentlyCollected.push({
            tokenId,
            metadata,
            collectedAt: BigInt(0) // No specific collection block
          });
        } else {
          console.log('❌ Token does not exist:', tokenId.toString());
        }
      } catch (error) {
        console.error(`❌ Error checking token ${i}:`, error);
        continue;
      }
    }
    
    console.log('🎵 Fallback found', recentlyCollected.length, 'existing songs (excluding first 3 tokens, newest first)');
    return recentlyCollected;
  } catch (error) {
    console.error('❌ Fallback approach failed:', error);
    return [];
  }
}

// Export the contract ABI for use in the frontend
export { contractABI };

// Function to get most collected artists (optimized version)
export async function getMostCollectedArtists(limit: number = 6) {
  try {
    console.log('🎨 Fetching most collected artists...');
    
    // Use a smaller block range to reduce load
    const latestBlock = await publicClient.getBlockNumber();
    console.log('📦 Latest block:', latestBlock.toString());
    
    // Look back fewer blocks to reduce load (5000 blocks ≈ ~16 hours on Base)
    const fromBlock = latestBlock - BigInt(5000);
    console.log('📦 Searching from block:', fromBlock.toString(), 'to', latestBlock.toString());
    
    // Get Transfer events with a smaller range
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS as `0x${string}`,
      event: {
        type: 'event',
        name: 'TransferSingle',
        inputs: [
          { name: 'operator', type: 'address', indexed: true },
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'id', type: 'uint256', indexed: false },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      },
      fromBlock,
      toBlock: 'latest'
    });

    console.log('📋 Total transfer events found:', logs.length);

    // If too many events, limit to recent ones to avoid performance issues
    const recentLogs = logs.slice(0, 100); // Limit to 100 most recent events
    
    // Filter out mints
    const collectionEvents = recentLogs.filter(log => 
      log.args.from !== '0x0000000000000000000000000000000000000000'
    );

    // If no collections found, use fallback immediately
    if (collectionEvents.length === 0) {
      console.log('⚠️ No collection events found, using fallback...');
      return await getFallbackMostActiveCreators(limit);
    }

    // Get unique token IDs (limit to avoid too many calls)
    const collectedTokenIds = Array.from(new Set(collectionEvents.map(log => log.args.id).filter((id): id is bigint => id !== undefined))).slice(0, 20);
    console.log('🎵 Processing', collectedTokenIds.length, 'unique token IDs');

    // Batch metadata calls with error handling
    const tokenMetadataMap = new Map();
    const creatorCollectionCounts: { [creator: string]: number } = {};
    const creatorTokens: { [creator: string]: bigint[] } = {};

    // Process tokens in smaller batches to avoid overwhelming the RPC
    const batchSize = 5;
    for (let i = 0; i < collectedTokenIds.length; i += batchSize) {
      const batch = collectedTokenIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (tokenId) => {
          try {
            const metadata = await getNFTMetadata(tokenId);
            tokenMetadataMap.set(tokenId, metadata);
            
            const creator = metadata.creator.toLowerCase();
            const tokenCollections = collectionEvents.filter(log => log.args.id === tokenId).length;
            
            if (!creatorCollectionCounts[creator]) {
              creatorCollectionCounts[creator] = 0;
              creatorTokens[creator] = [];
            }
            
            creatorCollectionCounts[creator] += tokenCollections;
            creatorTokens[creator].push(tokenId);
          } catch (error) {
            console.error(`❌ Error fetching metadata for token ${tokenId}:`, error);
          }
        })
      );
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < collectedTokenIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // If still no data, use fallback
    if (Object.keys(creatorCollectionCounts).length === 0) {
      console.log('⚠️ No creator data found, using fallback...');
      return await getFallbackMostActiveCreators(limit);
    }

    // Sort and limit results
    const sortedCreators = Object.entries(creatorCollectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    console.log('🎨 Top creators by collections:', sortedCreators);

    // Build final result
    const topArtists = sortedCreators.map(([creator, collectionCount]) => {
      const tokens = creatorTokens[creator];
      const exampleTokenId = tokens[0];
      const exampleMetadata = tokenMetadataMap.get(exampleTokenId);
      
      return {
        address: creator as `0x${string}`,
        collectionCount,
        tokenCount: tokens.length,
        exampleToken: exampleMetadata ? {
          tokenId: exampleTokenId,
          name: exampleMetadata.name,
          imageURI: exampleMetadata.imageURI
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

// Fallback function to get creators with most tokens (optimized)
async function getFallbackMostActiveCreators(limit: number = 6) {
  console.log('🔄 Using fallback approach to get most active creators...');
  
  try {
    const creatorTokenCounts: { [creator: string]: bigint[] } = {};
    
    // Scan fewer tokens to reduce load (only scan 20 tokens instead of 50)
    const maxTokensToScan = 20;
    for (let i = 3; i <= maxTokensToScan && Object.keys(creatorTokenCounts).length < limit * 2; i++) {
      try {
        const tokenId = BigInt(i);
        const exists = await checkNFTExists(tokenId);
        
        if (exists) {
          const metadata = await getNFTMetadata(tokenId);
          const creator = metadata.creator.toLowerCase();
          
          if (!creatorTokenCounts[creator]) {
            creatorTokenCounts[creator] = [];
          }
          creatorTokenCounts[creator].push(tokenId);
        }
        
        // Add small delay to avoid overwhelming the RPC
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(`❌ Error checking token ${i}:`, error);
        continue;
      }
    }
    
    // Sort creators by token count
    const sortedCreators = Object.entries(creatorTokenCounts)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, limit);

    console.log('🎨 Top creators by token count:', sortedCreators.map(([creator, tokens]) => [creator, tokens.length]));

    // Build result without additional metadata calls
    const topArtists = await Promise.all(
      sortedCreators.map(async ([creator, tokens]) => {
        try {
          // Get metadata for the first token only
          const exampleTokenId = tokens[0];
          const exampleMetadata = await getNFTMetadata(exampleTokenId);
          
          return {
            address: creator as `0x${string}`,
            collectionCount: 0, // No collection data in fallback
            tokenCount: tokens.length,
            exampleToken: {
              tokenId: exampleTokenId,
              name: exampleMetadata.name,
              imageURI: exampleMetadata.imageURI
            }
          };
        } catch (error) {
          console.error(`❌ Error getting example token for creator ${creator}:`, error);
          return {
            address: creator as `0x${string}`,
            collectionCount: 0,
            tokenCount: tokens.length,
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