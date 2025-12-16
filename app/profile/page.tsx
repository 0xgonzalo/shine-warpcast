'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFarcaster } from '../context/FarcasterContext';

export default function ProfilePage() {
  const { address } = useAccount();
  const router = useRouter();
  const { context: farcasterContext } = useFarcaster();

  useEffect(() => {
    // If user has a connected wallet, redirect to their profile
    // Include FID from Farcaster context if available for proper profile resolution
    if (address) {
      const realFid = (farcasterContext as any)?.user?.fid;
      const url = realFid
        ? `/profile/${address}?fid=${realFid}`
        : `/profile/${address}`;
      router.push(url);
    }
  }, [address, router, farcasterContext]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <p className="text-gray-400">
          Connect your wallet to view your profile or visit any profile by going to /profile/[wallet-address]
        </p>
      </div>
    </main>
  );
} 