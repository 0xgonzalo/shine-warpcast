import { NextResponse } from 'next/server';
import { getSongMetadata } from '@/app/utils/contract';
import { getIPFSGatewayURL, getAllIPFSGatewayURLs } from '@/app/utils/pinata';

export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
  }

  try {
    const songMetadata = await getSongMetadata(BigInt(id));

    if (!songMetadata || !songMetadata.metadataURI) {
      return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
    }

    let imageUrl = null;
    const metadataUrls = getAllIPFSGatewayURLs(songMetadata.metadataURI);

    // Try multiple IPFS gateways with timeout
    for (const metadataUrl of metadataUrls) {
      try {
        console.log('Fetching metadata from:', metadataUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(metadataUrl, { 
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('Metadata response status:', response.status);
        
        if (response.ok) {
          const json = await response.json();
          console.log('Metadata JSON:', JSON.stringify(json, null, 2));
          
          // Try multiple possible image field names
          const imageUri = json.image || json.imageURI || json.artwork || json.cover;
          console.log('Found image URI:', imageUri);
          
          if (imageUri) {
            imageUrl = getIPFSGatewayURL(imageUri);
            console.log('Final image URL:', imageUrl);
            break; // Success, exit the loop
          }
        }
      } catch (e) {
        console.error('Failed to fetch metadata from', metadataUrl, ':', e);
        // Continue to next gateway
      }
    }

    const responseData = {
      ...songMetadata,
      price: songMetadata.price.toString(),
      timesBought: songMetadata.timesBought.toString(),
      maxSupplySpecialEdition: songMetadata.maxSupplySpecialEdition.toString(),
      imageUrl,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(`Error fetching metadata for token ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
