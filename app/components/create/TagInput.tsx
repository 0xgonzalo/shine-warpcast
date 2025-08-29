import React, { KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onTagInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  filteredGenres: string[];
}

export default function TagInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagInputKeyDown,
  filteredGenres,
}: TagInputProps) {
  return (
    <div className="bg-white/5 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Tags</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-2 text-white/70 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={onTagInputKeyDown}
            placeholder="Add tags (e.g., Rock, Electronic, Jazz)"
            className="w-full p-3 bg-white/5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {tagInput && filteredGenres.length > 0 && (
            <div className="mt-2 bg-black/80 rounded-lg p-2 max-h-40 overflow-y-auto">
              {filteredGenres.map((genre) => (
                <div
                  key={genre}
                  onClick={() => onAddTag(genre)}
                  className="px-3 py-2 hover:bg-white/10 rounded cursor-pointer"
                >
                  {genre}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
