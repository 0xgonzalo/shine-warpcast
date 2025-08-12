import { ImageResponse } from 'next/og';
import { getSongMetadata } from '@/app/utils/contract';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TokenOgImage({
  params,
}: {
  params: { tokenId: string };
}) {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const tokenId = BigInt(params.tokenId);

  let title = 'Unknown Song';
  let subtitle = '';
  try {
    const metadata = await getSongMetadata(tokenId);
    title = metadata.title || title;
    subtitle = metadata.artistName || metadata.artistAddress || '';
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px',
          background:
            'radial-gradient(1200px 630px at 0% 0%, #22d3ee 0%, transparent 60%), radial-gradient(1200px 630px at 100% 100%, #8b5cf6 0%, #0b1020 60%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85 }}>{siteName}</div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 8, letterSpacing: -1.5 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 36, marginTop: 8, opacity: 0.9 }}>by {subtitle}</div>
        )}
        <div style={{ fontSize: 24, marginTop: 28, opacity: 0.8 }}>Token #{params.tokenId}</div>
      </div>
    ),
    { ...size }
  );
}


