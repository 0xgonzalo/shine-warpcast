import type { Metadata } from 'next';
import { getSongMetadata } from '@/app/utils/contract';

const APP_URL = process.env.NEXT_PUBLIC_URL || '';
const SITE_NAME = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';

export async function generateMetadata({
  params,
}: {
  params: { tokenId: string };
}): Promise<Metadata> {
  const tokenId = BigInt(params.tokenId);
  const data = await getSongMetadata(tokenId);
  
  const title = data ? `${data.title} • ${SITE_NAME}` : `${SITE_NAME} • Token #${params.tokenId}`;
  const description = data?.artistName ? `by ${data.artistName}` : 'Onchain music';
  const imageUrl = `${APP_URL}/token/${params.tokenId}/opengraph-image`;

  const frame = {
    version: 'next',
    name: SITE_NAME,
    imageUrl,
    postUrl: `${APP_URL}/api/frame`,
    buttons: [
      {
        label: 'View on OpenSea',
        action: 'link',
        target: `https://opensea.io/assets/base/${process.env.NEXT_PUBLIC_SONG_DATABASE_CONTRACT_ADDRESS}/${params.tokenId}`,
      },
    ],
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function TokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
