export default function ArtistsContent() {
  const artists = [
    { id: 1, name: "Rabindranath Tagore", followers: "2.4M followers", image: "/api/placeholder/80/80" },
    { id: 2, name: "Lalon Shah", followers: "1.8M followers", image: "/api/placeholder/80/80" },
    { id: 3, name: "Kazi Nazrul Islam", followers: "1.5M followers", image: "/api/placeholder/80/80" },
    { id: 4, name: "Hemanta Mukherjee", followers: "980K followers", image: "/api/placeholder/80/80" },
    { id: 5, name: "Kishore Kumar", followers: "850K followers", image: "/api/placeholder/80/80" },
    { id: 6, name: "Lata Mangeshkar", followers: "720K followers", image: "/api/placeholder/80/80" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Popular Artists</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {artists.map((artist) => (
          <div key={artist.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{artist.name}</h3>
              <p className="text-gray-500">{artist.followers}</p>
            </div>
            <button className="bg-[#5D2DA0] text-white px-6 py-2 rounded-full hover:bg-[#4A2380] transition-colors">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 