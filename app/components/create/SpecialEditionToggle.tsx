import React, { ChangeEvent } from 'react';

interface SpecialEditionToggleProps {
  isSpecialEdition: boolean;
  specialEditionName: string;
  numberOfEditions: string;
  specialEditionPrice: string;
  onSpecialEditionToggle: () => void;
  onSpecialEditionNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNumberOfEditionsChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSpecialEditionPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function SpecialEditionToggle({
  isSpecialEdition,
  specialEditionName,
  numberOfEditions,
  specialEditionPrice,
  onSpecialEditionToggle,
  onSpecialEditionNameChange,
  onNumberOfEditionsChange,
  onSpecialEditionPriceChange,
}: SpecialEditionToggleProps) {
  return (
    <div className="bg-white/5 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Special Edition</h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSpecialEdition}
            onChange={onSpecialEditionToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      {isSpecialEdition && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-2">Edition Name</label>
            <input
              type="text"
              value={specialEditionName}
              onChange={onSpecialEditionNameChange}
              placeholder="e.g., Limited Edition, Collector's Edition"
              className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isSpecialEdition}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Editions</label>
              <input
                type="number"
                value={numberOfEditions}
                onChange={onNumberOfEditionsChange}
                placeholder="10"
                min="1"
                className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={isSpecialEdition}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Edition Price (ETH)</label>
              <input
                type="number"
                value={specialEditionPrice}
                onChange={onSpecialEditionPriceChange}
                placeholder="0.05"
                step="0.01"
                min="0.01"
                className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={isSpecialEdition}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
