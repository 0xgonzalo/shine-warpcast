'use client';

import { useMemo } from 'react';
import NFTExists from '../components/NFTExists';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';

export default function FeaturedPage() {
  const { isDarkMode } = useTheme();

  // Featured token IDs 30-37
  const featuredTokenIds = useMemo(() => {
    return [30, 31, 32, 33, 34, 35, 36, 37].map(id => BigInt(id));
  }, []);

  return (
    <main className="min-h-screen p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/home"
          className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-white hover:bg-white/10'
              : 'text-foreground hover:bg-foreground/10'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Home
        </Link>

        {/* Header with banner */}
        <div className="relative w-full rounded-xl overflow-hidden mb-8 shadow-lg">
          <div className="relative w-full">
            <Image
              src="/featured/featured-banner.jpg"
              alt="MusicaW3 x Devconnect Drop on Base"
              width={1200}
              height={630}
              className="w-full h-auto"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              MusicaW3 x Devconnect Drop on Base
            </h1>
            <p className="text-sm md:text-base text-gray-100 drop-shadow-md">
              MusicaW3 is celebrating Devconnect with a curated selection of artists
              participating in featured events around the conference like Base Meetup,
              The Music Stage at the main conference and others
            </p>
          </div>
        </div>

        {/* Featured Collection */}
        <div className="mb-6">
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
            Featured Collection
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredTokenIds.map((id) => (
              <NFTExists key={id.toString()} tokenId={id} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
