import { NextRequest, NextResponse } from 'next/server';

type NeynarUser = {
  fid: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  pfp?: { url?: string };
  profile?: { bio?: { text?: string } };
  follower_count?: number;
  following_count?: number;
  verified_addresses?: { eth_addresses?: string[] };
};

function normalizeUser(u: NeynarUser | undefined | null) {
  if (!u) return null;
  return {
    fid: u.fid,
    username: u.username,
    displayName: u.display_name,
    pfpUrl: u.pfp_url || u.pfp?.url,
    bio: u.profile?.bio?.text,
    followerCount: u.follower_count,
    followingCount: u.following_count,
    verifiedAddresses: (u.verified_addresses?.eth_addresses || []).map((a) => a.toLowerCase()),
  };
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.NEYNAR_API_KEY || process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get('address') || '').toLowerCase();
    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    // Attempt bulk-by-address first
    const bulkUrl = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(
      address
    )}&address_type=eth`;
    let user: NeynarUser | null = null;
    try {
      const r = await fetch(bulkUrl, { headers, cache: 'no-store' });
      if (r.ok) {
        const j: any = await r.json();
        const uba: any = j?.users_by_address;
        if (uba) {
          if (Array.isArray(uba[address])) user = uba[address][0];
          else if (uba.eth && Array.isArray(uba.eth[address])) user = uba.eth[address][0];
          else if (Array.isArray(uba)) {
            const match = uba.find((e: any) => (e?.address || '').toLowerCase() === address);
            user = match?.user || null;
          }
        }
      }
    } catch (_) {
      // ignore
    }

    // Fallback: single by-address endpoint
    if (!user) {
      const singleUrl = `https://api.neynar.com/v2/farcaster/user/by-address?address=${encodeURIComponent(
        address
      )}&address_type=eth`;
      try {
        const r2 = await fetch(singleUrl, { headers, cache: 'no-store' });
        if (r2.ok) {
          const j2: any = await r2.json();
          user = j2?.user || null;
        }
      } catch (_) {
        // ignore
      }
    }

    const normalized = normalizeUser(user);
    return NextResponse.json({ user: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


