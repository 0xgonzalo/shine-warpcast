import NFTExists from '../NFTExists';
import { useState } from 'react';

interface FeedContentProps {
  mobileColumns: number;
  setMobileColumns: (columns: number) => void;
}

const MAX_SCAN = 20; // Scan token IDs 1 to 20

export default function FeedContent({ mobileColumns, setMobileColumns }: FeedContentProps) {
  const tokenIds = Array.from({ length: MAX_SCAN }, (_, i) => BigInt(i + 1)).slice(3);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const popularSongs = [
    { 
      id: 1, 
      title: "Ami Gesi Bakka Age", 
      artist: "Rabindranath Tagore",
      bgGradient: "from-orange-500 via-red-500 to-blue-600"
    },
    { 
      id: 2, 
      title: "Ekon Tui Kita Korte", 
      artist: "Lalon Shah",
      bgGradient: "from-blue-600 via-teal-500 to-purple-600"
    },
    { 
      id: 3, 
      title: "Tor Zeta Iccha Kor", 
      artist: "Kazi Nazrul Islam",
      bgGradient: "from-yellow-500 via-orange-500 to-red-500"
    },
  ];

  const handleMenuToggle = (songId: number) => {
    setOpenMenuId(openMenuId === songId ? null : songId);
  };

  const handleAction = (action: string, songTitle: string) => {
    console.log(`${action} for ${songTitle}`);
    setOpenMenuId(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="md:text-4xl text-2xl font-bold text-center">New Releases</h1>
        
        <div className="flex space-x-2 md:hidden">
          <button 
            onClick={() => setMobileColumns(1)}
            className={`p-1.5 border ${mobileColumns === 1 ? 'bg-[#5D2DA0] text-white' : ''} rounded flex items-center justify-center w-8 h-8`}
            aria-label="Single column view"
          >
            <div className="w-4 h-4 border-2 border-current"></div>
          </button>
          <button 
            onClick={() => setMobileColumns(2)}
            className={`p-1.5 border ${mobileColumns === 2 ? 'bg-[#5D2DA0] text-white' : ''} rounded flex items-center justify-center w-8 h-8`}
            aria-label="Double column view"
          >
            <div className="flex space-x-0.5">
              <div className="w-3 h-3 border-2 border-current"></div>
              <div className="w-3 h-3 border-2 border-current"></div>
            </div>
          </button>
        </div>
      </div>
      
      <div className={`grid ${mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12`}>
        {tokenIds.map((tokenId) => (
          <NFTExists key={tokenId.toString()} tokenId={tokenId} />
        ))}
      </div>

      {/* Top Songs Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
        <div className="space-y-3">
          {popularSongs.map((song) => (
            <div key={song.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 hover:bg-opacity-20 transition-colors relative">
              {/* Album artwork */}
              <div className={`w-16 h-16 bg-gradient-to-br ${song.bgGradient} rounded-lg flex-shrink-0 relative overflow-hidden`}>
                {/* Abstract art pattern */}
                <div className="absolute inset-0">
                  <div className="absolute top-1 left-2 w-4 h-4 bg-white/30 rounded-full"></div>
                  <div className="absolute top-3 right-1 w-6 h-6 bg-white/20 rounded-lg rotate-45"></div>
                  <div className="absolute bottom-1 left-1 w-5 h-5 bg-white/25 rounded-full"></div>
                  <div className="absolute bottom-2 right-2 w-3 h-8 bg-white/30 rounded-full rotate-12"></div>
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Song info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-white truncate">{song.title}</h3>
                <p className="text-gray-300 text-sm">{song.artist}</p>
              </div>
              
              {/* Three dots menu */}
              <div className="relative">
                <button 
                  onClick={() => handleMenuToggle(song.id)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {openMenuId === song.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <div className="py-1">
                      <button 
                        onClick={() => handleAction('Add to queue', song.title)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add to queue</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Like', song.title)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Like</span>
                      </button>
                      <button 
                        onClick={() => handleAction('Collect', song.title)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Collect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 