/**
 * Untitled Unmastered - Modern Audio Player with Lore Support
 * 
 * A dynamic audio player that fetches MP3s from Google Drive and displays
 * associated lore/lyrics from markdown files in the GitHub repository
 */

const UnmasteredPlayer = (() => {
  // Configuration
  const config = {
    apiKey: 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk',
    folderId: '12JmF908-4lELxUroNiUtycvicatw1J2X',
    containerSelector: '#untitled-unmastered-container',
    dropdownSelector: '#unmastered-dropdown-container',
    loreBasePath: './songs/', // Fixed: relative path from the HTML file
    defaultImage: 'images/RetroTrack.png',
    accentColor: '#00a651',
    queryParams: {
      mimeType: "mimeType='audio/mpeg'",
      orderBy: 'createdTime desc',
      pageSize: 50,
      fields: 'files(id,name,createdTime,webViewLink,modifiedTime)'
    }
  };

  // State
  let tracks = [];
  let currentTrack = null;
  let currentSort = 'newest';

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    
    const date = new Date(dateString);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const extractDateFromFilename = (filename) => {
    const result = {
      date: null,
      displayName: filename.replace('.mp3', '')
    };
    
    try {
      const bracketMatch = filename.match(/\[(.*?)\]/);
      
      if (bracketMatch?.[1]) {
        const dateText = bracketMatch[1].trim();
        result.displayName = result.displayName.replace(`[${dateText}]`, '').trim();
        
        // Handle date range format
        if (dateText.includes('-')) {
          const firstPart = dateText.split('-')[0].trim();
          const monthMatch = firstPart.match(/([A-Za-z]+)\s+(\d+)/);
          
          if (monthMatch) {
            const monthMap = {
              'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'APR': 4,
              'MAY': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'AUG': 8,
              'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12, 'DEC': 12
            };
            
            const month = monthMap[monthMatch[1].toUpperCase()] || 1;
            const day = parseInt(monthMatch[2], 10);
            let year = new Date().getFullYear();
            
            if (month === 12 && new Date().getMonth() < 11) year--;
            
            result.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
        }
        // Handle full date format
        else if (dateText.includes(',')) {
          const date = new Date(dateText);
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString().split('T')[0];
          }
        }
        // Handle ISO date format
        else if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
          result.date = dateText;
        }
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return result;
  };

  // Fetch lore content for a track
  const fetchLore = async (trackName) => {
    try {
      // Remove .mp3 extension and create the exact filename match
      const baseFileName = trackName.replace('.mp3', '');
      const loreFileName = `${baseFileName}.md`;
      
      // Encode special characters in the filename
      const encodedFileName = encodeURIComponent(loreFileName);
      
      // Build the full URL - relative to the HTML page location
      const loreUrl = `${config.loreBasePath}${encodedFileName}`;
      
      console.log('Attempting to fetch lore from:', loreUrl);
      console.log('Decoded URL would be:', decodeURIComponent(loreUrl));
      
      const response = await fetch(loreUrl);
      
      if (response.ok) {
        const content = await response.text();
        console.log('Lore content fetched successfully for:', trackName);
        return content;
      } else {
        console.log(`No lore file found for ${trackName} (${response.status})`);
        return null;
      }
    } catch (error) {
      console.log(`Error fetching lore for ${trackName}:`, error.message);
      return null;
    }
  };

  // Enhanced Markdown parser
  const parseMarkdown = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      // Headers
      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mb-2 text-accent">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-3 text-accent">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-4 text-accent">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-5 text-accent">$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold italic">$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
      // Links
      .replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-accent pl-4 italic mb-4">$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="border-gray-700 my-6">')
      // Lists
      .replace(/^\* (.+)$/gim, '<li class="ml-6 mb-1">• $1</li>')
      .replace(/^- (.+)$/gim, '<li class="ml-6 mb-1">• $1</li>')
      .replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-1 list-decimal">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-300 leading-relaxed">');
    
    // Wrap lists
    html = html.replace(/(<li class="ml-6[^>]*>.*<\/li>)(?=\s*(?!<li))/gs, '<ul class="mb-4 text-gray-300">$1</ul>');
    html = html.replace(/(<li class="ml-6[^>]*list-decimal[^>]*>.*<\/li>)(?=\s*(?!<li))/gs, '<ol class="mb-4 list-decimal list-inside text-gray-300">$1</ol>');
    
    // Wrap in paragraph tags if needed
    if (!html.match(/^<[hp]/)) {
      html = `<p class="mb-4 text-gray-300 leading-relaxed">${html}</p>`;
    }
    
    return html;
  };

  // Fetch tracks from Google Drive
  const fetchTracks = async () => {
    try {
      const params = new URLSearchParams({
        key: config.apiKey,
        q: `'${config.folderId}' in parents and ${config.queryParams.mimeType}`,
        orderBy: config.queryParams.orderBy,
        pageSize: config.queryParams.pageSize,
        fields: config.queryParams.fields
      });
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      
      const data = await response.json();
      
      tracks = data.files.map(file => {
        const { date, displayName } = extractDateFromFilename(file.name);
        
        return {
          id: file.id,
          name: file.name,
          date,
          displayName,
          audioUrl: `https://drive.google.com/a/ui/v1/m?id=${file.id}`,
          previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
          viewUrl: `https://drive.google.com/file/d/${file.id}/view`,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime || file.createdTime
        };
      });
      
      return tracks;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  };

  // Create and inject styles
  const injectStyles = () => {
    if (document.getElementById('unmastered-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'unmastered-styles';
    styles.textContent = `
      .unmastered-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
      }
      
      .unmastered-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 166, 81, 0.3);
      }
      
      .unmastered-card .track-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: white;
        text-align: center;
        margin-bottom: 0.75rem;
        padding: 0 0.5rem;
        line-height: 1.2;
        min-height: 2.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-scroll-wrapper {
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
        overflow-x: hidden;
        touch-action: pan-y;
      }
      
      .lore-section {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .lore-section.active {
        max-height: none;
        opacity: 1;
        overflow: visible;
      }
      
      .lore-content {
        animation: fadeInUp 0.6s ease-out;
      }
      
      .modal-scroll-wrapper::-webkit-scrollbar {
        width: 8px;
      }
      
      .modal-scroll-wrapper::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      
      .modal-scroll-wrapper::-webkit-scrollbar-thumb {
        background: ${config.accentColor};
        border-radius: 4px;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .modal-overlay {
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .text-accent {
        color: ${config.accentColor};
      }
      
      .border-accent {
        border-color: ${config.accentColor};
      }
      
      .bg-accent {
        background-color: ${config.accentColor};
      }
      
      .shimmer {
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(0, 166, 81, 0.1) 50%, 
          transparent 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0, 166, 81, 0.3);
        border-radius: 50%;
        border-top-color: ${config.accentColor};
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Mobile-specific fixes for iOS */
      @supports (-webkit-touch-callout: none) {
        .modal-scroll-wrapper {
          -webkit-transform: translateZ(0);
        }
      }
    `;
    
    document.head.appendChild(styles);
  };

  // Create sort dropdown
  const createDropdown = () => {
    const container = document.querySelector(config.dropdownSelector);
    if (!container) return null;
    
    container.innerHTML = `
      <select class="bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded cursor-pointer hover:bg-gray-700 transition-colors">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    `;
    
    const dropdown = container.querySelector('select');
    dropdown.value = currentSort;
    
    dropdown.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderTracks();
    });
    
    return dropdown;
  };

  // Render track grid
  const renderTracks = () => {
    const container = document.querySelector(config.containerSelector);
    if (!container) return;
    
    // Sort tracks
    const sorted = [...tracks].sort((a, b) => {
      const dateA = new Date(a.modifiedTime);
      const dateB = new Date(b.modifiedTime);
      return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    if (sorted.length === 0) {
      container.innerHTML = `
        <p class="text-center py-16 text-gray-400 text-lg">
          No audio tracks are currently available.
        </p>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        ${sorted.map(track => `
          <div class="unmastered-card p-4 rounded-lg cursor-pointer border-2 border-accent bg-gray-900/70"
               data-track-id="${track.id}">
            <div class="track-title">${track.displayName}</div>
            <div class="relative mb-3 overflow-hidden rounded-lg" style="padding-bottom: 100%">
              <img src="${config.defaultImage}" 
                   alt="${track.displayName}"
                   class="absolute top-0 left-0 w-full h-full object-cover" />
            </div>
            <p class="text-sm text-gray-400 text-center">${formatDate(track.modifiedTime)}</p>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add click handlers
    container.querySelectorAll('.unmastered-card').forEach(card => {
      card.addEventListener('click', () => {
        const trackId = card.dataset.trackId;
        const track = tracks.find(t => t.id === trackId);
        if (track) openPlayer(track);
      });
    });
  };

  // Open audio player modal
  const openPlayer = async (track) => {
    currentTrack = track;
    
    // Show loading modal first
    const loadingModal = document.createElement('div');
    loadingModal.id = 'audio-modal';
    loadingModal.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
    loadingModal.innerHTML = `
      <div class="modal-overlay absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div class="relative bg-gray-900 rounded-xl p-8">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    `;
    document.body.appendChild(loadingModal);
    document.body.style.overflow = 'hidden';
    
    // Fetch lore content
    const loreContent = await fetchLore(track.name);
    const hasLore = loreContent && loreContent.trim().length > 0;
    
    // Update modal with content
    loadingModal.innerHTML = `
      <div class="modal-overlay absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div class="relative bg-gray-900 rounded-xl w-full max-w-2xl border-2 border-accent shadow-2xl flex flex-col" style="max-height: 90vh; max-height: 90dvh;">
        <!-- Header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h3 class="text-xl font-bold text-white">${track.displayName}</h3>
          <button class="close-btn text-gray-400 hover:text-white transition-colors p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Scrollable Content -->
        <div class="modal-scroll-wrapper flex-grow" style="overflow-y: auto; -webkit-overflow-scrolling: touch;">
          <!-- Player Section -->
          <div class="p-6 text-center">
            <img src="${config.defaultImage}" 
                 alt="${track.displayName}"
                 class="w-48 h-48 mx-auto mb-6 rounded-lg shadow-xl" />
            
            <iframe src="${track.previewUrl}" 
                    width="100%" 
                    height="80" 
                    allow="autoplay"
                    class="mb-4 rounded-lg overflow-hidden"></iframe>
            
            ${hasLore ? `
              <button class="lore-toggle mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg inline-flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span>View Lore</span>
              </button>
            ` : `
              <p class="text-sm text-gray-400 mt-4">
                If the audio doesn't play automatically, use the buttons below
              </p>
            `}
          </div>
          
          <!-- Lore Section - Only rendered if lore exists -->
          ${hasLore ? `
            <div class="lore-section px-6 pb-6">
              <div class="lore-content bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div class="prose prose-invert max-w-none">
                  ${parseMarkdown(loreContent)}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="flex justify-center gap-4 p-4 border-t border-gray-700 bg-gray-900/80 flex-shrink-0">
          <a href="${track.viewUrl}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 border border-accent">
            Open in Drive
          </a>
          <a href="${track.downloadUrl}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 border border-accent">
            Download
          </a>
        </div>
      </div>
    `;
    
    // Event handlers
    const closeModal = () => {
      loadingModal.remove();
      document.body.style.overflow = '';
      currentTrack = null;
    };
    
    loadingModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    loadingModal.querySelector('.close-btn').addEventListener('click', closeModal);
    
    // Lore toggle functionality
    const loreToggle = loadingModal.querySelector('.lore-toggle');
    const loreSection = loadingModal.querySelector('.lore-section');
    
    if (loreToggle && loreSection) {
      loreToggle.addEventListener('click', () => {
        const isActive = loreSection.classList.contains('active');
        loreSection.classList.toggle('active');
        
        // Update button text and icon
        loreToggle.innerHTML = isActive ? `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          <span>View Lore</span>
        ` : `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
          <span>Hide Lore</span>
        `;
        
        // Force iOS to recalculate scroll
        if (loreSection.classList.contains('active')) {
          const scrollWrapper = loadingModal.querySelector('.modal-scroll-wrapper');
          setTimeout(() => {
            scrollWrapper.scrollTop = scrollWrapper.scrollTop + 1;
            scrollWrapper.scrollTop = scrollWrapper.scrollTop - 1;
          }, 100);
        }
      });
    }
  };

  // Initialize the player
  const initialize = async (sort = 'newest') => {
    currentSort = sort;
    const container = document.querySelector(config.containerSelector);
    
    if (!container) {
      console.error(`Container not found: ${config.containerSelector}`);
      return;
    }
    
    // Inject styles
    injectStyles();
    
    // Show loading
    container.innerHTML = `
      <div class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
        <p class="text-gray-400 text-lg">Loading tracks...</p>
      </div>
    `;
    
    try {
      await fetchTracks();
      
      // Create dropdown after delay to ensure React render
      setTimeout(() => createDropdown(), 100);
      
      renderTracks();
    } catch (error) {
      console.error('Error initializing:', error);
      container.innerHTML = `
        <p class="text-center py-16 text-red-400 text-lg">
          Error loading tracks. Please try again later.
        </p>
      `;
    }
  };

  // Set up event listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Tab click handlers
    document.querySelectorAll('a[href="#unmastered"]').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => initialize(currentSort), 100);
      });
    });
    
    // Check if tab is active on load
    const activeTab = document.querySelector('a.active[href="#unmastered"], a[style*="color: #00a651"][href="#unmastered"]');
    if (activeTab) {
      setTimeout(() => initialize(), 100);
    }
  });

  // Public API
  return {
    initialize,
    fetchTracks,
    renderTracks,
    openPlayer
  };
})();

// Export for global access
window.unmastered = UnmasteredPlayer;
