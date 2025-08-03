import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDarkMode } = useTheme();
  
  return (
    <div className="flex space-x-8 mb-8 justify-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-2 px-1 text-sm md:text-lg font-medium transition-colors duration-200 relative ${
            activeTab === tab.id
              ? isDarkMode 
                ? 'text-white border-b-2 border-white' 
                : 'text-[#0000FE] border-b-2 border-[#0000FE]'
              : isDarkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-blue-800 hover:text-gray-800'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
              isDarkMode ? 'bg-white' : 'bg-[#0000FE]'
            }`} />
          )}
        </button>
      ))}
    </div>
  );
} 