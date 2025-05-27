export default function PlaylistContent() {
  const playlists = [
    { id: 1, title: "My Favorites", songCount: 24, image: "/api/placeholder/120/120" },
    { id: 2, title: "Chill Vibes", songCount: 18, image: "/api/placeholder/120/120" },
    { id: 3, title: "Workout Mix", songCount: 32, image: "/api/placeholder/120/120" },
    { id: 4, title: "Study Session", songCount: 15, image: "/api/placeholder/120/120" },
    { id: 5, title: "Road Trip", songCount: 28, image: "/api/placeholder/120/120" },
    { id: 6, title: "Late Night", songCount: 21, image: "/api/placeholder/120/120" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Playlists</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-lg mb-1">{playlist.title}</h3>
            <p className="text-gray-500 text-sm">{playlist.songCount} songs</p>
            <button className="mt-3 w-full bg-[#5D2DA0] text-white py-2 px-4 rounded-lg hover:bg-[#4A2380] transition-colors">
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 