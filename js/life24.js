/**
 * Life@24 Dynamic Magazine Viewer - Enhanced Version
 * 
 * Features:
 * - Magazine thumbnail previews instead of folder icons
 * - Improved date filtering using subtitle dates
 * - Performance optimizations
 * - Better error handling
 */

// Configuration
const life24Config = {
  apiKey: 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk',
  folderId: '12p8iE_zMLkzFOgEifhOBGwgSnyla05-s',
  containerSelector: '#life-at-24-container',
  queryParams: {
    q: "mimeType='application/pdf'",
    orderBy: 'createdTime desc',
    pageSize: 50,
    fields: 'files(id,name,createdTime,webViewLink,modifiedTime,thumbnailLink)'
  }
};

// Cache for thumbnails to improve performance
const thumbnailCache = new Map();

/**
 * Generate a thumbnail URL for a Google Drive PDF
 * Uses multiple strategies to get the best quality thumbnail
 */
function getThumbnailUrl(fileId) {
  // Check cache first
  if (thumbnailCache.has(fileId)) {
    return thumbnailCache.get(fileId);
  }
  
  // Google Drive thumbnail URL patterns
  const thumbnailUrls = [
    // High quality thumbnail
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h600`,
    // Alternative thumbnail endpoint
    `https://lh3.googleusercontent.com/d/${fileId}=w400-h600-p`,
    // Fallback to standard thumbnail
    `https://drive.google.com/thumbnail?id=${fileId}`
  ];
  
  // Use the first URL and cache it
  const url = thumbnailUrls[0];
  thumbnailCache.set(fileId, url);
  return url;
}

/**
 * Format date to D-MMM-YYYY format
 */
function formatDisplayDate(dateString) {
  if (!dateString) return 'Date unavailable';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Extract and parse date from filename
 * Enhanced to better handle various date formats
 */
function extractDateFromFilename(filename) {
  const result = {
    date: null,
    dateObj: null,
    displayName: filename.replace('.pdf', '')
  };
  
  try {
    const bracketMatch = filename.match(/\[(.*?)\]/);
    
    if (bracketMatch && bracketMatch[1]) {
      const dateText = bracketMatch[1].trim();
      result.displayName = dateText;
      
      // Month name mappings (including Spanish)
      const monthMap = {
        'ENE': 1, 'JAN': 1, 'JANUARY': 1,
        'FEB': 2, 'FEBRUARY': 2,
        'MAR': 3, 'MARCH': 3,
        'ABR': 4, 'APR': 4, 'APRIL': 4,
        'MAY': 5,
        'JUN': 6, 'JUNE': 6,
        'JUL': 7, 'JULY': 7,
        'AGO': 8, 'AUG': 8, 'AUGUST': 8,
        'SEP': 9, 'SEPT': 9, 'SEPTEMBER': 9,
        'OCT': 10, 'OCTOBER': 10,
        'NOV': 11, 'NOVEMBER': 11,
        'DIC': 12, 'DEC': 12, 'DECEMBER': 12
      };
      
      // Handle date ranges (e.g., "ENE 07 - ENE 12")
      if (dateText.includes('-')) {
        const parts = dateText.split('-').map(p => p.trim());
        const firstPart = parts[0];
        const monthMatch = firstPart.match(/([A-Za-z]+)\s+(\d+)/);
        
        if (monthMatch) {
          const monthName = monthMatch[1].toUpperCase();
          const day = parseInt(monthMatch[2], 10);
          const month = monthMap[monthName] || 1;
          
          // Determine year based on current date and month
          const currentDate = new Date();
          let year = currentDate.getFullYear();
          
          // If the month is in the future, use previous year
          if (month > currentDate.getMonth() + 1) {
            year--;
          }
          
          result.dateObj = new Date(year, month - 1, day);
          result.date = result.dateObj.toISOString().split('T')[0];
        }
      }
      // Handle full dates (e.g., "APRIL 04, 2025")
      else if (dateText.includes(',')) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          result.dateObj = parsedDate;
          result.date = parsedDate.toISOString().split('T')[0];
        }
      }
      // Handle month-day format (e.g., "MAY 5")
      else {
        const monthMatch = dateText.match(/([A-Za-z]+)\s+(\d+)/);
        if (monthMatch) {
          const monthName = monthMatch[1].toUpperCase();
          const day = parseInt(monthMatch[2], 10);
          const month = monthMap[monthName] || 1;
          
          const currentDate = new Date();
          let year = currentDate.getFullYear();
          
          // If the month is in the future, use previous year
          if (month > currentDate.getMonth() + 1) {
            year--;
          }
          
          result.dateObj = new Date(year, month - 1, day);
          result.date = result.dateObj.toISOString().split('T')[0];
        }
      }
    }
  } catch (error) {
    console.error('Error parsing date from filename:', filename, error);
  }
  
  // Fallback to current date if parsing fails
  if (!result.dateObj) {
    result.dateObj = new Date();
  }
  
  return result;
}

/**
 * Fetch magazines from Google Drive with improved error handling
 */
async function fetchLife24Magazines() {
  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('key', life24Config.apiKey);
    url.searchParams.set('q', `'${life24Config.folderId}' in parents and ${life24Config.queryParams.q}`);
    url.searchParams.set('orderBy', life24Config.queryParams.orderBy);
    url.searchParams.set('pageSize', life24Config.queryParams.pageSize);
    url.searchParams.set('fields', life24Config.queryParams.fields);
    
    console.log('Fetching magazines from Google Drive...');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch magazines: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid response format from Google Drive API');
    }
    
    // Process files into magazine objects
    const magazines = data.files
      .filter(file => {
        const name = file.name.toLowerCase();
        return name.includes('life@24') || name.includes('life @24');
      })
      .map(file => {
        const dateInfo = extractDateFromFilename(file.name);
        
        return {
          id: file.id,
          name: file.name,
          date: dateInfo.date,
          dateObj: dateInfo.dateObj,
          displayName: dateInfo.displayName,
          thumbnailUrl: getThumbnailUrl(file.id),
          previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime || file.createdTime
        };
      });
    
    // Sort by the parsed date (newest first)
    magazines.sort((a, b) => b.dateObj - a.dateObj);
    
    return magazines;
  } catch (error) {
    console.error('Error fetching magazines:', error);
    return [];
  }
}

/**
 * Filter magazines based on the parsed subtitle dates
 */
function filterMagazinesByDate(magazines, filterValue) {
  if (filterValue === 'all') {
    return magazines;
  }
  
  const days = parseInt(filterValue, 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return magazines.filter(magazine => {
    // Use the parsed date object for accurate filtering
    return magazine.dateObj >= cutoffDate;
  });
}

/**
 * Create dropdown controls
 */
function createDropdownContainers() {
  const container = document.getElementById('life24-dropdown-container');
  if (!container) {
    console.log('Dropdown container not found, waiting for React to render...');
    return null;
  }
  
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-wrap gap-4 mb-6';
  
  // Filter dropdown
  const filterDropdown = document.createElement('select');
  filterDropdown.id = 'life24-filter-dropdown';
  filterDropdown.className = 'bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded retro-btn transition-all hover:bg-gray-700';
  filterDropdown.style.borderColor = '#00a651';
  filterDropdown.innerHTML = `
    <option value="all">All time</option>
    <option value="7">Last 7 days</option>
    <option value="30">Last 30 days</option>
    <option value="90">Last 90 days</option>
  `;
  
  // Sort dropdown
  const sortDropdown = document.createElement('select');
  sortDropdown.id = 'life24-sort-dropdown';
  sortDropdown.className = 'bg-gray-800 border-2 border-accent text-white py-2 px-4 rounded retro-btn transition-all hover:bg-gray-700';
  sortDropdown.style.borderColor = '#00a651';
  sortDropdown.innerHTML = `
    <option value="newest">Newest first</option>
    <option value="oldest">Oldest first</option>
  `;
  
  // Add event listeners with debouncing
  let updateTimeout;
  const updateMagazines = () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      if (window.life24Magazines) {
        renderLife24Magazines(window.life24Magazines, sortDropdown.value, filterDropdown.value);
      }
    }, 150);
  };
  
  filterDropdown.addEventListener('change', updateMagazines);
  sortDropdown.addEventListener('change', updateMagazines);
  
  wrapper.appendChild(filterDropdown);
  wrapper.appendChild(sortDropdown);
  container.appendChild(wrapper);
  
  return { filterDropdown, sortDropdown };
}

/**
 * Preload images for better performance
 */
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Create a magazine card element with thumbnail
 */
function createMagazineCard(magazine) {
  const card = document.createElement('div');
  card.className = 'group relative p-4 rounded-lg text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg';
  card.style.cssText = `
    border: 2px solid #00a651;
    box-shadow: 4px 4px 0px #00a651;
    background: rgba(26, 26, 26, 0.9);
  `;
  
  // Create thumbnail container with loading state
  const thumbnailContainer = document.createElement('div');
  thumbnailContainer.className = 'relative mb-3 overflow-hidden rounded-lg bg-gray-800';
  thumbnailContainer.style.paddingBottom = '141.4%'; // A4 aspect ratio
  
  // Loading spinner
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'absolute inset-0 flex items-center justify-center';
  loadingSpinner.innerHTML = `
    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
  `;
  thumbnailContainer.appendChild(loadingSpinner);
  
  // Thumbnail image
  const thumbnail = document.createElement('img');
  thumbnail.className = 'absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300';
  thumbnail.alt = magazine.displayName || magazine.name;
  
  // Load thumbnail with fallback
  thumbnail.onload = () => {
    thumbnail.classList.add('opacity-100');
    loadingSpinner.remove();
  };
  
  thumbnail.onerror = () => {
    // Fallback to a PDF icon if thumbnail fails
    loadingSpinner.innerHTML = `
      <svg class="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"/>
      </svg>
    `;
  };
  
  thumbnail.src = magazine.thumbnailUrl;
  thumbnailContainer.appendChild(thumbnail);
  
  // Hover overlay
  const hoverOverlay = document.createElement('div');
  hoverOverlay.className = 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center';
  hoverOverlay.innerHTML = `
    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
      View Magazine
    </span>
  `;
  thumbnailContainer.appendChild(hoverOverlay);
  
  // Magazine info
  const info = document.createElement('div');
  info.className = 'space-y-1';
  info.innerHTML = `
    <h3 class="text-sm font-semibold text-white break-words line-clamp-2">
      ${magazine.displayName || magazine.name.replace('.pdf', '')}
    </h3>
    <p class="text-xs text-gray-400">
      ${magazine.date ? formatDisplayDate(magazine.date) : formatDisplayDate(magazine.modifiedTime)}
    </p>
  `;
  
  card.appendChild(thumbnailContainer);
  card.appendChild(info);
  
  // Click handler
  card.addEventListener('click', () => openMagazineViewer(magazine));
  
  return card;
}

/**
 * Render magazines with improved performance
 */
async function renderLife24Magazines(magazines, sort = 'newest', filter = 'all') {
  const container = document.querySelector(life24Config.containerSelector);
  
  if (!container) {
    console.error(`Container not found: ${life24Config.containerSelector}`);
    return;
  }
  
  container.innerHTML = '';
  
  // Filter magazines by date
  let filteredMagazines = filterMagazinesByDate(magazines, filter);
  
  // Sort magazines
  filteredMagazines.sort((a, b) => {
    const comparison = b.dateObj - a.dateObj;
    return sort === 'newest' ? comparison : -comparison;
  });
  
  if (filteredMagazines.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-400 text-lg">No magazine issues found for the selected time period.</p>
      </div>
    `;
    return;
  }
  
  // Create grid container
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
  container.appendChild(grid);
  
  // Render magazines with staggered animation
  filteredMagazines.forEach((magazine, index) => {
    const card = createMagazineCard(magazine);
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    grid.appendChild(card);
    
    // Staggered fade-in animation
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

/**
 * Open magazine viewer modal with improved UI
 */
function openMagazineViewer(magazine) {
  let modal = document.getElementById('magazine-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'magazine-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-95 backdrop-blur-sm" id="modal-backdrop"></div>
    <div class="relative bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl" style="border: 3px solid #00a651">
      <div class="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 class="text-xl font-bold text-white truncate pr-4">
          ${magazine.displayName || magazine.name.replace('.pdf', '')}
        </h3>
        <button id="close-modal-btn" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="flex-grow overflow-hidden bg-gray-950">
        <iframe 
          src="${magazine.previewUrl}" 
          class="w-full h-full border-0"
          title="${magazine.name}"
          allowFullScreen
        ></iframe>
      </div>
      
      <div class="flex justify-center gap-4 p-4 border-t border-gray-700">
        <a 
          href="https://drive.google.com/file/d/${magazine.id}/view" 
          target="_blank" 
          rel="noopener noreferrer"
          class="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all hover:scale-105"
          style="border: 2px solid #00a651"
        >
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Open in Drive
          </span>
        </a>
        <a 
          href="${magazine.downloadUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all hover:scale-105"
          style="border: 2px solid #00a651"
        >
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Download
          </span>
        </a>
      </div>
    </div>
  `;
  
  // Event listeners
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('close-modal-btn');
  
  backdrop.addEventListener('click', closeMagazineViewer);
  closeBtn.addEventListener('click', closeMagazineViewer);
  
  // Keyboard support
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeMagazineViewer();
    }
  };
  document.addEventListener('keydown', handleEscape);
  modal.dataset.escapeHandler = 'true';
  
  // Show modal with animation
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.classList.add('opacity-100');
  });
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Close magazine viewer modal
 */
function closeMagazineViewer() {
  const modal = document.getElementById('magazine-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Remove escape handler
    if (modal.dataset.escapeHandler) {
      document.removeEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMagazineViewer();
      });
    }
  }
}

/**
 * Initialize the Life@24 section with loading states
 */
async function initializeLife24Section(sort = 'newest', filter = 'all') {
  const container = document.querySelector(life24Config.containerSelector);
  
  if (!container) {
    console.error(`Container not found: ${life24Config.containerSelector}`);
    return;
  }
  
  // Improved loading UI
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 space-y-4">
      <div class="relative">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-700"></div>
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent absolute inset-0"></div>
      </div>
      <p class="text-gray-400 text-lg animate-pulse">Loading Life@24 magazines...</p>
    </div>
  `;
  
  try {
    // Fetch magazines
    const magazines = await fetchLife24Magazines();
    
    // Store globally for filtering/sorting
    window.life24Magazines = magazines;
    
    // Create dropdowns after data loads
    setTimeout(() => {
      const dropdowns = createDropdownContainers();
      if (dropdowns) {
        dropdowns.sortDropdown.value = sort;
        dropdowns.filterDropdown.value = filter;
      }
    }, 100);
    
    // Render magazines
    await renderLife24Magazines(magazines, sort, filter);
  } catch (error) {
    console.error('Error initializing Life@24 section:', error);
    container.innerHTML = `
      <div class="text-center py-16">
        <div class="text-red-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-red-500 text-lg mb-2">Error loading magazines</p>
        <p class="text-gray-400">Please check your connection and try again.</p>
        <button 
          onclick="window.life24.initialize()"
          class="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          style="border: 2px solid #00a651"
        >
          Retry
        </button>
      </div>
    `;
  }
}

// Event handling for tab navigation
document.addEventListener('DOMContentLoaded', function() {
  // Set up tab click handlers
  const tabLinks = document.querySelectorAll('a[href="#life"]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Small delay to ensure tab content is rendered
      setTimeout(() => {
        initializeLife24Section('newest', 'all');
      }, 100);
    });
  });
  
  // Check if Life@24 tab is active on load
  const activeTab = document.querySelector('a.active[href="#life"], a[style*="color: #00a651"][href="#life"]');
  if (activeTab) {
    setTimeout(() => {
      initializeLife24Section('newest', 'all');
    }, 100);
  }
});

// Export functions for global access
window.life24 = {
  initialize: initializeLife24Section,
  fetchMagazines: fetchLife24Magazines,
  renderMagazines: renderLife24Magazines,
  openViewer: openMagazineViewer,
  closeViewer: closeMagazineViewer,
  // Utility functions
  getThumbnailUrl: getThumbnailUrl,
  clearCache: () => thumbnailCache.clear()
};
