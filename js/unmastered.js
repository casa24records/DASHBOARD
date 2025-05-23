/**
 * untitled unmastered Dynamic Audio Player
 * 
 * This script fetches MP3 audio files directly from a public Google Drive folder
 * and displays them in the website, without requiring any file downloads,
 * credentials, or secrets.
 */

// Configuration object
const unmasteredConfig = {
    // Google Drive API key (no OAuth required) 
    apiKey: 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk',
    
    // Your public Google Drive folder ID
    folderId: '12JmF908-4lELxUroNiUtycvicatw1J2X',
    
    // CSS selector for the container where the audio tracks will be displayed
    containerSelector: '#untitled-unmastered-container', 
    
    // Query parameters for the Google Drive API
    queryParams: {
      // Only fetch MP3 files
      q: "mimeType='audio/mpeg'",
      // Sort by created time, newest first
      orderBy: 'createdTime desc',
      // Maximum number of files to fetch
      pageSize: 50,
      // Fields to include in the response
      fields: 'files(id,name,createdTime,webViewLink,modifiedTime)'
    }
  };
  
  /**
   * Format date to D-MMM-YYYY format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  function formatDisplayDate(dateString) {
    if (!dateString) return 'Date unavailable';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }
  
  /**
   * Fetch the list of tracks from Google Drive
   * @returns {Promise<Array>} Array of track objects
   */
  async function fetchUnmasteredTracks() {
    try {
      // Build the URL to fetch files from the folder
      let url = `https://www.googleapis.com/drive/v3/files?key=${unmasteredConfig.apiKey}`;
      
      // Add folder query parameter
      url += `&q='${unmasteredConfig.folderId}'+in+parents and ${unmasteredConfig.queryParams.q}`;
      
      // Add other query parameters
      url += `&orderBy=${unmasteredConfig.queryParams.orderBy}`;
      url += `&pageSize=${unmasteredConfig.queryParams.pageSize}`;
      url += `&fields=${unmasteredConfig.queryParams.fields}`;
      
      console.log('Fetching tracks from Google Drive...');
      
      // Fetch the file list
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the files into track objects
      return data.files.map(file => {
          // Extract the date part from filenames if available
          const datePart = extractDateFromFilename(file.name);
          
          return {
            id: file.id,
            name: file.name,
            date: datePart.date,
            displayName: datePart.displayName,
            // Use a direct embedding URL that should work better for audio playback
            audioUrl: `https://drive.google.com/a/ui/v1/m?id=${file.id}`,
            previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime || file.createdTime
          };
        })
        .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }
  
  /**
   * Extract the date part from a filename
   * @param {string} filename - Format: "Track Name [DATE].mp3"
   * @returns {Object} Object with date and displayName properties
   */
  function extractDateFromFilename(filename) {
    // Default return values
    const result = {
      date: null,
      displayName: filename.replace('.mp3', '')
    };
    
    try {
      // Check if filename contains date in square brackets
      const bracketMatch = filename.match(/\[(.*?)\]/);
      
      if (bracketMatch && bracketMatch[1]) {
        const dateText = bracketMatch[1].trim();
        result.displayName = result.displayName.replace(`[${dateText}]`, '').trim();
        
        // Handle different date formats
        
        // Format: ENE 07 - ENE 12 (month range)
        if (dateText.includes('-')) {
          const parts = dateText.split('-').map(p => p.trim());
          const firstPart = parts[0];
          
          // Extract the month abbreviation and day
          const monthMatch = firstPart.match(/([A-Za-z]+)\s+(\d+)/);
          
          if (monthMatch) {
            const monthAbbr = monthMatch[1].toUpperCase();
            const day = parseInt(monthMatch[2], 10);
            
            // Convert month abbreviation to number
            const months = {
              'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'APR': 4, 
              'MAY': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'AUG': 8,
              'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12, 'DEC': 12
            };
            
            const month = months[monthAbbr] || 1;
            
            // Use current year as default, adjust for December (previous year)
            let year = new Date().getFullYear();
            if (month === 12 && new Date().getMonth() < 11) {
              year--;
            }
            
            result.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
        }
        // Format: APRIL 04, 2025 (direct date)
        else if (dateText.includes(',')) {
          const date = new Date(dateText);
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString().split('T')[0];
          }
        }
        // Format: 2023-05-01 (ISO date)
        else if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
          result.date = dateText;
        }
      }
    } catch (error) {
      console.error('Error parsing filename date:', error);
    }
    
    return result;
  }
  
  /**
   * Create the dropdown for sorting
   */
  function createSortDropdown() {
    const container = document.getElementById('unmastered-dropdown-container');
    if (!container) {
      console.log('Dropdown container not found, waiting for React to render...');
      return null;
    }
    
    const dropdown = document.createElement('select');
    dropdown.className = 'bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded retro-btn';
    dropdown.style.borderColor = '#00a651';
    dropdown.innerHTML = `
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
    `;
    
    dropdown.addEventListener('change', (e) => {
      if (window.unmasteredTracks) {
        renderUnmasteredTracks(window.unmasteredTracks, e.target.value);
      }
    });
    
    container.innerHTML = '';
    container.appendChild(dropdown);
    
    return dropdown;
  }
  
  /**
   * Render the track buttons in the container
   * @param {Array} tracks - Array of track objects
   * @param {string} sort - Sort order ('newest' or 'oldest')
   */
  function renderUnmasteredTracks(tracks, sort = 'newest') {
    const container = document.querySelector(unmasteredConfig.containerSelector);
    
    if (!container) {
      console.error(`Container not found: ${unmasteredConfig.containerSelector}`);
      return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Sort tracks by modifiedTime (last modified date)
    const sortedTracks = [...tracks];
    if (sort === 'newest') {
      sortedTracks.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    } else {
      sortedTracks.sort((a, b) => new Date(a.modifiedTime) - new Date(b.modifiedTime));
    }
    
    if (sortedTracks.length === 0) {
      container.innerHTML = '<p class="text-center py-8 text-gray-400">No audio tracks are currently available.</p>';
      return;
    }
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8';
    container.appendChild(grid);
    
    // Create a button for each track
    sortedTracks.forEach(track => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-lg text-center cursor-pointer transition-transform hover:scale-105';
      card.style.border = '2px solid #00a651';
      card.style.boxShadow = '4px 4px 0px #00a651';
      card.style.background = 'rgba(26, 26, 26, 0.7)';
      
      // Add click handler to open the audio player
      card.addEventListener('click', () => openAudioPlayer(track));
      
      // Create card content with file name in center and formatted date below
      card.innerHTML = `
        <div class="relative mb-2" style="padding-bottom: 120%">
          <img 
            src="images/RetroTrack.png" 
            alt="${track.displayName || track.name}"
            class="absolute top-0 left-0 w-full h-full object-cover rounded"
          />
          <div class="absolute inset-0 flex items-center justify-center p-2">
            <div class="bg-black bg-opacity-70 text-white p-2 rounded max-w-full">
              <div class="break-words text-sm">${track.name.replace('.mp3', '')}</div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-400">
          ${formatDisplayDate(track.modifiedTime)}
        </p>
      `;
      
      grid.appendChild(card);
    });
  }
  
  /**
   * Open the audio player modal
   * @param {Object} track - Track object
   */
  function openAudioPlayer(track) {
    // Create modal container if it doesn't exist
    let modal = document.getElementById('audio-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'audio-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center z-50';
      document.body.appendChild(modal);
    }
    
    // Set modal content with an iframe for better audio playback
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black bg-opacity-90" id="modal-backdrop"></div>
      <div class="relative bg-gray-900 rounded-lg w-full max-w-2xl mx-4 flex flex-col" style="border: 2px solid #00a651">
        <div class="flex justify-between items-center p-3 border-b border-gray-700">
          <h3 class="text-xl font-bold">${track.displayName || track.name.replace('.mp3', '')}</h3>
          <button id="close-modal-btn" class="text-gray-400 hover:text-white focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="flex-grow p-4 flex flex-col items-center justify-center">
          <img 
            src="images/RetroTrack.png" 
            alt="${track.displayName || track.name}"
            class="w-48 h-48 mb-4 rounded"
          />
          
          <iframe 
            src="https://drive.google.com/file/d/${track.id}/preview" 
            width="100%" 
            height="80" 
            allow="autoplay"
            class="mb-4"
          ></iframe>
          
          <div class="text-center mt-2">
            <p class="text-sm text-gray-400">
              If the audio doesn't play automatically, you can also:
            </p>
          </div>
        </div>
        
        <div class="flex justify-center p-2 border-t border-gray-700">
          <a 
            href="https://drive.google.com/file/d/${track.id}/view" 
            target="_blank" 
            rel="noopener noreferrer"
            class="px-4 py-2 bg-gray-800 text-white rounded mx-2 hover:bg-gray-700 transition-colors"
            style="border: 1px solid #00a651"
          >
            Open in Drive
          </a>
          <a 
            href="${track.downloadUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="px-4 py-2 bg-gray-800 text-white rounded mx-2 hover:bg-gray-700 transition-colors"
            style="border: 1px solid #00a651"
          >
            Download
          </a>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('modal-backdrop').addEventListener('click', closeAudioPlayer);
    document.getElementById('close-modal-btn').addEventListener('click', closeAudioPlayer);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Close the audio player modal
   */
  function closeAudioPlayer() {
    const modal = document.getElementById('audio-modal');
    if (modal) {
      modal.style.display = 'none';
      
      // Re-enable scrolling
      document.body.style.overflow = '';
    }
  }
  
  /**
   * Initialize the untitled unmastered section when the tab is activated
   * @param {string} sort - Sort order ('newest' or 'oldest')
   */
  async function initializeUnmasteredSection(sort = 'newest') {
    const container = document.querySelector(unmasteredConfig.containerSelector);
    
    if (!container) {
      console.error(`Container not found: ${unmasteredConfig.containerSelector}`);
      return;
    }
    
    // Show loading indicator
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
        <p class="text-gray-400">Loading tracks...</p>
      </div>
    `;
    
    try {
      // Fetch tracks from Google Drive
      const tracks = await fetchUnmasteredTracks();
      
      // Save tracks in a global variable for sorting
      window.unmasteredTracks = tracks;
      
      // Create the dropdown after we have the data
      setTimeout(() => {
        const dropdown = createSortDropdown();
        if (dropdown) {
          dropdown.value = sort;
        }
      }, 100);
      
      // Render tracks
      renderUnmasteredTracks(tracks, sort);
    } catch (error) {
      console.error('Error initializing untitled unmastered section:', error);
      container.innerHTML = '<p class="text-center py-8 text-red-500">Error loading tracks. Please try again later.</p>';
    }
  }
  
  // Event handling for tab navigation
  document.addEventListener('DOMContentLoaded', function() {
    // Find the untitled unmastered tab link
    const tabLinks = document.querySelectorAll('a[href="#unmastered"]');
    if (tabLinks.length > 0) {
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Initialize untitled unmastered section when tab is clicked
          setTimeout(() => {
            initializeUnmasteredSection('newest');
          }, 100);
        });
      });
    }
    
    // Check if the untitled unmastered tab is active on page load
    const activeTab = document.querySelector('a.active[href="#unmastered"], a[style*="color: #00a651"][href="#unmastered"]');
    if (activeTab) {
      setTimeout(() => {
        initializeUnmasteredSection('newest');
      }, 100);
    }
  });
  
  // Export functions for global access
  window.unmastered = {
    initialize: initializeUnmasteredSection,
    fetchTracks: fetchUnmasteredTracks,
    renderTracks: renderUnmasteredTracks,
    openPlayer: openAudioPlayer,
    closePlayer: closeAudioPlayer
  };
