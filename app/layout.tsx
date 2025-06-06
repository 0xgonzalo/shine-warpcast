import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/providers';
import Navbar from './components/Navbar';
import FooterNav from './components/FooterNav';
import { MiniKitProviderWrapper } from './components/MiniKitProviderWrapper';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { FarcasterProvider } from './context/FarcasterContext';

export const generateMetadata = (): Metadata => {
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:  "Shine, the simplest way to create music onchain",
    icons: {
      icon: '/favicon.ico',
    },
    other: {
      "fc:frame": JSON.stringify({
        version: process.env.NEXT_PUBLIC_VERSION,
        imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: process.env.NEXT_PUBLIC_URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
            splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR}`,
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
      <body className="bg-background">
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
