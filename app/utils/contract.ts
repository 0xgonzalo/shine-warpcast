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

// Export the contract ABI for use in the frontend
export { contractABI }; 