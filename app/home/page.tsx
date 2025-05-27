'use client';

import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import HomeTabs from '../components/home/HomeTabs';
import FeedContent from '../components/home/FeedContent';
import SongsContent from '../components/home/SongsContent';
import PlaylistContent from '../components/home/PlaylistContent';
import ArtistsContent from '../components/home/ArtistsContent';

export default function HomePage() {
  const [mobileColumns, setMobileColumns] = useState(1);
  const [activeTab, setActiveTab] = useState('feed');
  const { setFrameReady, isFrameReady } = useMiniKit();
 
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

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

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </main>
  );
}
