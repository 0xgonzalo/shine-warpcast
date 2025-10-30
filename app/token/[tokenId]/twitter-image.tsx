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
  let artistName = 'Unknown Artist';
  let imageUrl: string | undefined;

  // Helper to convert IPFS URIs to Pinata gateway URLs for better CDN performance
  const toGateway = (uri?: string) => {
    if (!uri) return undefined;
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    return uri;
  };

  try {
    const base = process.env.NEXT_PUBLIC_URL || 'https://shine-warpcast.vercel.app';
    const res = await fetch(`${base}/api/song/${params.tokenId}/metadata`, { cache: 'no-store' });
    if (res.ok) {
      const metadata = await res.json();
      title = metadata.title || title;
      artistName = metadata.artistName || artistName;

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
  } catch (error) {
    console.error('Error fetching metadata for Twitter image:', error);
  }

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
        ) : (
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎵</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.25 }}>{title}</div>
          <div style={{ fontSize: 32, opacity: 0.85 }}>{artistName}</div>
          <div style={{ fontSize: 24, opacity: 0.7, marginTop: 8 }}>Token #{params.tokenId}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}


