/**
 * Unmastered Player v2 - Improved Version
 * 
 * - Added caching to reduce API calls
 * - Fixed memory leaks with proper cleanup
 * - Improved error handling
 * - Better performance with debouncing and optimized DOM updates
 * - Added retry logic for failed requests
 * - Improved accessibility
 * - Cleaner code structure
 */

const UnmasteredPlayer = (() => {
  // Configuration
  const config = {
    apiKey: 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk', // TODO: Move to backend proxy
    folderId: '12JmF908-4lELxUroNiUtycvicatw1J2X',
    containerSelector: '#untitled-unmastered-container',
    dropdownSelector: '#unmastered-dropdown-container',
    loreBasePath: './songs/',
    defaultImage: 'images/RetroTrack.png',
    accentColor: '#00a651',
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000,
    queryParams: {
      mimeType: "mimeType='audio/mpeg'",
      orderBy: 'createdTime desc',
      pageSize: 50,
      fields: 'files(id,name,createdTime,webViewLink,modifiedTime)'
    }
  };

  // State management
  const state = {
    tracks: [],
    currentTrack: null,
    currentSort: 'newest',
    isLoading: false,
    error: null,
    cache: new Map(),
    activeModal: null,
    eventListeners: new WeakMap(),
    abortController: null
  };

  // Cache management
  const cache = {
    set(key, value) {
      state.cache.set(key, {
        value,
        timestamp: Date.now()
      });
    },
    
    get(key) {
      const item = state.cache.get(key);
      if (!item) return null;
      
      if (Date.now() - item.timestamp > config.cacheTimeout) {
        state.cache.delete(key);
        return null;
      }
      
      return item.value;
    },
    
    clear() {
      state.cache.clear();
    }
  };

  // Utility functions
  const utils = {
    formatDate(dateString) {
      if (!dateString) return 'Date unavailable';
      
      try {
        const date = new Date(dateString);
        const formatter = new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        
        return formatter.format(date).toLowerCase().replace(',', '');
      } catch {
        return 'Date unavailable';
      }
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    async retry(fn, attempts = config.retryAttempts, delay = config.retryDelay) {
      try {
        return await fn();
      } catch (error) {
        if (attempts <= 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return utils.retry(fn, attempts - 1, delay * 2);
      }
    },

    extractDateFromFilename(filename) {
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
                'ENE': 1, 'JAN': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'APR': 4,
                'MAY': 5, 'JUN': 6, 'JUL': 7, 'AGO': 8, 'AUG': 8,
                'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12, 'DEC': 12
              };
              
              const month = monthMap[monthMatch[1].toUpperCase()] || 1;
              const day = parseInt(monthMatch[2], 10);
              const currentDate = new Date();
              let year = currentDate.getFullYear();
              
              // Adjust year if the date might be from the previous year
              if (month === 12 && currentDate.getMonth() < 11) {
                year--;
              }
              
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
        console.warn('Error parsing date from filename:', filename, error);
      }
      
      return result;
    }
  };

  // API functions
  const api = {
    async fetchTracks() {
      // Check cache first
      const cachedTracks = cache.get('tracks');
      if (cachedTracks) {
        console.log('Using cached tracks');
        return cachedTracks;
      }

      // Cancel any existing request
      if (state.abortController) {
        state.abortController.abort();
      }

      state.abortController = new AbortController();

      try {
        const params = new URLSearchParams({
          key: config.apiKey,
          q: `'${config.folderId}' in parents and ${config.queryParams.mimeType}`,
          orderBy: config.queryParams.orderBy,
          pageSize: config.queryParams.pageSize,
          fields: config.queryParams.fields
        });
        
        const response = await utils.retry(async () => {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
            signal: state.abortController.signal
          });
          
          if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
          
          return res;
        });
        
        const data = await response.json();
        
        const tracks = data.files.map(file => {
          const { date, displayName } = utils.extractDateFromFilename(file.name);
          
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
        
        // Cache the results
        cache.set('tracks', tracks);
        
        return tracks;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was cancelled');
          return state.tracks; // Return existing tracks
        }
        throw error;
      } finally {
        state.abortController = null;
      }
    },

    async fetchLore(trackName) {
      const cacheKey = `lore_${trackName}`;
      const cachedLore = cache.get(cacheKey);
      
      if (cachedLore !== null) {
        return cachedLore;
      }

      try {
        const baseFileName = trackName.replace('.mp3', '');
        const loreFileName = `${baseFileName}.md`;
        const encodedFileName = encodeURIComponent(loreFileName);
        const loreUrl = `${config.loreBasePath}${encodedFileName}`;
        
        const response = await fetch(loreUrl);
        
        if (response.ok) {
          const content = await response.text();
          cache.set(cacheKey, content);
          return content;
        } else {
          cache.set(cacheKey, null);
          return null;
        }
      } catch (error) {
        console.warn(`Failed to fetch lore for ${trackName}:`, error.message);
        cache.set(cacheKey, null);
        return null;
      }
    }
  };

  // Markdown parser
  const parseMarkdown = (markdown) => {
    if (!markdown) return '';
    
    // Use DOMPurify if available for security
    const sanitize = window.DOMPurify ? window.DOMPurify.sanitize : (html) => html;
    
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
    
    // Wrap in paragraph tags if needed
    if (!html.match(/^<[hp]/)) {
      html = `<p class="mb-4 text-gray-300 leading-relaxed">${html}</p>`;
    }
    
    return sanitize(html);
  };

  // DOM rendering functions
  const dom = {
    createTrackCard(track) {
      const card = document.createElement('div');
      card.className = 'unmastered-card p-4 rounded-lg cursor-pointer border-2 border-accent bg-gray-900/70';
      card.dataset.trackId = track.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Play ${track.displayName}`);
      
      card.innerHTML = `
        <div class="track-title">${utils.escapeHtml(track.displayName)}</div>
        <div class="relative mb-3 overflow-hidden rounded-lg" style="padding-bottom: 100%">
          <img src="${config.defaultImage}" 
               alt="${utils.escapeHtml(track.displayName)}"
               loading="lazy"
               class="absolute top-0 left-0 w-full h-full object-cover" />
        </div>
        <p class="text-sm text-gray-400 text-center">
          <time datetime="${track.modifiedTime}">${utils.formatDate(track.modifiedTime)}</time>
        </p>
      `;
      
      return card;
    },

    renderTracks() {
      const container = document.querySelector(config.containerSelector);
      if (!container) return;
      
      // Sort tracks
      const sorted = [...state.tracks].sort((a, b) => {
        const dateA = new Date(a.modifiedTime);
        const dateB = new Date(b.modifiedTime);
        return state.currentSort === 'newest' ? dateB - dateA : dateA - dateB;
      });
      
      if (sorted.length === 0) {
        container.innerHTML = `
          <div class="text-center py-16 text-gray-400 text-lg" role="status">
            No audio tracks are currently available.
          </div>
        `;
        return;
      }
      
      // Create grid container
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8';
      
      // Use DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      
      sorted.forEach(track => {
        const card = dom.createTrackCard(track);
        
        // Add event listeners
        const handleClick = (e) => {
          if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          player.openModal(track);
        };
        
        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', handleClick);
        
        // Store listener reference for cleanup
        state.eventListeners.set(card, handleClick);
        
        fragment.appendChild(card);
      });
      
      grid.appendChild(fragment);
      container.innerHTML = '';
      container.appendChild(grid);
    },

    showLoading() {
      const container = document.querySelector(config.containerSelector);
      if (!container) return;
      
      container.innerHTML = `
        <div class="text-center py-16" role="status" aria-live="polite">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4" aria-hidden="true"></div>
          <p class="text-gray-400 text-lg">Loading tracks...</p>
        </div>
      `;
    },

    showError(message) {
      const container = document.querySelector(config.containerSelector);
      if (!container) return;
      
      container.innerHTML = `
        <div class="text-center py-16" role="alert">
          <p class="text-red-400 text-lg mb-4">${utils.escapeHtml(message)}</p>
          <button class="px-4 py-2 bg-accent text-white rounded hover:bg-opacity-90 transition-colors" 
                  onclick="window.unmastered.initialize()">
            Retry
          </button>
        </div>
      `;
    },

    createDropdown() {
      const container = document.querySelector(config.dropdownSelector);
      if (!container) return null;
      
      // Check if dropdown already exists
      const existing = container.querySelector('select');
      if (existing) {
        existing.value = state.currentSort;
        return existing;
      }
      
      const select = document.createElement('select');
      select.className = 'bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded cursor-pointer hover:bg-gray-700 transition-colors';
      select.setAttribute('aria-label', 'Sort tracks');
      select.innerHTML = `
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      `;
      
      select.value = state.currentSort;
      
      select.addEventListener('change', utils.debounce((e) => {
        state.currentSort = e.target.value;
        dom.renderTracks();
      }, 300));
      
      container.innerHTML = '';
      container.appendChild(select);
      
      return select;
    }
  };

  // Modal management
  const modal = {
    async open(track) {
      // Close existing modal if any
      modal.close();
      
      state.currentTrack = track;
      
      // Create modal element
      const modalEl = document.createElement('div');
      modalEl.id = 'audio-modal';
      modalEl.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
      modalEl.setAttribute('role', 'dialog');
      modalEl.setAttribute('aria-modal', 'true');
      modalEl.setAttribute('aria-labelledby', 'modal-title');
      
      // Show loading state
      modalEl.innerHTML = `
        <div class="modal-overlay absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div class="relative bg-gray-900 rounded-xl p-8" role="status" aria-live="polite">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          <span class="sr-only">Loading player...</span>
        </div>
      `;
      
      document.body.appendChild(modalEl);
      document.body.style.overflow = 'hidden';
      state.activeModal = modalEl;
      
      // Fetch lore content
      const loreContent = await api.fetchLore(track.name);
      const hasLore = loreContent && loreContent.trim().length > 0;
      
      // Update modal with content
      modalEl.innerHTML = `
        <div class="modal-overlay absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        <div class="relative bg-gray-900 rounded-xl w-full max-w-2xl border-2 border-accent shadow-2xl flex flex-col" style="max-height: 90vh; max-height: 90dvh;">
          <!-- Header -->
          <div class="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
            <h3 id="modal-title" class="text-xl font-bold text-white">${utils.escapeHtml(track.displayName)}</h3>
            <button class="close-btn text-gray-400 hover:text-white transition-colors p-2" 
                    aria-label="Close player">
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
                   alt="${utils.escapeHtml(track.displayName)}"
                   class="w-48 h-48 mx-auto mb-6 rounded-lg shadow-xl" />
              
              <iframe src="${track.previewUrl}" 
                      width="100%" 
                      height="80" 
                      allow="autoplay"
                      title="Audio player for ${utils.escapeHtml(track.displayName)}"
                      class="mb-4 rounded-lg overflow-hidden"></iframe>
              
              ${hasLore ? `
                <button class="lore-toggle mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg inline-flex items-center"
                        aria-expanded="false"
                        aria-controls="lore-content">
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
            
            <!-- Lore Section -->
            ${hasLore ? `
              <div id="lore-content" class="lore-section px-6 pb-6" aria-hidden="true">
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
      
      // Set up event handlers
      modal.attachEventHandlers(modalEl, hasLore);
      
      // Focus management for accessibility
      const closeBtn = modalEl.querySelector('.close-btn');
      closeBtn?.focus();
    },

    attachEventHandlers(modalEl, hasLore) {
      const closeBtn = modalEl.querySelector('.close-btn');
      const overlay = modalEl.querySelector('.modal-overlay');
      const loreToggle = modalEl.querySelector('.lore-toggle');
      const loreSection = modalEl.querySelector('.lore-section');
      
      // Close handlers
      const closeModal = () => modal.close();
      
      closeBtn?.addEventListener('click', closeModal);
      overlay?.addEventListener('click', closeModal);
      
      // Escape key handler
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      // Store handler for cleanup
      modalEl._escapeHandler = escapeHandler;
      
      // Lore toggle
      if (loreToggle && loreSection) {
        loreToggle.addEventListener('click', () => {
          const isExpanded = loreToggle.getAttribute('aria-expanded') === 'true';
          
          loreToggle.setAttribute('aria-expanded', !isExpanded);
          loreSection.setAttribute('aria-hidden', isExpanded);
          loreSection.classList.toggle('active');
          
          // Update button text and icon
          const icon = loreToggle.querySelector('svg path');
          const text = loreToggle.querySelector('span');
          
          if (!isExpanded) {
            icon?.setAttribute('d', 'M5 15l7-7 7 7');
            text.textContent = 'Hide Lore';
          } else {
            icon?.setAttribute('d', 'M19 9l-7 7-7-7');
            text.textContent = 'View Lore';
          }
        });
      }
    },

    close() {
      const modalEl = state.activeModal;
      if (!modalEl) return;
      
      // Remove escape handler
      if (modalEl._escapeHandler) {
        document.removeEventListener('keydown', modalEl._escapeHandler);
      }
      
      // Remove modal
      modalEl.remove();
      document.body.style.overflow = '';
      
      state.activeModal = null;
      state.currentTrack = null;
    }
  };

  // Player object with public methods
  const player = {
    async initialize(sort = 'newest') {
      state.currentSort = sort;
      const container = document.querySelector(config.containerSelector);
      
      if (!container) {
        console.error(`Container not found: ${config.containerSelector}`);
        return;
      }
      
      // Inject styles if not already present
      player.injectStyles();
      
      // Show loading
      dom.showLoading();
      
      try {
        state.isLoading = true;
        state.tracks = await api.fetchTracks();
        
        // Create/update dropdown
        dom.createDropdown();
        
        // Render tracks
        dom.renderTracks();
        
        state.error = null;
      } catch (error) {
        console.error('Error initializing:', error);
        state.error = 'Failed to load tracks. Please try again.';
        dom.showError(state.error);
      } finally {
        state.isLoading = false;
      }
    },

    injectStyles() {
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
        
        .unmastered-card:focus {
          outline: 2px solid ${config.accentColor};
          outline-offset: 2px;
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
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .lore-section.active {
          max-height: 2000px;
          opacity: 1;
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
        
        /* Accessibility improvements */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        /* Mobile-specific fixes for iOS */
        @supports (-webkit-touch-callout: none) {
          .modal-scroll-wrapper {
            -webkit-transform: translateZ(0);
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .unmastered-card,
          .modal-overlay,
          .lore-section {
            animation: none;
            transition: none;
          }
        }
      `;
      
      document.head.appendChild(styles);
    },

    openModal: modal.open,

    cleanup() {
      // Cancel any pending requests
      if (state.abortController) {
        state.abortController.abort();
      }
      
      // Close modal if open
      modal.close();
      
      // Clear cache
      cache.clear();
      
      // Remove event listeners (WeakMap handles most cleanup automatically)
      const container = document.querySelector(config.containerSelector);
      if (container) {
        container.innerHTML = '';
      }
    },

    // Expose useful methods for debugging
    getState: () => ({ ...state }),
    clearCache: () => cache.clear(),
    refreshTracks: () => {
      cache.clear();
      return player.initialize(state.currentSort);
    }
  };

  // Set up initialization handlers
  document.addEventListener('DOMContentLoaded', () => {
    // Tab click handlers
    document.querySelectorAll('a[href="#unmastered"]').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => player.initialize(state.currentSort), 100);
      });
    });
    
    // Check if tab is active on load
    const activeTab = document.querySelector('a.active[href="#unmastered"], a[style*="color: #00a651"][href="#unmastered"]');
    if (activeTab) {
      setTimeout(() => player.initialize(), 100);
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    player.cleanup();
  });

  // Return public API
  return player;
})();

// Export for global access
window.unmastered = UnmasteredPlayer;
