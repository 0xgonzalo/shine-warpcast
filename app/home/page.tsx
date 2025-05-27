'use client';

import { useEffect, useState } from 'react';
import HomeTabs from '../components/home/HomeTabs';
import FeedContent from '../components/home/FeedContent';
import SongsContent from '../components/home/SongsContent';
import PlaylistContent from '../components/home/PlaylistContent';
import ArtistsContent from '../components/home/ArtistsContent';

// Import Farcaster Frame SDK
let sdk: any = null;
if (typeof window !== 'undefined') {
  import('@farcaster/frame-sdk').then((module) => {
    sdk = module.sdk;
  });
}

export default function HomePage() {
  const [mobileColumns, setMobileColumns] = useState(1);
  const [activeTab, setActiveTab] = useState('feed');
  const [isFrameReady, setIsFrameReady] = useState(false);
 
  useEffect(() => {
    const initializeFrame = async () => {
      if (typeof window === 'undefined' || !sdk) return;

      try {
        // Call ready when the interface is loaded
        await sdk.actions.ready();
        setIsFrameReady(true);
        console.log('🎯 Farcaster Frame is ready');
      } catch (error) {
        console.log('📱 Not in Farcaster context or ready failed:', error);
        setIsFrameReady(true); // Still allow the app to work outside Farcaster
      }
    };

    // Wait a bit for SDK to load
    const timer = setTimeout(initializeFrame, 100);
    return () => clearTimeout(timer);
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

  // Don't render until frame is ready to avoid jarring loading effects
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
