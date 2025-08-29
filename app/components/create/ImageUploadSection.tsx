import { ChangeEvent } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ImageUploadSectionProps {
  imageFile: File | null;
  imagePreview: string;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploadSection({
  imageFile,
  imagePreview,
  onImageUpload,
}: ImageUploadSectionProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="bg-white/5 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Upload Cover Art</h2>
      <div className="space-y-4">
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className={`block w-full p-4 border-2 border-dashed ${
            isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-foreground hover:border-foreground/70'
          } rounded-lg text-center cursor-pointer transition-colors`}
        >
          <div className="space-y-2">
            <div className="text-4xl">🎨</div>
            <div className="text-lg font-medium">
              {imageFile ? imageFile.name : 'Choose Cover Art'}
            </div>
            <div className="text-sm text-gray-400">
              Tap to select an image file from your device
            </div>
          </div>
        </label>
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Cover art preview"
              className="max-w-xs rounded-lg mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
