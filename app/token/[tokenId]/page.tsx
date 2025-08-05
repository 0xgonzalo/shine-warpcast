'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI } from '../../utils/contract';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useAudio } from '../../context/AudioContext';
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
  const [showLyrics, setShowLyrics] = useState(false);


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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-lg">Token not found</div>
      </div>
    );
  }

  const isAudioAvailable = data.audioURI && data.audioURI !== 'ipfs://placeholder-audio-uri';
  const audioUrl = isAudioAvailable ? getIPFSGatewayURL(data.audioURI) : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f1419] text-white">
      {/* Starry background effect */}
      <div className="absolute inset-0 overflow-hidden">
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

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Album Art */}
        <div className="w-80 h-80 mb-8 rounded-lg overflow-hidden shadow-2xl">
          {data.imageURI && data.imageURI !== 'ipfs://placeholder-image-uri' ? (
            <Image
              src={getIPFSGatewayURL(data.imageURI)}
              alt={data.name}
              width={320}
              height={320}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Song Info */}
        <h1 className="text-3xl font-bold mb-2 text-center">{data.name}</h1>
        <p className="text-gray-300 mb-8 text-center">
          {data.creator?.slice(0, 6)}...{data.creator?.slice(-4)}
        </p>

        {/* Audio Controls */}
        {isAudioAvailable && (
          <>
            {/* Progress Bar */}
            <div className="w-full max-w-sm mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 ${(currentTime && duration ? (currentTime / duration) * 100 : 0)}%, #4a5568 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-6 mb-8">
              <button className="w-8 h-8 text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button className="w-12 h-12 text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying && currentAudio?.src === audioUrl ? (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button className="w-12 h-12 text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18V6h2v6l8.5-6v12l-8.5-6v6z"/>
                </svg>
              </button>

              <button className="w-8 h-8 text-gray-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Lyrics Toggle */}
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className="text-gray-400 hover:text-white transition-colors mb-4"
        >
          {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
} 