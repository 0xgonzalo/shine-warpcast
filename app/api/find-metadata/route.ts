import { NextRequest, NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY as string;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY as string;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';

// Helper to get IPFS gateway URL
function getIPFSGatewayURL(ipfsURI: string): string {
  if (!ipfsURI.startsWith('ipfs://')) {
    return ipfsURI;
  }
  const hash = ipfsURI.replace('ipfs://', '');
  return `https://${PINATA_GATEWAY}/ipfs/${hash}`;
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

    console.log('🔍 [API] Searching for metadata containing imageURI:', imageURI);

    // Query Pinata for JSON files
    const response = await fetch(
      'https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={}',
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('❌ [API] Pinata API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to query Pinata' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log(`📋 [API] Found ${data.rows?.length || 0} pinned files`);

    // Search through pinned files to find metadata JSON containing this imageURI
    if (data.rows && Array.isArray(data.rows)) {
      for (const file of data.rows) {
        // Only check JSON files (mime_type application/json)
        if (file.mime_type === 'application/json') {
          try {
            // Fetch the JSON content
            const metadataUrl = `https://${PINATA_GATEWAY}/ipfs/${file.ipfs_pin_hash}`;
            const metadataResponse = await fetch(metadataUrl);

            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();

              // Check if this metadata contains the imageURI we're looking for
              if (metadata.imageURI === imageURI) {
                console.log('✅ [API] Found matching metadata:', metadata);
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

    console.log('⚠️ [API] No matching metadata found');
    return NextResponse.json(
      { description: null, message: 'No metadata found for this imageURI' },
      { status: 404 }
    );
  } catch (error) {
    console.error('❌ [API] Error finding metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
