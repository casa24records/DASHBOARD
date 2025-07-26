// Casa 24 Records Dashboard - Simplified App
const { useState, useEffect } = React;

// Helper function to format large numbers
const formatNumber = (num) => {
  if (num === "N/A" || num === null || num === undefined) {
    return "N/A";
  }
  
  // Convert string numbers to integers
  const numValue = typeof num === 'string' ? parseInt(num.replace(/,/g, '')) : num;
  
  if (isNaN(numValue)) {
    return "N/A";
  }
  
  if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(1) + 'M';
  } else if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + 'K';
  }
  return numValue.toLocaleString();
};

// Helper function to format artist names with proper spacing
const formatArtistName = (name) => {
  // Special case for Casa 24Beats
  if (name === 'Casa 24Beats') {
    return 'Casa 24 Beats';
  }
  return name;
};

// Add custom styles for transitions and consistency
const styles = `
  <style>
    /* Smooth transitions for all interactive elements */
    .stat-box {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .stat-box:hover {
      transform: translateY(-2px);
      box-shadow: 6px 6px 0px #00a651 !important;
    }
    
    /* Consistent stat value styling */
    .stat-value {
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    
    /* Fix alignment for all stat boxes */
    .stat-content {
      display: flex;
      align-items: center;
      height: 36px; /* Fixed height for consistency */
    }
    
    .stat-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    /* Dropdown styling improvements */
    .artist-dropdown {
      transition: all 0.2s ease;
    }
    
    .artist-dropdown:hover {
      box-shadow: 3px 3px 0px #00a651;
      transform: translateY(-1px);
    }
    
    .artist-dropdown:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 166, 81, 0.3), 3px 3px 0px #00a651;
    }
    
    /* Section transitions */
    .fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Responsive grid improvements */
    @media (max-width: 1024px) {
      .stat-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
      }
    }
    
    @media (max-width: 640px) {
      .stat-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
`;

function App() {
  const [data, setData] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState('Casa 24');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('collective');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Inject custom styles
  useEffect(() => {
    const styleElement = document.createElement('div');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement.firstChild);
    
    return () => {
      const style = document.querySelector('style');
      if (style && style.innerHTML.includes('stat-box')) {
        style.remove();
      }
    };
  }, []);

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
        setLoading(false);
        // Set the initial artist to Casa 24 if it exists
        if (jsonData.artists && jsonData.artists.length > 0) {
          const casa24Exists = jsonData.artists.find(artist => artist.name === 'Casa 24');
          if (!casa24Exists) {
            setSelectedArtist(jsonData.artists[0].name);
          }
        }
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Initialize Life@24 section when the tab changes
  useEffect(() => {
    if (activeTab === 'life' && window.life24 && typeof window.life24.initialize === 'function') {
      setTimeout(() => {
        window.life24.initialize('newest');
      }, 100);
    } else if (activeTab === 'unmastered' && window.unmastered && typeof window.unmastered.initialize === 'function') {
      setTimeout(() => {
        window.unmastered.initialize('newest');
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
  
  // Check if current artist has Spotify data
  const hasSpotifyData = currentArtistData.spotify && (
    currentArtistData.spotify.followers > 0 || 
    currentArtistData.spotify.popularity_score > 0 ||
    (currentArtistData.spotify.genres && currentArtistData.spotify.genres.length > 0)
  );

  // Calculate collective totals
  const collectiveTotals = data.artists.reduce((acc, artist) => {
    acc.spotify.followers += artist.spotify.followers || 0;
    acc.spotify.popularity_score += artist.spotify.popularity_score || 0;
    
    // Handle monthly listeners
    const monthlyListeners = artist.spotify.monthly_listeners;
    if (monthlyListeners && monthlyListeners !== "N/A") {
      const numValue = typeof monthlyListeners === 'string' ? 
        parseInt(monthlyListeners.replace(/,/g, '')) : monthlyListeners;
      if (!isNaN(numValue)) {
        acc.spotify.monthly_listeners += numValue;
      }
    }
    
    acc.youtube.subscribers += artist.youtube.subscribers || 0;
    acc.youtube.total_views += artist.youtube.total_views || 0;
    acc.youtube.video_count += artist.youtube.video_count || 0;
    return acc;
  }, {
    spotify: { followers: 0, popularity_score: 0, monthly_listeners: 0 },
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
            <a 
              href="#unmastered"
              className={`py-4 px-1 font-medium text-lg ${
                activeTab === 'unmastered' ? 'text-accent' : 'text-gray-400'
              }`}
              style={{color: activeTab === 'unmastered' ? "#00a651" : ""}}
              onClick={(e) => { e.preventDefault(); setActiveTab('unmastered'); }}
            >
              untitled unmastered
            </a>
          </nav>
        </div>
      </div>

      {activeTab === 'collective' && (
        <div className="fade-in">
          <h2 className="text-3xl font-bold mb-8" style={{color: "#00a651"}}>Collective Overview</h2>

          {/* Collective Totals */}
          <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total Artists</h3>
              <div className="stat-content">
                <div className="stat-value text-3xl font-bold">{data.artists.length}</div>
              </div>
            </div>

            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total Spotify Followers</h3>
              <div className="stat-content">
                <div className="stat-dot" style={{background: "#1DB954"}}></div>
                <div className="stat-value text-3xl font-bold">{formatNumber(collectiveTotals.spotify.followers)}</div>
              </div>
            </div>

            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total Monthly Listeners</h3>
              <div className="stat-content">
                <div className="stat-dot" style={{background: "#1DB954"}}></div>
                <div className="stat-value text-3xl font-bold">{formatNumber(collectiveTotals.spotify.monthly_listeners)}</div>
              </div>
            </div>

            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total YouTube Subscribers</h3>
              <div className="stat-content">
                <div className="stat-dot" style={{background: "#FF0000"}}></div>
                <div className="stat-value text-3xl font-bold">{formatNumber(collectiveTotals.youtube.subscribers)}</div>
              </div>
            </div>

            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-lg text-gray-400 mb-1">Total YouTube Views</h3>
              <div className="stat-content">
                <div className="stat-dot" style={{background: "#FF0000"}}></div>
                <div className="stat-value text-3xl font-bold">{formatNumber(collectiveTotals.youtube.total_views)}</div>
              </div>
            </div>
          </div>

          {/* Artist Performance Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-2xl font-bold">Artist Performance</h3>
            <select 
              className="artist-dropdown bg-gray-800 border-2 text-white py-2 px-4 rounded retro-btn"
              style={{borderColor: "#00a651"}}
              value={selectedArtist || ''}
              onChange={(e) => {
                setSelectedArtist(e.target.value);
              }}
            >
              {data.artists.map((artist, index) => (
                <option key={index} value={artist.name}>
                  {formatArtistName(artist.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Individual Artist Stats */}
          <div>
            <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="stat-box p-6 rounded-lg" 
                   style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
                <h3 className="text-lg text-gray-400 mb-1">Spotify Followers</h3>
                <div className="stat-content">
                  <div className="stat-dot" style={{background: "#1DB954"}}></div>
                  <div className="stat-value text-3xl font-bold">{formatNumber(currentArtistData.spotify.followers || 0)}</div>
                </div>
              </div>

              <div className="stat-box p-6 rounded-lg" 
                   style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
                <h3 className="text-lg text-gray-400 mb-1">Monthly Listeners</h3>
                <div className="stat-content">
                  <div className="stat-dot" style={{background: "#1DB954"}}></div>
                  <div className="stat-value text-3xl font-bold">{formatNumber(currentArtistData.spotify.monthly_listeners || "N/A")}</div>
                </div>
              </div>

              <div className="stat-box p-6 rounded-lg" 
                   style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
                <h3 className="text-lg text-gray-400 mb-1">Spotify Popularity</h3>
                <div className="stat-content">
                  <div className="stat-dot" style={{background: "#1DB954"}}></div>
                  <div className="stat-value text-3xl font-bold">
                    {currentArtistData.spotify.popularity_score || 0}
                    <span className="text-xl ml-1">/100</span>
                  </div>
                </div>
              </div>

              <div className="stat-box p-6 rounded-lg" 
                   style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
                <h3 className="text-lg text-gray-400 mb-1">YouTube Subscribers</h3>
                <div className="stat-content">
                  <div className="stat-dot" style={{background: "#FF0000"}}></div>
                  <div className="stat-value text-3xl font-bold">{formatNumber(currentArtistData.youtube.subscribers || 0)}</div>
                </div>
              </div>

              <div className="stat-box p-6 rounded-lg" 
                   style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
                <h3 className="text-lg text-gray-400 mb-1">YouTube Views</h3>
                <div className="stat-content">
                  <div className="stat-dot" style={{background: "#FF0000"}}></div>
                  <div className="stat-value text-3xl font-bold">{formatNumber(currentArtistData.youtube.total_views || 0)}</div>
                </div>
              </div>
            </div>

            {/* Artist Info - Full Width Now */}
            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-2xl font-bold mb-4">Artist Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Genres:</h4>
                  {currentArtistData.spotify.genres && currentArtistData.spotify.genres.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {currentArtistData.spotify.genres.map((genre, index) => (
                        <li key={index} className="mb-1 capitalize">{genre}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      {!hasSpotifyData ? "No Spotify data available" : "No genres listed"}
                    </p>
                  )}
                </div>
                
                {currentArtistData.youtube.video_count > 0 && (
                  <div>
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

      {activeTab === 'life' && (
        <div>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold" style={{color: "#00a651"}}>LIFE@24</h2>
            <div id="life24-dropdown-container">
              {/* Dropdown will be injected here by life24.js */}
            </div>
          </div>

          <div id="life-at-24-container">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
              <p className="text-gray-400">Loading magazines...</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'unmastered' && (
        <div>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold" style={{color: "#00a651"}}>untitled unmastered</h2>
            <div id="unmastered-dropdown-container">
              {/* Dropdown will be injected here by unmastered.js */}
            </div>
          </div>

          <div id="untitled-unmastered-container">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
              <p className="text-gray-400">Loading tracks...</p>
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
