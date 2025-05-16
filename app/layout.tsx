import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Navbar from './components/Navbar';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { baseSepolia } from 'wagmi/chains';

export const generateMetadata = (): Metadata => {
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:  "Shine, the simplest way to create music onchain",
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
    <html lang="en">
      <MiniKitProvider projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID} chain={baseSepolia}>
        <body className="bg-background dark">
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </body>
      </MiniKitProvider>
    </html>
  );
}
