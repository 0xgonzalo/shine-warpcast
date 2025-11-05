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

type NeynarSearchResponse = {
  result?: {
    users: NeynarUser[];
    next?: {
      cursor?: string | null;
    };
  };
  users?: NeynarUser[];
  next?: {
    cursor?: string | null;
  };
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
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';

    if (!query.trim()) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
    }

    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-api-key': apiKey,
      api_key: apiKey,
    };

    // Search for users using Neynar API
    const searchUrl = `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`;
    const response = await fetch(searchUrl, { headers, cache: 'no-store' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar search error:', errorText);
      return NextResponse.json(
        { error: 'Failed to search users', details: errorText },
        { status: response.status }
      );
    }

    let data: NeynarSearchResponse;
    try {
      data = await response.json();
      console.log('Neynar search response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse Neynar response:', parseError);
      return NextResponse.json(
        { users: [], next: null },
        { status: 200 }
      );
    }

    // Handle both response formats (with and without 'result' wrapper)
    const usersArray = data.result?.users || data.users || [];
    const nextCursor = data.result?.next || data.next;

    const users = usersArray.map(normalizeUser).filter(Boolean);
    console.log('Normalized users:', JSON.stringify(users, null, 2));

    return NextResponse.json({ users, next: nextCursor }, { status: 200 });
  } catch (err: any) {
    console.error('Search API error:', err);
    // Return empty results instead of error to prevent UI crashes
    return NextResponse.json(
      { users: [], next: null },
      { status: 200 }
    );
  }
}
