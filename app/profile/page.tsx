'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // If user has a connected wallet, redirect to their profile
    if (address) {
      router.push(`/profile/${address}`);
    }
  }, [address, router]);

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