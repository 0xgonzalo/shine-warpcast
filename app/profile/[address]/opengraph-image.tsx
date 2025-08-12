import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 0;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ProfileOgImage({
  params,
}: {
  params: { address: string };
}) {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const address = params.address as string;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

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
            'radial-gradient(1200px 630px at 0% 0%, #22d3ee 0%, transparent 60%), radial-gradient(1200px 630px at 100% 100%, #60a5fa 0%, #0b1020 60%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85 }}>{siteName} Profile</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 8, letterSpacing: -1.5 }}>
          {short}
        </div>
        <div style={{ fontSize: 28, marginTop: 18, opacity: 0.9 }}>Created · Collected · Onchain</div>
      </div>
    ),
    { ...size }
  );
}


