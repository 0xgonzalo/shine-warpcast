import '@coinbase/onchainkit/styles.css';
import './globals.css';
import { Providers } from '@/providers/providers';
import Navbar from './components/Navbar';
import FooterNav from './components/FooterNav';
import { MiniKitProviderWrapper } from './components/MiniKitProviderWrapper';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { FarcasterProvider } from './context/FarcasterContext';
import { ThemeProvider } from './context/ThemeContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
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
