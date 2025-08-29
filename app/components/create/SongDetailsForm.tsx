import { ChangeEvent } from 'react';

interface SongDetailsFormProps {
  nftName: string;
  nftArtist: string;
  nftDescription: string;
  price: string;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onArtistChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function SongDetailsForm({
  nftName,
  nftArtist,
  nftDescription,
  price,
  onNameChange,
  onArtistChange,
  onDescriptionChange,
  onPriceChange,
}: SongDetailsFormProps) {
  return (
    <div className="bg-white/5 p-6 rounded-lg space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Song Details</h2>
      <div>
        <label className="block text-sm font-medium mb-2">Song Name</label>
        <input
          type="text"
          value={nftName}
          onChange={onNameChange}
          placeholder="Enter song name"
          className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Artist Name</label>
        <input
          type="text"
          value={nftArtist}
          onChange={onArtistChange}
          placeholder="Enter artist name"
          className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={nftDescription}
          onChange={onDescriptionChange}
          placeholder="Tell us about your song..."
          rows={4}
          className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Price (ETH)</label>
        <input
          type="number"
          value={price}
          onChange={onPriceChange}
          placeholder="0.01"
          step="0.01"
          min="0.01"
          className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </div>
  );
}
