'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFarcaster } from '../context/FarcasterContext';

export default function ProfilePage() {
  const { address } = useAccount();
  const router = useRouter();
  const { context: farcasterContext } = useFarcaster();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Wait for both wallet address and Farcaster context to be available
    // This ensures we have the FID before redirecting
    if (address && !hasRedirected) {
      // Check if Farcaster context is loaded
      const realFid = (farcasterContext as any)?.user?.fid;

      // Only redirect once we have the FID or after a short timeout
      if (realFid) {
        setHasRedirected(true);
        router.push(`/profile/${address}?fid=${realFid}`);
      } else {
        // If no FID after 1 second, redirect anyway (fallback for non-Farcaster users)
        const timeout = setTimeout(() => {
          if (!hasRedirected) {
            setHasRedirected(true);
            router.push(`/profile/${address}`);
          }
        }, 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, [address, router, farcasterContext, hasRedirected]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        {address ? (
          <p className="text-gray-400">Loading your profile...</p>
        ) : (
          <p className="text-gray-400">
            Connect your wallet to view your profile or visit any profile by going to /profile/[wallet-address]
          </p>
        )}
      </div>
    </main>
  );
} 