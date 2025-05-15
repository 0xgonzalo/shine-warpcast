'use client';

import { useAudio } from '../context/AudioContext';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useRef, useEffect } from 'react';

type AudioPlayerRef = {
  audio: {
    current: HTMLAudioElement;
  };
};

export default function GlobalAudioPlayer() {
  const { currentAudio, isPlaying, setIsPlaying, stopAudio } = useAudio();
  const playerRef = useRef<AudioPlayerRef | null>(null);

  // Sync the player's state with the context
  useEffect(() => {
    if (!playerRef.current?.audio?.current) return;

    if (isPlaying) {
      playerRef.current.audio.current.play().catch((error: Error) => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    } else {
      playerRef.current.audio.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  if (!currentAudio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium truncate">{currentAudio.name}</span>
        </div>
        <AudioPlayer
          ref={playerRef as any}
          src={currentAudio.src}
          autoPlay={false}
          showJumpControls={false}
          layout="stacked"
          customProgressBarSection={[
            RHAP_UI.PROGRESS_BAR,
            RHAP_UI.CURRENT_TIME,
            RHAP_UI.DURATION,
          ]}
          customControlsSection={[
            RHAP_UI.MAIN_CONTROLS,
            RHAP_UI.VOLUME_CONTROLS,
          ]}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={stopAudio}
          className="bg-transparent"
          preload="none"
        />
      </div>
    </div>
  );
} 