import { useEffect, useMemo, useState } from 'react';
import NFTExists from '../NFTExists';
import { useTheme } from '../../context/ThemeContext';
import { getSongMetadata, getTotalSongCount, checkNFTExists } from '../../utils/contract';

interface SongWithTags {
  tokenId: bigint;
  tags: string[];
}

export default function SongsContent() {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [songs, setSongs] = useState<SongWithTags[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [genreQuery, setGenreQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadSongs() {
      try {
        setIsLoading(true);

        const total = await getTotalSongCount();
        // Limit how many we scan for performance
        const maxToScan = Math.min(Number(total), 60);
        const startId = Number(total);
        const endId = Math.max(1, startId - maxToScan + 1);

        const candidates: bigint[] = [];
        for (let i = startId; i >= endId; i--) {
          candidates.push(BigInt(i));
        }

        // Check existence in parallel (throttle if needed later)
        const existence = await Promise.all(
          candidates.map(async (id) => {
            try {
              const exists = await checkNFTExists(id);
              return exists ? id : null;
            } catch {
              return null;
            }
          })
        );

        const existingIds = existence.filter(Boolean) as bigint[];

        // Fetch metadata for tags
        const withTags: SongWithTags[] = [];
        for (const id of existingIds) {
          try {
            const meta = await getSongMetadata(id);
            withTags.push({ tokenId: id, tags: Array.isArray(meta.tags) ? meta.tags : [] });
          } catch {
            // ignore failures for individual songs
          }
        }

        if (isMounted) setSongs(withTags);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSongs();
    return () => {
      isMounted = false;
    };
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => s.tags.forEach((t) => {
      const normalized = (t || '').trim();
      if (normalized) set.add(normalized);
    }));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  // Predefined genre options (aligned with create page)
  const genreOptions = useMemo(
    () => [
      'Pop','Rock','Hip Hop','Electronic','Jazz','Classical','Country','R&B','Reggae','Folk',
      'Blues','Punk','Metal','Disco','Funk','Gospel','House','Techno','Dubstep','Ambient',
      'Indie','Alternative','Experimental','Lo-fi','Trap','Drill','Afrobeat','Latin','K-pop','Anime'
    ],
    []
  );

  // Merge discovered genres with predefined options
  const allGenres = useMemo(() => {
    const set = new Set<string>(['All']);
    genreOptions.forEach((g) => set.add(g));
    genres.forEach((g) => set.add(g));
    return Array.from(set).filter(Boolean).sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)));
  }, [genres, genreOptions]);

  const filteredSuggestions = useMemo(() => {
    const q = genreQuery.trim().toLowerCase();
    if (!q) return [] as string[];
    return allGenres.filter((g) => g.toLowerCase().includes(q) && g !== 'All').slice(0, 8);
  }, [genreQuery, allGenres]);

  const filteredTokenIds = useMemo(() => {
    if (selectedGenre === 'All') return songs.map((s) => s.tokenId);
    const sel = selectedGenre.toLowerCase();
    return songs
      .filter((s) => s.tags.some((t) => (t || '').toLowerCase() === sel))
      .map((s) => s.tokenId);
  }, [songs, selectedGenre]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-foreground'}`}>Browse Songs</h2>
      </div>

      <div className="mb-6">
        <h3 className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-blue-900'}`}>Filter by genre</h3>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={genreQuery}
              onChange={(e) => setGenreQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && genreQuery.trim()) {
                  // Prefer first suggestion if available; otherwise use entered text
                  const choice = filteredSuggestions[0] || genreQuery.trim();
                  setSelectedGenre(choice);
                  setGenreQuery('');
                }
              }}
              placeholder="Search genres (e.g., Pop, Lo-fi, Afrobeat)"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-white/10 text-white border-white/20 placeholder-white/50' : 'bg-white text-foreground border-foreground placeholder-foreground/70'
              }`}
            />
            {genreQuery && filteredSuggestions.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border z-10 ${
                isDarkMode ? 'bg-gray-800 border-white/20' : 'bg-white border-gray-200'
              }`}>
                {filteredSuggestions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setSelectedGenre(g); setGenreQuery(''); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  selectedGenre === genre
                    ? isDarkMode
                      ? 'bg-white text-black border-white'
                      : 'bg-foreground text-white border-foreground'
                    : isDarkMode
                      ? 'text-white border-white/30 hover:bg-white/10'
                      : 'text-foreground border-foreground hover:bg-foreground/10'
                }`}
                title={genre}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
          <p>Loading songs...</p>
        </div>
      ) : filteredTokenIds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredTokenIds.map((id) => (
            <NFTExists key={id.toString()} tokenId={id} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>No songs found{selectedGenre !== 'All' ? ` for “${selectedGenre}”` : ''}.</p>
        </div>
      )}
    </div>
  );
}