import { NextRequest, NextResponse } from 'next/server';

// Use server-side env variables (without NEXT_PUBLIC prefix for API routes)
const PINATA_API_KEY = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY as string;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || process.env.NEXT_PUBLIC_PINATA_SECRET_KEY as string;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
const PINATA_GATEWAY_TOKEN = process.env.PINATA_GATEWAY_TOKEN || process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN;

// Helper to get IPFS gateway URL
function getIPFSGatewayURL(ipfsURI: string): string {
  if (!ipfsURI.startsWith('ipfs://')) {
    return ipfsURI;
  }
  const hash = ipfsURI.replace('ipfs://', '');
  return `https://${PINATA_GATEWAY}/ipfs/${hash}`;
}

// Public IPFS gateways to use as fallback
const PUBLIC_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
];

// Helper to fetch from IPFS with authentication and fallback
async function fetchFromIPFS(hash: string) {
  // First try private gateway with token
  if (PINATA_GATEWAY_TOKEN) {
    try {
      const url = `https://${PINATA_GATEWAY}/ipfs/${hash}?pinataGatewayToken=${PINATA_GATEWAY_TOKEN}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      // Continue to public gateways
    }
  }

  // Fallback to public gateways
  for (const gateway of PUBLIC_GATEWAYS) {
    try {
      const url = `${gateway}/${hash}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      // Try next gateway
      continue;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageURI = searchParams.get('imageURI');

    if (!imageURI) {
      return NextResponse.json(
        { error: 'imageURI parameter is required' },
        { status: 400 }
      );
    }

    // Query Pinata for ALL JSON files (paginate through all results)
    let allRows: any[] = [];
    let hasMore = true;
    let pageOffset = 0;
    const pageLimit = 1000; // Max items per page

    while (hasMore) {
      const response = await fetch(
        `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=${pageLimit}&pageOffset=${pageOffset}`,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: 'Failed to query Pinata', details: errorText },
          { status: 500 }
        );
      }

      const data = await response.json();
      allRows = allRows.concat(data.rows || []);

      // Check if there are more results
      hasMore = data.rows && data.rows.length === pageLimit;
      pageOffset += pageLimit;
    }

    // Search through pinned files to find metadata JSON containing this imageURI
    if (allRows && Array.isArray(allRows)) {
      for (const file of allRows) {
        // Only check JSON files (mime_type application/json)
        if (file.mime_type === 'application/json') {
          try {
            const metadataResponse = await fetchFromIPFS(file.ipfs_pin_hash);

            if (metadataResponse) {
              const metadata = await metadataResponse.json();

              // Normalize URIs for comparison (handle both ipfs:// and plain hash formats)
              const normalizeURI = (uri: string) => {
                if (!uri) return '';
                // Remove ipfs:// prefix if present, convert to lowercase for comparison
                return uri.replace(/^ipfs:\/\//i, '').toLowerCase().trim();
              };

              const searchURINormalized = normalizeURI(imageURI);
              const metadataURINormalized = normalizeURI(metadata.imageURI || '');

              // Check if this metadata contains the imageURI we're looking for
              if (searchURINormalized === metadataURINormalized) {
                return NextResponse.json({
                  description: metadata.description || null,
                  metadataURI: `ipfs://${file.ipfs_pin_hash}`,
                  metadata: metadata,
                });
              }
            }
          } catch (error) {
            // Skip files that fail to parse
            continue;
          }
        }
      }
    }

    return NextResponse.json(
      { description: null, message: 'No metadata found for this imageURI' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
