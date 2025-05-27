export default function SongsContent() {
  const songs = [
    { id: 1, title: "Ami Gesi Bakka Age", artist: "Rabindranath Tagore", image: "/api/placeholder/60/60" },
    { id: 2, title: "Ekon Tui Kita Korte", artist: "Lalon Shah", image: "/api/placeholder/60/60" },
    { id: 3, title: "Tor Zeta Iccha Kor", artist: "Kazi Nazrul Islam", image: "/api/placeholder/60/60" },
    { id: 4, title: "Bhalobashar Gaan", artist: "Hemanta Mukherjee", image: "/api/placeholder/60/60" },
    { id: 5, title: "Shopner Deshe", artist: "Kishore Kumar", image: "/api/placeholder/60/60" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Top Songs</h2>
      <div className="space-y-4">
        {songs.map((song) => (
          <div key={song.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-15 h-15 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{song.title}</h3>
              <p className="text-gray-500">{song.artist}</p>
            </div>
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 