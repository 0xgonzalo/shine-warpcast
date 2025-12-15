// Farcaster API utilities
'use client';

import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  custodyAddress?: string;
  primaryAddress?: string;
  verifiedAddresses?: string[];
  allAddresses?: string[];
}

// Note: This is a simplified implementation. In a real app, you'd want to use
// a proper Farcaster API service like Neynar, Airstack, or similar
// Cache only successful lookups to avoid persisting nulls after API fixes
const farcasterUserCache: Record<string, FarcasterUser> = {};
const farcasterUserByFidCache: Record<string, FarcasterUser> = {};

export async function getFarcasterUserByAddress(address: string): Promise<FarcasterUser | null> {
  try {
    const lower = address.toLowerCase();
    if (farcasterUserCache[lower]) return farcasterUserCache[lower];

    console.log(`🔍 Looking up Farcaster user for address: ${address}`);

    // Use Next API route to avoid exposing keys and to normalize shapes
    const res = await fetch(`/api/farcaster/by-address?address=${encodeURIComponent(lower)}&debug=1`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.debug) console.log('[FC] by-address debug:', json.debug);
      const { user } = json;
      if (user) {
        farcasterUserCache[lower] = user;
        return user;
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return null;
  }
}

export async function getFarcasterUserByFid(fid: number | string): Promise<FarcasterUser | null> {
  try {
    const key = String(fid);
    if (farcasterUserByFidCache[key]) return farcasterUserByFidCache[key];

    console.log(`🔍 Looking up Farcaster user by FID: ${fid}`);
    const url = `/api/farcaster/by-address?fid=${encodeURIComponent(String(fid))}&debug=1`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.debug) console.log('[FC] by-fid debug:', json.debug);
      const { user } = json;
      if (user) {
        farcasterUserByFidCache[key] = user;
        return user;
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster user by FID:', error);
    return null;
  }
}

// Mock function to simulate Farcaster user data for demo purposes
export function getMockFarcasterUser(address: string): FarcasterUser | null {
  // This is just for demo - in real app, remove this and use actual API
  const mockUsers: { [key: string]: FarcasterUser } = {
    // Add some mock data for testing
    '0x1234567890123456789012345678901234567890': {
      fid: 12345,
      username: 'musiccreator',
      displayName: 'Music Creator',
      pfpUrl: 'https://i.imgur.com/placeholder.jpg',
      bio: 'Creating amazing music on-chain',
      followerCount: 1250,
      followingCount: 340,
      verifiedAddresses: [address.toLowerCase()]
    }
  };
  
  return mockUsers[address.toLowerCase()] || null;
} 

// Opens the Farcaster cast composer with prefilled text and optional URL
export async function shareOnFarcasterCast(params: { text: string; url?: string }) {
  const { text, url } = params;
  const message = url ? `${text}\n\n${url}` : text;
  try {
    // Use native composer if available in the Mini App client
    // Some clients support embeds; appending URL to text is sufficient for most
    // Keep call minimal to maximize compatibility across client versions
    await sdk.actions.composeCast({ text: message } as any);
  } catch (err) {
    // Fallback to Warpcast web composer
    try {
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
      if (typeof window !== 'undefined') {
        window.open(composeUrl, '_blank');
      }
    } catch (_) {
      // no-op
    }
  }
}