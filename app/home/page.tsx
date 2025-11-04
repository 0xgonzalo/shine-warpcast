'use client';

import { useEffect, useState } from 'react';
import HomeTabs from '../components/home/HomeTabs';
import FeedContent from '../components/home/FeedContent';
import SongsContent from '../components/home/SongsContent';
import PlaylistContent from '../components/home/PlaylistContent';
import ArtistsContent from '../components/home/ArtistsContent';
import { sdk } from '@farcaster/miniapp-sdk';

export default function HomePage() {
  const [mobileColumns, setMobileColumns] = useState(1);
  const [activeTab, setActiveTab] = useState('feed');
  const [isFrameReady, setIsFrameReady] = useState(false);
 
  useEffect(() => {
    const initializeFrame = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Call ready() to signal the app is ready to display
        await sdk.actions.ready();
        console.log('🎯 Farcaster Mini App is ready');
        setIsFrameReady(true);

        // Auto-prompt Add Mini App on load when in Mini App (configurable)
        const shouldAutoPrompt = (process.env.NEXT_PUBLIC_AUTO_PROMPT_ADD_MINIAPP ?? 'true') !== 'false';
        if (shouldAutoPrompt) {
          try {
            // Tiny delay so UI is visible behind the bottom sheet
            setTimeout(async () => {
              try {
                await sdk.actions.addMiniApp();
              } catch (e) {
                // Swallow errors; user may reject or domain may mismatch during dev
                console.log('addMiniApp auto-prompt result:', e);
              }
            }, 250);
          } catch (e) {
            // Not in mini app or detection failed; ignore
          }
        }
      } catch (error) {
        console.log('📱 Not in Farcaster context or ready failed:', error);
        // App continues to work normally, set ready anyway
        setIsFrameReady(true);
      }
    };

    initializeFrame();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedContent mobileColumns={mobileColumns} setMobileColumns={setMobileColumns} />;
      case 'songs':
        return <SongsContent />;
      case 'playlist':
        return <PlaylistContent />;
      case 'artists':
        return <ArtistsContent />;
      default:
        return <FeedContent mobileColumns={mobileColumns} setMobileColumns={setMobileColumns} />;
    }
  };

  // Show loading only for a very brief moment
  if (!isFrameReady) {
    return (
      <main className="min-h-screen p-8 pb-32 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </main>
  );
}
