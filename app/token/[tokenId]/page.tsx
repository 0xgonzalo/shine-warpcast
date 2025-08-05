'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../../utils/contract';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../../context/AudioContext';
import { useTheme } from '../../context/ThemeContext';
import Image from 'next/image';

// This is the legacy format the component expects
interface NFTMetadata {
  name: string;
  description: string;
  audioURI: string;
  imageURI: string;
  creator: `0x${string}`;
}

export default function TokenPage() {
  const params = useParams();
  const tokenId = BigInt(params.tokenId as string);
  const { isDarkMode } = useTheme();
  
  const { data: rawData, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getSongMetadata',
    args: [tokenId],
  });

  // Adapt the new contract data to the legacy format used by this component
  const data: NFTMetadata | undefined = rawData ? {
    name: (rawData as any).title,
    description: '', // Not available in new contract
    audioURI: (rawData as any).mediaURI,
    imageURI: (rawData as any).metadataURI, // Using metadataURI as a fallback for the image
    creator: (rawData as any).artistAddress
  } : undefined;

  const { currentAudio, isPlaying, playAudio, setIsPlaying, currentTime, duration, seekTo } = useAudio();


  const handlePlayPause = () => {
    if (data?.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri') {
      const audioUrl = getIPFSGatewayURL(data.audioURI);
      if (currentAudio?.src === audioUrl) {
        setIsPlaying(!isPlaying);
      } else {
        playAudio(audioUrl, data.name);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e]' 
          : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
        <div className={`text-lg ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Loading...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e]' 
          : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
        <div className={`text-lg ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Token not found</div>
      </div>
    );
  }

  const isAudioAvailable = data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri';
  const audioUrl = isAudioAvailable ? getIPFSGatewayURL(data.audioURI) : '';

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white' 
        : 'bg-transparent text-gray-800'
    }`}>
      {/* Starry background effect - only show in dark mode */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-60 animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pt-8">
        {/* Album Art */}
        <div className="w-64 h-64 mb-6 rounded-lg overflow-hidden shadow-2xl">
          {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' ? (
            <Image
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              width={256}
              height={256}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-600 to-gray-800' 
                : 'bg-gradient-to-br from-gray-200 to-gray-300'
            }`}>
              <svg className={`w-16 h-16 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Song Info */}
        <h1 className={`text-2xl font-bold mb-2 text-center ${
          isDarkMode ? 'text-white' : 'text-[#0000FE]'
        }`}>{data.name}</h1>
        <p className={`mb-6 text-center ${
          isDarkMode ? 'text-gray-300' : 'text-blue-800'
        }`}>
          {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
        </p>

        {/* Audio Controls */}
        {isAudioAvailable && (
          <>
            {/* Progress Bar */}
            <div className="w-full max-w-xs mb-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer slider ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-800'
                }`}
                style={{
                  background: isDarkMode 
                    ? `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 100%)`
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #94a3b8 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #94a3b8 100%)`
                }}
              />
              <div className={`flex justify-between text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-4 mb-6">


              <button className={`w-8 h-8 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18V6h2v6l8.5-6v12l-8.5-6v6z"/>
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform ${
                  isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isPlaying && currentAudio?.src === audioUrl ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button className={`w-8 h-8 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

            </div>
          </>
        )}


      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${isDarkMode ? '#ffffff' : '#3b82f6'};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${isDarkMode ? '#ffffff' : '#3b82f6'};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
} 