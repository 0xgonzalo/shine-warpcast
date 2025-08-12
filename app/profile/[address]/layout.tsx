import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { address: string };
}): Promise<Metadata> {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const address = params.address as string;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const title = `${short} • ${siteName}`;
  const description = 'Created · Collected · Onchain';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        { url: `${process.env.NEXT_PUBLIC_URL || ''}/profile/${address}/opengraph-image`, width: 1200, height: 630, alt: `${short} on ${siteName}` },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${process.env.NEXT_PUBLIC_URL || ''}/profile/${address}/twitter-image`],
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


