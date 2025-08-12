import { ImageResponse } from 'next/og';
// Fetch via lightweight API to avoid bundling viem into Edge

export const runtime = 'edge';
export const revalidate = 0;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TokenTwitterImage({
  params,
}: {
  params: { tokenId: string };
}) {
  let title = 'Unknown Song';
  let imageUrl: string | undefined;

  const toGateway = (uri?: string) => {
    if (!uri) return undefined;
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return uri;
  };
  try {
    const base = process.env.NEXT_PUBLIC_URL || 'https://shine-warpcast.vercel.app';
    const res = await fetch(`${base}/api/song/${params.tokenId}/metadata`, { cache: 'no-store' });
    if (res.ok) {
      const metadata = await res.json();
      title = metadata.title || title;
      const candidate = toGateway(metadata.metadataURI);
      if (candidate) {
        if (/\.(png|jpg|jpeg|gif|webp)$/i.test(candidate)) {
          imageUrl = candidate;
        } else {
          try {
            const res2 = await fetch(candidate, { cache: 'no-store' });
            if (res2.ok) {
              const json = await res2.json();
              imageUrl = toGateway(json.image || json.imageURI);
            }
          } catch {}
        }
      }
    }
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
          padding: '60px',
          gap: 32,
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            width={420}
            height={420}
            style={{ width: 420, height: 420, borderRadius: 24, objectFit: 'cover' }}
          />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.25 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.85, marginTop: 10 }}>Token #{params.tokenId}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}


