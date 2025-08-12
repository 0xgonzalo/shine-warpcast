import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/providers';
import Navbar from './components/Navbar';
import FooterNav from './components/FooterNav';
import { MiniKitProviderWrapper } from './components/MiniKitProviderWrapper';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { FarcasterProvider } from './context/FarcasterContext';
import { ThemeProvider } from './context/ThemeContext';

export const generateMetadata = (): Metadata => {
  const siteName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Shine';
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const description = 'Shine, the simplest way to create music onchain';

  return {
    metadataBase: new URL(baseUrl),
    title: siteName,
    description,
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      title: siteName,
      description,
      url: baseUrl,
      siteName,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: `${siteName} – ${description}`,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: ['/twitter-image'],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: process.env.NEXT_PUBLIC_VERSION || 'vNext',
        imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL || `${baseUrl}/opengraph-image`,
        button: {
          title: `Launch ${siteName}`,
          action: {
            type: 'launch_frame',
            name: siteName,
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL || `${baseUrl}/splash.png`,
            splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '000000'}`,
          },
        },
      }),
    },
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className="bg-background">
        <Providers>
          <ThemeProvider>
            <FarcasterProvider>
              <MiniKitProviderWrapper>
                <Navbar />
                <main className="pb-16">
                  {children}
                </main>
                <FooterNav />
                <GlobalAudioPlayer />
              </MiniKitProviderWrapper>
            </FarcasterProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
