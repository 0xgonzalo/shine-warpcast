import { ChangeEvent } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAudio } from '../../context/AudioContext';

interface AudioUploadSectionProps {
  audioFile: File | null;
  audioPreview: string;
  fileError: string | null;
  onAudioUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPlayPreview: () => void;
  currentAudio: { src: string } | null;
  isPlaying: boolean;
}

export default function AudioUploadSection({
  audioFile,
  audioPreview,
  fileError,
  onAudioUpload,
  onPlayPreview,
  currentAudio,
  isPlaying,
}: AudioUploadSectionProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="bg-white/5 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Upload Audio</h2>
      <div className="space-y-4">
        <input
          id="audio-upload"
          type="file"
          accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,.mp3,.wav,.ogg,.aac,.m4a"
          onChange={onAudioUpload}
          className="hidden"
        />
        <label
          htmlFor="audio-upload"
          className={`block w-full p-4 border-2 border-dashed ${
            isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-foreground hover:border-foreground/70'
          } rounded-lg text-center cursor-pointer transition-colors`}
        >
          <div className="space-y-2">
            <div className="text-4xl">🎵</div>
            <div className="text-lg font-medium">
              {audioFile ? audioFile.name : 'Choose Audio File'}
            </div>
            <div className="text-sm text-gray-400">
              Tap to select an audio file from your device
            </div>
          </div>
        </label>
        {fileError && (
          <div className="text-red-500 text-sm text-center">
            {fileError}
          </div>
        )}
        {audioPreview && (
          <button
            onClick={onPlayPreview}
            className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
              currentAudio?.src === audioPreview && isPlaying
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {currentAudio?.src === audioPreview && isPlaying
              ? 'Playing Preview...'
              : 'Play Preview'}
          </button>
        )}
      </div>
    </div>
  );
}
