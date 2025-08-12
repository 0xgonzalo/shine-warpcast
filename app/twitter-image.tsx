import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0b1020 0%, #1e293b 40%, #0ea5e9 100%)',
          color: 'white',
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: -1.25,
        }}
      >
        {siteName}
      </div>
    ),
    { ...size }
  );
}


