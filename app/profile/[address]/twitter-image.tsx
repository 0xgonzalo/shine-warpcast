import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ProfileTwitterImage({
  params,
}: {
  params: { address: string };
}) {
  const address = params.address as string;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1020 0%, #1e293b 40%, #60a5fa 100%)',
          color: 'white',
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: -1.1,
          padding: '60px',
          textAlign: 'center',
        }}
      >
        {short} on Shine
      </div>
    ),
    { ...size }
  );
}


