import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 0;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const tagline = 'Create music onchain';

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
          background:
            'radial-gradient(1200px 630px at 0% 0%, #0ea5e9 0%, transparent 60%), radial-gradient(1200px 630px at 100% 100%, #8b5cf6 0%, #0b1020 60%)',
          color: 'white',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.5,
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            opacity: 0.9,
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            opacity: 0.8,
          }}
        >
          Every star shines · collect · create · discover
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


