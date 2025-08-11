// Farcaster API utilities
'use client';
export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  verifiedAddresses?: string[];
}

// Note: This is a simplified implementation. In a real app, you'd want to use
// a proper Farcaster API service like Neynar, Airstack, or similar
const farcasterUserCache: Record<string, FarcasterUser | null> = {};

export async function getFarcasterUserByAddress(address: string): Promise<FarcasterUser | null> {
  try {
    const lower = address.toLowerCase();
    if (lower in farcasterUserCache) return farcasterUserCache[lower];

    console.log(`🔍 Looking up Farcaster user for address: ${address}`);

    // Try Neynar bulk-by-address endpoint
    const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lower}&address_types=eth`;
    const res = await fetch(url, {
      headers: apiKey ? { 'accept': 'application/json', 'x-api-key': apiKey } : { 'accept': 'application/json' }
    });

    if (res.ok) {
      const json = await res.json();
      // Shape: { users_by_address: { [address]: [ { fid, username, pfp_url, display_name, profile: { bio: { text } }, verified_addresses: { eth_addresses: [] } } ] } }
      const usersByAddr = (json as any)?.users_by_address || {};
      const first = Array.isArray(usersByAddr[lower]) ? usersByAddr[lower][0] : null;
      if (first) {
        const user: FarcasterUser = {
          fid: first.fid,
          username: first.username,
          displayName: first.display_name,
          pfpUrl: first.pfp_url || first.pfp?.url,
          bio: first?.profile?.bio?.text,
          followerCount: first?.follower_count,
          followingCount: first?.following_count,
          verifiedAddresses: (first?.verified_addresses?.eth_addresses || []).map((a: string) => a.toLowerCase()),
        };
        farcasterUserCache[lower] = user;
        return user;
      }
    } else {
      console.warn('Neynar by address response not OK:', res.status);
    }

    farcasterUserCache[lower] = null;
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    farcasterUserCache[address.toLowerCase()] = null;
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
    const { sdk } = await import('@farcaster/miniapp-sdk');
    // Prefer native composer if available in the Mini App client
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