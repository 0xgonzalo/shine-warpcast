import type { Metadata } from 'next';
import TokenPageClient from './TokenPageClient';
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
  const title = `${data.title} • ${SITE_NAME}`;
  const description = data.artistName
    ? `by ${data.artistName}`
    : `by ${data.artistAddress}`;
  const imageUrl = `${APP_URL}/token/${params.tokenId}/opengraph-image`;

  const frame = {
    version: 'next',
    imageUrl: imageUrl,
    aspectRatio: '3:2',
    button: {
      title: 'Collect',
      action: {
        type: 'launch_frame',
        name: SITE_NAME,
        url: `${APP_URL}/token/${params.tokenId}`,
        iconImageUrl: imageUrl,
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: '#000000',
      },
    },
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
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
      images: [imageUrl],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function TokenPage() {
  return <TokenPageClient />;
} 