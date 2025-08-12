import type { Metadata } from 'next';
import { getSongMetadata } from '@/app/utils/contract';

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: { tokenId: string };
}): Promise<Metadata> {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const tokenId = BigInt(params.tokenId);

  try {
    const data = await getSongMetadata(tokenId);
    const title = `${data.title} • ${siteName}`;
    const description = data.artistName
      ? `by ${data.artistName}`
      : `by ${data.artistAddress}`;

    // Ensure absolute URLs for Farcaster
    const base = process.env.NEXT_PUBLIC_URL || '';
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: `${base}/token/${params.tokenId}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: `${data.title} – ${description}`,
          },
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${base}/token/${params.tokenId}/twitter-image`],
      },
    };
  } catch {
    const title = `${siteName} • Token #${params.tokenId}`;
    const description = 'Onchain music';
    const base = process.env.NEXT_PUBLIC_URL || '';
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: `${base}/token/${params.tokenId}/opengraph-image`, width: 1200, height: 630 }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${base}/token/${params.tokenId}/twitter-image`],
      },
    };
  }
}

export default function TokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


