'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../utils/contract';
import NFTCard from './NFTCard';

interface NFTExistsProps {
  tokenId: bigint;
}

export default function NFTExists({ tokenId }: NFTExistsProps) {
  const { data: exists, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'songIdExists',
    args: [tokenId],
  });

  if (isLoading || isError || !exists) return null;
  return <NFTCard tokenId={tokenId} />;
} 