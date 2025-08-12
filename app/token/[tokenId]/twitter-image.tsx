import { ImageResponse } from 'next/og';
import { getSongMetadata } from '@/app/utils/contract';

export const runtime = 'edge';
export const revalidate = 0;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TokenTwitterImage({
  params,
}: {
  params: { tokenId: string };
}) {
  const tokenId = BigInt(params.tokenId);
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
    const metadata = await getSongMetadata(tokenId);
    title = metadata.title || title;
    const candidate = toGateway(metadata.metadataURI);
    if (candidate) {
      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(candidate)) {
        imageUrl = candidate;
      } else {
        try {
          const res = await fetch(candidate, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            imageUrl = toGateway(json.image || json.imageURI);
          }
        } catch {}
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


