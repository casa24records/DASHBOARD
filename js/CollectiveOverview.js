/**
 * Collective Overview Module for Casa 24 Records Dashboard
 * Displays artist statistics and collective totals
 */

(function() {
  'use strict';

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

  function CollectiveOverviewComponent() {
    const [data, setData] = useState(null);
    const [selectedArtist, setSelectedArtist] = useState('Casa 24');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    
    // Check if current artist is Casa 24Beats
    const isCasa24Beats = currentArtistData.name === 'Casa 24Beats';

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Tracks / Top Videos */}
            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
              <h3 className="text-2xl font-bold mb-4">
                {isCasa24Beats ? 'Top Videos' : 'Top Tracks'}
                {isCasa24Beats && (
                  <span className="youtube-indicator">
                    <span className="youtube-dot"></span>
                    YouTube
                  </span>
                )}
              </h3>
              <div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">{isCasa24Beats ? 'Video Title' : 'Track Name'}</th>
                      <th className="text-right pb-2">{isCasa24Beats ? 'Views' : 'Popularity'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isCasa24Beats && currentArtistData.youtube.top_videos && currentArtistData.youtube.top_videos.length > 0 ? (
                      currentArtistData.youtube.top_videos.map((video, index) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="py-2 pr-4" style={{maxWidth: '250px'}}>
                            <div className="truncate" title={video.title}>
                              {video.title}
                            </div>
                          </td>
                          <td className="text-right py-2">{formatNumber(video.views)}</td>
                        </tr>
                      ))
                    ) : !isCasa24Beats && currentArtistData.spotify.top_tracks && currentArtistData.spotify.top_tracks.length > 0 ? (
                      currentArtistData.spotify.top_tracks.map((track, index) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="py-2">{track.name}</td>
                          <td className="text-right py-2">{track.popularity}/100</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="py-2 text-center text-gray-500">
                          {isCasa24Beats ? "No videos found" : (!hasSpotifyData ? "No Spotify data available" : "No top tracks found")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Artist Info */}
            <div className="stat-box p-6 rounded-lg" 
                 style={{border: "2px solid #00a651", boxShadow: "4px 4px 0px #00a651", background: "rgba(26, 26, 26, 0.7)"}}>
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
                  <p className="text-gray-500">
                    {!hasSpotifyData ? "No Spotify data available" : "No genres listed"}
                  </p>
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
      </div>
    );
  }

  // Initialize the component
  function initialize() {
    const container = document.getElementById('collective-overview-root');
    if (container) {
      ReactDOM.render(
        <React.StrictMode>
          <CollectiveOverviewComponent />
        </React.StrictMode>,
        container
      );
    }
  }

  // Refresh function (re-render)
  function refresh() {
    initialize();
  }

  // Export public API
  window.CollectiveOverview = {
    initialize: initialize,
    refresh: refresh
  };

  // Auto-initialize when tab is shown
  document.addEventListener('DOMContentLoaded', () => {
    // Check if this is the default/active section
    const hash = window.location.hash.substring(1);
    if (!hash || hash === 'collective') {
      initialize();
    }
  });

})();
