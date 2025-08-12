import { ImageResponse } from 'next/og';
// Fetch via lightweight API to avoid bundling viem into Edge

export const runtime = 'edge';
export const revalidate = 0;
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
      subtitle = metadata.artistName || metadata.artistAddress || '';
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
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px',
          background:
            'radial-gradient(1200px 630px at 0% 0%, #22d3ee 0%, transparent 60%), radial-gradient(1200px 630px at 100% 100%, #8b5cf6 0%, #0b1020 60%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              width={420}
              height={420}
              style={{
                width: 420,
                height: 420,
                borderRadius: 24,
                objectFit: 'cover',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
              }}
            />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, opacity: 0.85 }}>{siteName}</div>
            <div style={{ fontSize: 72, fontWeight: 800, marginTop: 8, letterSpacing: -1.5 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 36, marginTop: 8, opacity: 0.9 }}>by {subtitle}</div>
            )}
            <div style={{ fontSize: 24, marginTop: 28, opacity: 0.8 }}>Token #{params.tokenId}</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}


