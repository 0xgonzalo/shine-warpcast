'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getMostCollectedArtists } from '../utils/contract';
import { getIPFSGatewayURL } from '../utils/pinata';
import Link from 'next/link';

interface LeaderboardEntry {
  address: string;
  totalCollections: number;
  username?: string;
  exampleToken?: {
    tokenId: bigint;
    name: string;
    imageURI: string;
  };
}

export default function LeaderboardPage() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-[#0000FE]'} pb-20`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-opacity-80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={isDarkMode ? '/trophy.svg' : '/trophy-blue.svg'} 
              alt="Trophy" 
              className="w-8 h-8 mr-3" 
            />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
          </div>
          <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-blue-800'} max-w-2xl mx-auto`}>
            Top users on Shine ranked by total points
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={`rounded-lg border ${
          isDarkMode ? 'border-gray-600 bg-gray-900/50' : 'border-[#0000FE] bg-gray-50'
        } p-6 text-center mb-8`}>
          <div className="text-2xl mb-2">✨</div>
          <h2 className="text-xl font-semibold mb-2">Points System Coming Soon!</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-blue-800'} text-sm leading-relaxed`}>
            We're building an exciting points and rewards system for the Shine platform. Soon you'll be able to:
          </p>
          <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-blue-800'} space-y-1`}>
            <div>🎵 Earn points for creating and sharing music</div>
            <div>💎 Get rewards for collecting tracks from other artists</div>
            <div>🔥 Unlock exclusive features and badges</div>
            <div>🏆 Compete in seasonal leaderboards</div>
          </div>
          <p className={`mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Keep creating and collecting to maximize your points when the system launches!
          </p>
        </div>
      </div>
    </div>
  );
}