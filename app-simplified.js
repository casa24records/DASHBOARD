// Simplified version of app.js without Recharts dependency
// This will display your artist data without charts

const { useState, useEffect } = React;

// Helper function to format large numbers
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

function App() {
  const [data, setData] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('artist');

  useEffect(() => {
    // Fetch the artist data from the JSON file
    fetch('data/latest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(jsonData => {
        setData(jsonData);
        // Set the first artist as selected by default
        if (jsonData.artists && jsonData.artists.length > 0) {
          setSelectedArtist(jsonData.artists[0].name);
        }
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Initialize Life@24 section when the tab changes
  useEffect(() => {
    if (activeTab === 'life' && window.life24 && typeof window.life24.initialize === 'function') {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.life24.initialize('newest');
      }, 100);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-center">
          <div className="text-4xl font-bold mb-3" style={{color: "#00a651"}}>LOADING VIBES...</div>
          <div className="text-lg text-gray-400">Dusting off the vinyl records...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading data: {error}</div>;
  }

  if (!data || !data.artists || data.artists.length === 0) {
    return <div className="p-4">No artist data available.</div>;
  }

  // Get current artist data
  const currentArtistData = data.artists.find(artist => artist.name === selectedArtist) || data.artists[0];

  // Calculate collective totals
  const collectiveTotals = data.artists.reduce((acc, artist) => {
    acc.spotify.followers += artist.spotify.followers || 0;
    acc.spotify.popularity_score += artist.spotify.popularity_score || 0;
    acc.youtube.subscribers += artist.youtube.subscribers || 0;
    acc.youtube.total_views += artist.youtube.total_views || 0;
    acc.youtube.video_count += artist.youtube.video_count || 0;
    return acc;
  }, {
    spotify: { followers: 0, popularity_score: 0 },
    youtube: { subscribers: 0, total_views: 0, video_count: 0 }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-2" style={{color: "#00a651"}}>Casa 24 Records</h1>
        <p className="text-xl text-gray-400">We Out Here</p>
        <p className="text-sm text-gray-500 mt-1">Last updated: {data.date}</p>
      </header>

      <div className="mb-8">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 justify-center">
            <a 
              href="#artist"
              className={`py-4 px-1 font-medium text-lg ${
                activeTab === 'artist' ? 'text-accent' : 'text-gray-400'
              }`}
              style={{color: activeTab === 'artist' ? "#00a651" : ""}}
              onClick={(e) => { e.preventDefault(); setActiveTab('artist'); }}
            >
              Artist Analytics
            </a>
            <a 
              href="#collective"
              className={`py-4 px-1 font-medium text-lg ${
                activeTab === 'collective' ? 'text-accent' : 'text-gray-400'
              }`}
              style={{color: activeTab === 'collective' ? "#00a651" : ""}}
              onClick={(e) => { e.preventDefault(); setActiveTab('collective'); }}
            >
              Collective Overview
            </a>
            <a 
              href="#life"
              className={`py-4 px-1 font-medium text-lg ${
                activeTab === 'life' ? 'text-accent' : 'text-gray-400'
              }`}
              style={{color: activeTab === 'life' ? "#00a651" : ""}}
              onClick={(e) => { e.preventDefault(); setActiveTab('life'); }}
            >
              LIFE@24
            </a>
          </nav>
        </div>
      </div>

      {activeTab === 'artist' && (
        <div>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold" style={{color: "#00a651"}}>Artist Performance</h2>
            <select 
              className="bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded retro-btn"
              style={{borderColor: "#00a651"}}
              value={selectedArtist || ''}
              onChange={(e) => setSelectedArtist(e.target.value)}
            >
              {data.artists.map((artist, index) => (
                <option key={index} value={artist.name}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Spotify Followers Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Spotify Followers</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#1DB954"}}></div>
                <div className="text-3xl font-bold">{formatNumber(currentArtistData.spotify.followers || 0)}</div>
              </div>
            </div>

            {/* Spotify Popularity Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Spotify Popularity</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#1DB954"}}></div>
                <div className="text-3xl font-bold">{currentArtistData.spotify.popularity_score || 0}</div>
                <div className="text-xl ml-1">/100</div>
              </div>
            </div>

            {/* YouTube Subscribers Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">YouTube Subscribers</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#FF0000"}}></div>
                <div className="text-3xl font-bold">{formatNumber(currentArtistData.youtube.subscribers || 0)}</div>
              </div>
            </div>

            {/* YouTube Views Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">YouTube Views</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#FF0000"}}></div>
                <div className="text-3xl font-bold">{formatNumber(currentArtistData.youtube.total_views || 0)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Tracks List - Without Chart */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-2xl font-bold mb-4">Top Tracks</h3>
              <div className="overflow-y-auto" style={{maxHeight: "300px"}}>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">Track Name</th>
                      <th className="text-right pb-2">Popularity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentArtistData.spotify.top_tracks && currentArtistData.spotify.top_tracks.map((track, index) => (
                      <tr key={index} className="border-t border-gray-700">
                        <td className="py-2">{track.name}</td>
                        <td className="text-right py-2">{track.popularity}/100</td>
                      </tr>
                    ))}
                    {(!currentArtistData.spotify.top_tracks || currentArtistData.spotify.top_tracks.length === 0) && (
                      <tr>
                        <td colSpan="2" className="py-2 text-center text-gray-500">No top tracks found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Genres List */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-2xl font-bold mb-4">Artist Info</h3>
              <div>
                <h4 className="text-lg font-semibold mb-2">Genres:</h4>
                {currentArtistData.spotify.genres && currentArtistData.spotify.genres.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {currentArtistData.spotify.genres.map((genre, index) => (
                      <li key={index} className="mb-1 capitalize">{genre}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No genres listed</p>
                )}
                
                {currentArtistData.youtube.video_count > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">YouTube Stats:</h4>
                    <ul className="list-disc pl-5">
                      <li className="mb-1">Videos: {currentArtistData.youtube.video_count}</li>
                      <li className="mb-1">Views: {formatNumber(currentArtistData.youtube.total_views)}</li>
                      <li className="mb-1">Avg. Views/Video: {formatNumber(
                        Math.round(
                          currentArtistData.youtube.total_views / currentArtistData.youtube.video_count
                        ) || 0
                      )}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collective' && (
        <div>
          <h2 className="text-3xl font-bold mb-8" style={{color: "#00a651"}}>Collective Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Artists Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total Artists</h3>
              <div className="text-3xl font-bold">{data.artists.length}</div>
            </div>

            {/* Total Spotify Followers Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total Spotify Followers</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#1DB954"}}></div>
                <div className="text-3xl font-bold">{formatNumber(collectiveTotals.spotify.followers)}</div>
              </div>
            </div>

            {/* Total YouTube Subscribers Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total YouTube Subscribers</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#FF0000"}}></div>
                <div className="text-3xl font-bold">{formatNumber(collectiveTotals.youtube.subscribers)}</div>
              </div>
            </div>

            {/* Total YouTube Views Card */}
            <div className="p-6 rounded-lg" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total YouTube Views</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{background: "#FF0000"}}></div>
                <div className="text-3xl font-bold">{formatNumber(collectiveTotals.youtube.total_views)}</div>
              </div>
            </div>
          </div>

          {/* Artist Comparison Table */}
          <div className="p-6 rounded-lg mb-8" style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
            <h3 className="text-2xl font-bold mb-4">Artist Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left pb-2">Artist</th>
                    <th className="text-right pb-2">Spotify Followers</th>
                    <th className="text-right pb-2">Spotify Popularity</th>
                    <th className="text-right pb-2">YouTube Subscribers</th>
                    <th className="text-right pb-2">YouTube Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.artists.map((artist, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3 font-medium">{artist.name}</td>
                      <td className="text-right">{formatNumber(artist.spotify.followers || 0)}</td>
                      <td className="text-right">{artist.spotify.popularity_score || 0}/100</td>
                      <td className="text-right">{formatNumber(artist.youtube.subscribers || 0)}</td>
                      <td className="text-right">{formatNumber(artist.youtube.total_views || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'life' && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold" style={{color: "#00a651"}}>LIFE@24</h2>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-gray-800 inline-flex rounded-lg p-1" style={{border: "2px solid #00a651", boxShadow: "3px 3px 0px #00a651"}}>
              <button
                id="sort-newest-btn"
                className="px-4 py-2 rounded-md bg-gray-700"
              >
                Newest First
              </button>
              <button
                id="sort-oldest-btn"
                className="px-4 py-2 rounded-md"
              >
                Oldest First
              </button>
            </div>
          </div>

          {/* Container for magazine buttons - will be populated by life24.js */}
          <div id="life-at-24-container">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
              <p className="text-gray-400">Loading magazines...</p>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-gray-500">
        <p className="text-lg">Casa 24 Records Analytics Dashboard</p>
        <p className="text-sm mt-1 mb-6">Keeping it old school since 2021</p>
      </footer>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);