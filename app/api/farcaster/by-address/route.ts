import { NextRequest, NextResponse } from 'next/server';

// Ensure the route is always dynamic and not statically cached by the platform
export const dynamic = 'force-dynamic';

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
    if (apiKey) {
      headers['x-api-key'] = apiKey;
      headers['api_key'] = apiKey;
    }

    // SIMPLIFIED: Try Neynar by-verification first, then by-address (if API key exists)
    let user: NeynarUser | null = null;
    if (apiKey) {
      try {
        const byVerification = `https://api.neynar.com/v2/farcaster/user/by-verification?address=${encodeURIComponent(address)}&address_type=eth`;
        const r = await fetch(byVerification, { headers, cache: 'no-store' });
        if (r.ok) {
          const j: any = await r.json();
          user = j?.user || null;
        }
      } catch (_) {}
      if (!user) {
        try {
          const byAddress = `https://api.neynar.com/v2/farcaster/user/by-address?address=${encodeURIComponent(address)}&address_type=eth`;
          const r2 = await fetch(byAddress, { headers, cache: 'no-store' });
          if (r2.ok) {
            const j2: any = await r2.json();
            user = j2?.user || null;
          }
        } catch (_) {}
      }
    }

    // If Neynar did not return a user, try resolving via a public Hubble (Pinata) fallback
    if (!user) {
      try {
        // 1) Resolve FID(s) verified for this address
        const verifyUrl = `https://hub.pinata.cloud/v1/verificationsByAddress?address=${encodeURIComponent(
          address
        )}&pageSize=10`;
        const vr = await fetch(verifyUrl, { headers: { accept: 'application/json' }, cache: 'no-store' });
        if (vr.ok) {
          const vj: any = await vr.json();
          // Some hubs respond with { verifications: [...] }, others with { messages: [...] }
          const verifications: any[] = vj?.verifications || vj?.messages || [];
          const firstVerification = Array.isArray(verifications) && verifications.length > 0 ? verifications[0] : null;
          const fid: number | null = firstVerification?.fid ?? null;

          if (fid != null) {
            // 2) Fetch user data entries for that FID
            const userDataUrl = `https://hub.pinata.cloud/v1/userDataByFid?fid=${encodeURIComponent(String(fid))}`;
            const ur = await fetch(userDataUrl, { headers: { accept: 'application/json' }, cache: 'no-store' });
            if (ur.ok) {
              const uj: any = await ur.json();
              const messages: any[] = uj?.messages || [];

              // Farcaster UserDataType mapping (best-effort):
              // 1: PFP, 2: Display Name, 3: Bio, 5: Username
              let username: string | undefined;
              let displayName: string | undefined;
              let pfpUrl: string | undefined;
              let bio: string | undefined;

              for (const m of messages) {
                const type = m?.data?.userDataBody?.type;
                const value = m?.data?.userDataBody?.value;
                if (!type || typeof value !== 'string') continue;
                if (type === 5 && !username) username = value; // username
                if (type === 2 && !displayName) displayName = value; // display name
                if (type === 1 && !pfpUrl) pfpUrl = value; // pfp url
                if (type === 3 && !bio) bio = value; // bio
              }

              const fallbackUser = {
                fid,
                username,
                display_name: displayName,
                pfp_url: pfpUrl,
                profile: { bio: { text: bio } },
                follower_count: undefined,
                following_count: undefined,
                verified_addresses: { eth_addresses: [address] },
              } as NeynarUser as any;

              const normalizedFallback = normalizeUser(fallbackUser as NeynarUser);
              return NextResponse.json({ user: normalizedFallback }, { status: 200 });
            }
          }
        }
      } catch (_) {
        // ignore and continue to return null below
      }
    }

    const normalized = normalizeUser(user);
    return NextResponse.json({ user: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


