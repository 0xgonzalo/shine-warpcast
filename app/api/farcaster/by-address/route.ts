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
    const fidParam = searchParams.get('fid');
    const debugEnabled = searchParams.get('debug') === '1';
    const debug: Array<string> = [];
    if (!address && !fidParam) {
      return NextResponse.json({ error: 'Missing address or fid' }, { status: 400 });
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
      headers['api_key'] = apiKey;
    }
    if (debugEnabled) debug.push(`apiKeyPresent=${Boolean(apiKey)}`);

    // Try Neynar custody and verification lookups first, then plain by-address (if API key exists)
    let user: NeynarUser | null = null;
    // If caller already provided fid, use the free Neynar endpoint directly
    if (apiKey && fidParam) {
      try {
        const byFid = `https://api.neynar.com/v2/farcaster/user?fid=${encodeURIComponent(fidParam)}`;
        const rf = await fetch(byFid, { headers, cache: 'no-store' });
        if (debugEnabled) debug.push(`neynar/user?fid status=${rf.status}`);
        if (rf.ok) {
          const jf: any = await rf.json();
          user = jf?.user || null;
        } else if (debugEnabled) {
          try { debug.push(`neynar/user?fid body=${(await rf.text()).slice(0,120)}`); } catch {}
        }
      } catch (_) {}
    }

    // Fallback for fid without Neynar key: fetch from public hubs directly
    if (!user && fidParam) {
      const HUBS = [
        'https://hub.pinata.cloud',
        'https://hub.farcaster.xyz',
        'https://hub.frc.dev',
      ];
      for (const host of HUBS) {
        try {
          const url = `${host}/v1/userDataByFid?fid=${encodeURIComponent(String(fidParam))}`;
          const r = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
          if (debugEnabled) debug.push(`hubble(${host})/userDataByFid(fid) status=${r.status}`);
          if (!r.ok) continue;
          const uj: any = await r.json();
          const messages: any[] = uj?.messages || [];
          let username: string | undefined;
          let displayName: string | undefined;
          let pfpUrl: string | undefined;
          let bio: string | undefined;
          for (const m of messages) {
            const type = m?.data?.userDataBody?.type;
            const value = m?.data?.userDataBody?.value;
            if (!type || typeof value !== 'string') continue;
            if (type === 5 && !username) username = value;
            if (type === 2 && !displayName) displayName = value;
            if (type === 1 && !pfpUrl) pfpUrl = value;
            if (type === 3 && !bio) bio = value;
          }
          const fallbackUser = {
            fid: Number(fidParam),
            username,
            display_name: displayName,
            pfp_url: pfpUrl,
            profile: { bio: { text: bio } },
          } as NeynarUser as any;
          const normalized = normalizeUser(fallbackUser as NeynarUser);
          if (normalized) {
            return NextResponse.json({ user: normalized, ...(debugEnabled ? { debug } : {}) }, { status: 200 });
          }
        } catch (_) {
          // try next hub
        }
      }
    }
    if (!user && apiKey && address) {
      try {
        const byCustody = `https://api.neynar.com/v2/farcaster/user/by-custody-address?address=${encodeURIComponent(address)}`;
        const rc = await fetch(byCustody, { headers, cache: 'no-store' });
        if (debugEnabled) debug.push(`neynar/by-custody-address status=${rc.status}`);
        if (rc.ok) {
          const jc: any = await rc.json();
          user = jc?.user || null;
        } else if (debugEnabled) {
          try { debug.push(`neynar/by-custody-address body=${(await rc.text()).slice(0,120)}`); } catch {}
        }
      } catch (_) {}
      if (!user) {
        try {
        const byVerification = `https://api.neynar.com/v2/farcaster/user/by-verification?address=${encodeURIComponent(address)}&address_type=eth`;
          const r = await fetch(byVerification, { headers, cache: 'no-store' });
          if (debugEnabled) debug.push(`neynar/by-verification status=${r.status}`);
          if (r.ok) {
            const j: any = await r.json();
            user = j?.user || null;
          } else if (debugEnabled) {
            try { debug.push(`neynar/by-verification body=${(await r.text()).slice(0,120)}`); } catch {}
          }
        } catch (_) {}
      }
      if (!user) {
        try {
          const byAddress = `https://api.neynar.com/v2/farcaster/user/by-address?address=${encodeURIComponent(address)}&address_type=eth`;
          const r2 = await fetch(byAddress, { headers, cache: 'no-store' });
          if (debugEnabled) debug.push(`neynar/by-address status=${r2.status}`);
          if (r2.ok) {
            const j2: any = await r2.json();
            user = j2?.user || null;
          } else if (debugEnabled) {
            try { debug.push(`neynar/by-address body=${(await r2.text()).slice(0,120)}`); } catch {}
          }
        } catch (_) {}
      }
    }

    // If Neynar did not return a user, try resolving via public Hubble fallbacks
    if (!user) {
      try {
        const HUBS = [
          'https://hub.pinata.cloud',
          'https://hub.farcaster.xyz',
          'https://hub.frc.dev',
        ];

        let resolvedFid: number | null = null;
        let resolvedHost: string | null = null;

        // 1) Try verificationsByAddress on multiple hubs (maps verified wallets -> fid)
        for (const host of HUBS) {
          try {
            const verifyUrl = `${host}/v1/verificationsByAddress?address=${encodeURIComponent(address)}&pageSize=10`;
            const vr = await fetch(verifyUrl, { headers: { accept: 'application/json' }, cache: 'no-store' });
            if (debugEnabled) debug.push(`hubble(${host})/verificationsByAddress status=${vr.status}`);
            if (!vr.ok) continue;
            const vj: any = await vr.json();
            const verifications: any[] = vj?.verifications || vj?.messages || [];
            const first = Array.isArray(verifications) && verifications.length > 0 ? verifications[0] : null;
            const fidCandidate: number | null = first?.fid ?? null;
            if (fidCandidate != null) {
              resolvedFid = fidCandidate;
              resolvedHost = host;
              break;
            }
          } catch (_) {
            // continue
          }
        }

        // 2) If still not found, try onChainIdRegistryEventByAddress (maps custody address -> fid)
        if (resolvedFid == null) {
          for (const host of HUBS) {
            try {
              const url = `${host}/v1/onChainIdRegistryEventByAddress?address=${encodeURIComponent(address)}`;
              const r = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
              if (debugEnabled) debug.push(`hubble(${host})/onChainIdRegistryEventByAddress status=${r.status}`);
              if (!r.ok) continue;
              const j: any = await r.json();
              const fidCandidate: number | null = j?.event?.fid ?? null;
              if (fidCandidate != null) {
                resolvedFid = fidCandidate;
                resolvedHost = host;
                break;
              }
            } catch (_) {
              // continue
            }
          }
        }

        if (resolvedFid != null && resolvedHost) {
          // Prefer Neynar free endpoint by fid if key available
          if (apiKey) {
            try {
              const byFid = `https://api.neynar.com/v2/farcaster/user?fid=${encodeURIComponent(String(resolvedFid))}`;
              const rf = await fetch(byFid, { headers, cache: 'no-store' });
              if (debugEnabled) debug.push(`neynar/user?fid status=${rf.status}`);
              if (rf.ok) {
                const jf: any = await rf.json();
                const neynarUser = jf?.user || null;
                const normalized = normalizeUser(neynarUser);
                if (normalized) {
                  return NextResponse.json({ user: normalized, ...(debugEnabled ? { debug } : {}) }, { status: 200 });
                }
              } else if (debugEnabled) {
                try { debug.push(`neynar/user?fid body=${(await rf.text()).slice(0,120)}`); } catch {}
              }
            } catch (_) {}
          }

          // 3) Fetch user data by fid from the same host
          const userDataUrl = `${resolvedHost}/v1/userDataByFid?fid=${encodeURIComponent(String(resolvedFid))}`;
          const ur = await fetch(userDataUrl, { headers: { accept: 'application/json' }, cache: 'no-store' });
          if (debugEnabled) debug.push(`hubble(${resolvedHost})/userDataByFid status=${ur.status}`);
          if (ur.ok) {
            const uj: any = await ur.json();
            const messages: any[] = uj?.messages || [];

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
              fid: resolvedFid,
              username,
              display_name: displayName,
              pfp_url: pfpUrl,
              profile: { bio: { text: bio } },
              follower_count: undefined,
              following_count: undefined,
              verified_addresses: { eth_addresses: [address] },
            } as NeynarUser as any;

            const normalizedFallback = normalizeUser(fallbackUser as NeynarUser);
            return NextResponse.json({ user: normalizedFallback, ...(debugEnabled ? { debug } : {}) }, { status: 200 });
          }
        }
      } catch (_) {
        // ignore and continue to return null below
      }
    }

    const normalized = normalizeUser(user);
    return NextResponse.json({ user: normalized, ...(debugEnabled ? { debug } : {}) }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


