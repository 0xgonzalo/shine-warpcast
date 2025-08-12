import { NextResponse } from 'next/server';
import { getSongMetadata } from '@/app/utils/contract';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);
    const data = await getSongMetadata(id);
    return NextResponse.json({
      title: data.title,
      artistName: data.artistName,
      artistAddress: data.artistAddress,
      mediaURI: data.mediaURI,
      metadataURI: data.metadataURI,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load metadata' }, { status: 500 });
  }
}


