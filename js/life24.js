/**
 * Life@24 Dynamic Magazine Viewer - Mobile Optimized Version
 * 
 * Features:
 * - Magazine thumbnail previews
 * - Fullscreen/expanded view
 * - Mobile-first responsive design
 * - Touch-friendly interface
 * - Date-based sorting (Newest/Oldest first)
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

// Cache for thumbnails
const thumbnailCache = new Map();

// Detect if user is on mobile
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth < 768;
}

/**
 * Generate thumbnail URL for Google Drive PDF
 */
function getThumbnailUrl(fileId) {
  if (thumbnailCache.has(fileId)) {
    return thumbnailCache.get(fileId);
  }
  
  // Use different sizes for mobile vs desktop
  const size = isMobileDevice() ? 'w300-h450' : 'w400-h600';
  const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  
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
      
      // Handle date ranges
      if (dateText.includes('-')) {
        const parts = dateText.split('-').map(p => p.trim());
        const firstPart = parts[0];
        const monthMatch = firstPart.match(/([A-Za-z]+)\s+(\d+)/);
        
        if (monthMatch) {
          const monthName = monthMatch[1].toUpperCase();
          const day = parseInt(monthMatch[2], 10);
          const month = monthMap[monthName] || 1;
          
          const currentDate = new Date();
          let year = currentDate.getFullYear();
          
          if (month > currentDate.getMonth() + 1) {
            year--;
          }
          
          result.dateObj = new Date(year, month - 1, day);
          result.date = result.dateObj.toISOString().split('T')[0];
        }
      }
      // Handle full dates
      else if (dateText.includes(',')) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          result.dateObj = parsedDate;
          result.date = parsedDate.toISOString().split('T')[0];
        }
      }
      // Handle month-day format
      else {
        const monthMatch = dateText.match(/([A-Za-z]+)\s+(\d+)/);
        if (monthMatch) {
          const monthName = monthMatch[1].toUpperCase();
          const day = parseInt(monthMatch[2], 10);
          const month = monthMap[monthName] || 1;
          
          const currentDate = new Date();
          let year = currentDate.getFullYear();
          
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
  
  if (!result.dateObj) {
    result.dateObj = new Date();
  }
  
  return result;
}

/**
 * Fetch magazines from Google Drive
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
          viewUrl: `https://drive.google.com/file/d/${file.id}/view`,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime || file.createdTime
        };
      });
    
    magazines.sort((a, b) => b.dateObj - a.dateObj);
    
    return magazines;
  } catch (error) {
    console.error('Error fetching magazines:', error);
    return [];
  }
}

/**
 * Create dropdown controls - mobile optimized
 */
function createDropdownContainers() {
  const container = document.getElementById('life24-dropdown-container');
  if (!container) {
    console.log('Dropdown container not found, waiting for React to render...');
    return null;
  }
  
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'flex justify-center mb-6 px-2 sm:px-0';
  
  // Sort dropdown only
  const sortDropdown = document.createElement('select');
  sortDropdown.id = 'life24-sort-dropdown';
  sortDropdown.className = 'bg-gray-800 border-2 border-accent text-white py-3 px-4 rounded retro-btn transition-all hover:bg-gray-700 text-sm sm:text-base';
  sortDropdown.style.borderColor = '#00a651';
  sortDropdown.innerHTML = `
    <option value="newest">Newest first</option>
    <option value="oldest">Oldest first</option>
  `;
  
  // Add event listener with debouncing
  let updateTimeout;
  const updateMagazines = () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      if (window.life24Magazines) {
        renderLife24Magazines(window.life24Magazines, sortDropdown.value);
      }
    }, 150);
  };
  
  sortDropdown.addEventListener('change', updateMagazines);
  
  wrapper.appendChild(sortDropdown);
  container.appendChild(wrapper);
  
  return { sortDropdown };
}

/**
 * Create magazine card - mobile optimized
 */
function createMagazineCard(magazine) {
  const card = document.createElement('div');
  card.className = 'group relative p-3 sm:p-4 rounded-lg text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg';
  card.style.cssText = `
    border: 2px solid #00a651;
    box-shadow: 4px 4px 0px #00a651;
    background: rgba(26, 26, 26, 0.9);
  `;
  
  // Thumbnail container
  const thumbnailContainer = document.createElement('div');
  thumbnailContainer.className = 'relative mb-2 sm:mb-3 overflow-hidden rounded-lg bg-gray-800';
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
  thumbnail.loading = 'lazy'; // Lazy loading for performance
  
  thumbnail.onload = () => {
    thumbnail.classList.add('opacity-100');
    loadingSpinner.remove();
  };
  
  thumbnail.onerror = () => {
    loadingSpinner.innerHTML = `
      <svg class="w-12 h-12 sm:w-16 sm:h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"/>
      </svg>
    `;
  };
  
  thumbnail.src = magazine.thumbnailUrl;
  thumbnailContainer.appendChild(thumbnail);
  
  // Hover overlay - hidden on mobile
  const hoverOverlay = document.createElement('div');
  hoverOverlay.className = 'hidden sm:flex absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 items-center justify-center';
  hoverOverlay.innerHTML = `
    <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
      View Magazine
    </span>
  `;
  thumbnailContainer.appendChild(hoverOverlay);
  
  // Magazine info - Date subtitle removed
  const info = document.createElement('div');
  info.className = 'space-y-1';
  info.innerHTML = `
    <h3 class="text-xs sm:text-sm font-semibold text-white break-words line-clamp-2">
      ${magazine.displayName || magazine.name.replace('.pdf', '')}
    </h3>
  `;
  
  card.appendChild(thumbnailContainer);
  card.appendChild(info);
  
  // Touch-friendly click handler
  card.addEventListener('click', () => openMagazineViewer(magazine));
  
  return card;
}

/**
 * Render magazines - mobile optimized grid
 */
async function renderLife24Magazines(magazines, sort = 'newest') {
  const container = document.querySelector(life24Config.containerSelector);
  
  if (!container) {
    console.error(`Container not found: ${life24Config.containerSelector}`);
    return;
  }
  
  container.innerHTML = '';
  
  // Sort magazines
  const sortedMagazines = [...magazines];
  sortedMagazines.sort((a, b) => {
    const comparison = b.dateObj - a.dateObj;
    return sort === 'newest' ? comparison : -comparison;
  });
  
  if (sortedMagazines.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 sm:py-12 px-4">
        <p class="text-gray-400 text-base sm:text-lg">No magazine issues found.</p>
      </div>
    `;
    return;
  }
  
  // Create responsive grid
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0';
  container.appendChild(grid);
  
  // Render with staggered animation
  sortedMagazines.forEach((magazine, index) => {
    const card = createMagazineCard(magazine);
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    grid.appendChild(card);
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, Math.min(index * 30, 300)); // Cap animation delay on mobile
  });
}

/**
 * Open magazine viewer - fullscreen optimized for mobile and desktop
 */
function openMagazineViewer(magazine) {
  let modal = document.getElementById('magazine-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'magazine-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
    document.body.appendChild(modal);
  }
  
  const isMobile = isMobileDevice();
  
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black ${isMobile ? 'bg-opacity-100' : 'bg-opacity-95 backdrop-blur-sm'}" id="modal-backdrop"></div>
    <div class="relative bg-gray-900 ${isMobile ? 'w-full h-full' : 'rounded-lg w-full h-full max-w-[95vw] max-h-[95vh]'} flex flex-col shadow-2xl" style="border: ${isMobile ? 'none' : '3px solid #00a651'}">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gray-900">
        <h3 class="text-base sm:text-xl font-bold text-white truncate pr-4 max-w-[70%]">
          ${magazine.displayName || magazine.name.replace('.pdf', '')}
        </h3>
        <div class="flex items-center gap-2">
          <!-- Fullscreen button - desktop only -->
          <button id="fullscreen-btn" class="hidden sm:block text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
          <!-- Close button -->
          <button id="close-modal-btn" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- PDF Viewer -->
      <div class="flex-grow overflow-hidden bg-gray-950">
        <iframe 
          src="${magazine.previewUrl}" 
          class="w-full h-full border-0"
          title="${magazine.name}"
          allowFullScreen
        ></iframe>
      </div>
      
      <!-- Action buttons -->
      <div class="flex justify-center gap-3 p-3 sm:p-4 border-t border-gray-700 bg-gray-900">
        <a 
          href="${magazine.viewUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gray-800 text-white text-sm sm:text-base rounded-lg hover:bg-gray-700 transition-all hover:scale-105 touch-manipulation"
          style="border: 2px solid #00a651"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          <span class="hidden sm:inline">Open in Drive</span>
          <span class="sm:hidden">Drive</span>
        </a>
        <a 
          href="${magazine.downloadUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gray-800 text-white text-sm sm:text-base rounded-lg hover:bg-gray-700 transition-all hover:scale-105 touch-manipulation"
          style="border: 2px solid #00a651"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>Download</span>
        </a>
      </div>
    </div>
  `;
  
  // Event listeners
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('close-modal-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  backdrop.addEventListener('click', closeMagazineViewer);
  closeBtn.addEventListener('click', closeMagazineViewer);
  
  // Fullscreen toggle
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(err => {
          console.log(`Error attempting fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }
  
  // Keyboard support
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeMagazineViewer();
    }
  };
  document.addEventListener('keydown', handleKeydown);
  modal.dataset.keyHandler = handleKeydown.toString();
  
  // Show modal with animation
  modal.style.display = 'flex';
  modal.style.opacity = '0';
  requestAnimationFrame(() => {
    modal.style.transition = 'opacity 0.3s ease';
    modal.style.opacity = '1';
  });
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  // Add touch gestures for mobile (swipe down to close)
  if (isMobile) {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const modalContent = modal.querySelector('.relative');
    
    modalContent.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    modalContent.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      if (touchStartY < touchEndY - 50) { // Swipe down
        closeMagazineViewer();
      }
    }, { passive: true });
  }
}

/**
 * Close magazine viewer
 */
function closeMagazineViewer() {
  const modal = document.getElementById('magazine-modal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.remove();
    }, 300);
    
    document.body.style.overflow = '';
    
    // Remove event listeners
    const handleKeydown = modal.dataset.keyHandler;
    if (handleKeydown) {
      document.removeEventListener('keydown', eval(`(${handleKeydown})`));
    }
  }
}

/**
 * Initialize Life@24 section
 */
async function initializeLife24Section(sort = 'newest') {
  const container = document.querySelector(life24Config.containerSelector);
  
  if (!container) {
    console.error(`Container not found: ${life24Config.containerSelector}`);
    return;
  }
  
  // Mobile-friendly loading UI
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 px-4">
      <div class="relative">
        <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-gray-700"></div>
        <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent absolute inset-0"></div>
      </div>
      <p class="text-gray-400 text-base sm:text-lg animate-pulse text-center">Loading Life@24 magazines...</p>
    </div>
  `;
  
  try {
    // Fetch magazines
    const magazines = await fetchLife24Magazines();
    
    // Store globally
    window.life24Magazines = magazines;
    
    // Create dropdowns
    setTimeout(() => {
      const dropdowns = createDropdownContainers();
      if (dropdowns) {
        dropdowns.sortDropdown.value = sort;
      }
    }, 100);
    
    // Render magazines
    await renderLife24Magazines(magazines, sort);
  } catch (error) {
    console.error('Error initializing Life@24 section:', error);
    container.innerHTML = `
      <div class="text-center py-12 sm:py-16 px-4">
        <div class="text-red-500 mb-4">
          <svg class="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-red-500 text-base sm:text-lg mb-2">Error loading magazines</p>
        <p class="text-gray-400 text-sm sm:text-base">Please check your connection and try again.</p>
        <button 
          onclick="window.life24.initialize()"
          class="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base touch-manipulation"
          style="border: 2px solid #00a651"
        >
          Retry
        </button>
      </div>
    `;
  }
}

// Event handling
document.addEventListener('DOMContentLoaded', function() {
  // Tab click handlers
  const tabLinks = document.querySelectorAll('a[href="#life"]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      setTimeout(() => {
        initializeLife24Section('newest');
      }, 100);
    });
  });
  
  // Check if Life@24 tab is active on load
  const activeTab = document.querySelector('a.active[href="#life"], a[style*="color: #00a651"][href="#life"]');
  if (activeTab) {
    setTimeout(() => {
      initializeLife24Section('newest');
    }, 100);
  }
  
  // Handle orientation changes on mobile
  if (window.matchMedia) {
    const orientationQuery = window.matchMedia('(orientation: portrait)');
    orientationQuery.addListener(() => {
      // Clear thumbnail cache on orientation change
      thumbnailCache.clear();
      // Re-render if magazines are loaded
      if (window.life24Magazines) {
        const sortDropdown = document.getElementById('life24-sort-dropdown');
        if (sortDropdown) {
          renderLife24Magazines(window.life24Magazines, sortDropdown.value);
        }
      }
    });
  }
});

// Export functions for global access
window.life24 = {
  initialize: initializeLife24Section,
  fetchMagazines: fetchLife24Magazines,
  renderMagazines: renderLife24Magazines,
  openViewer: openMagazineViewer,
  closeViewer: closeMagazineViewer,
  getThumbnailUrl: getThumbnailUrl,
  clearCache: () => thumbnailCache.clear(),
  isMobile: isMobileDevice
};
