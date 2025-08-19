import { NextResponse } from 'next/server';
import { getSongMetadata } from '@/app/utils/contract';
import { getIPFSGatewayURL } from '@/app/utils/pinata';

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
    const metadataUrl = getIPFSGatewayURL(songMetadata.metadataURI);

    if (metadataUrl) {
      try {
        const response = await fetch(metadataUrl, { cache: 'no-store' });
        if (response.ok) {
          const json = await response.json();
          if (json.image || json.imageURI) {
            imageUrl = getIPFSGatewayURL(json.image || json.imageURI);
          }
        }
      } catch (e) {
        console.error('Failed to fetch or parse metadata JSON:', e);
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
