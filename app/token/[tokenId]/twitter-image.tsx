import { ImageResponse } from 'next/og';
import { getSongMetadata } from '@/app/utils/contract';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TokenTwitterImage({
  params,
}: {
  params: { tokenId: string };
}) {
  const tokenId = BigInt(params.tokenId);
  let title = 'Unknown Song';
  try {
    const metadata = await getSongMetadata(tokenId);
    title = metadata.title || title;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1020 0%, #1e293b 40%, #22d3ee 100%)',
          color: 'white',
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: -1.25,
          padding: '60px',
          textAlign: 'center',
        }}
      >
        {title} · Token #{params.tokenId}
      </div>
    ),
    { ...size }
  );
}


