import { useState } from 'react';

interface HomeTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'feed', label: 'Feed' },
  { id: 'songs', label: 'Songs' },
  { id: 'playlist', label: 'Playlist' },
  { id: 'artists', label: 'Artists' }
];

export default function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
  return (
    <div className="flex space-x-8 mb-8 justify-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-2 px-1 text-sm md:text-lg font-medium transition-colors duration-200 relative ${
            activeTab === tab.id
              ? 'text-white border-b-2 border-purple-400'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
} 