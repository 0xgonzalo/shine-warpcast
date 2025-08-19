import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export default async function TokenOgImage({
  params,
}: {
  params: { tokenId: string };
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%)',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 24 }}>🎵</div>
        <div style={{ fontSize: 64, fontWeight: 'bold', marginBottom: 16 }}>
          Shine
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Token #{params.tokenId}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}


