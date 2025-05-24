/**
 * Life@24 Dynamic Magazine Viewer
 * 
 * This script fetches PDF magazines directly from a public Google Drive folder
 * and displays them in the website, without requiring any file downloads,
 * credentials, or secrets.
 */

// Configuration object
const life24Config = {
    // Google Drive API key (no OAuth required) 
    apiKey: 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk', // Replace with your Google API key
    
    // Your public Google Drive folder ID
    folderId: '12p8iE_zMLkzFOgEifhOBGwgSnyla05-s', // Replace with your folder ID
    
    // CSS selector for the container where the magazines will be displayed
    containerSelector: '#life-at-24-container', 
    
    // Query parameters for the Google Drive API
    queryParams: {
      // Only fetch PDF files
      q: "mimeType='application/pdf'",
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
   * Fetch the list of magazines from Google Drive
   * @returns {Promise<Array>} Array of magazine objects
   */
  async function fetchLife24Magazines() {
    try {
      // Build the URL to fetch files from the folder
      let url = `https://www.googleapis.com/drive/v3/files?key=${life24Config.apiKey}`;
      
      // Add folder query parameter
      url += `&q='${life24Config.folderId}'+in+parents and ${life24Config.queryParams.q}`;
      
      // Add other query parameters
      url += `&orderBy=${life24Config.queryParams.orderBy}`;
      url += `&pageSize=${life24Config.queryParams.pageSize}`;
      url += `&fields=${life24Config.queryParams.fields}`;
      
      console.log('Fetching magazines from Google Drive...');
      
      // Fetch the file list
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch magazines: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the files into magazine objects
      return data.files
        .filter(file => file.name.toLowerCase().includes('life@24') || file.name.toLowerCase().includes('life @24'))
        .map(file => {
          // Extract the date part from filenames like "Life@24 [DATE].pdf"
          const datePart = extractDateFromFilename(file.name);
          
          return {
            id: file.id,
            name: file.name,
            date: datePart.date,
            displayName: datePart.displayName,
            previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime || file.createdTime
          };
        })
        .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    } catch (error) {
      console.error('Error fetching magazines:', error);
      return [];
    }
  }
  
  /**
   * Extract the date part from a filename
   * @param {string} filename - Format: "Life@24 [DATE].pdf"
   * @returns {Object} Object with date and displayName properties
   */
  function extractDateFromFilename(filename) {
    // Default return values
    const result = {
      date: null,
      displayName: filename.replace('.pdf', '')
    };
    
    try {
      // Check if filename contains date in square brackets
      const bracketMatch = filename.match(/\[(.*?)\]/);
      
      if (bracketMatch && bracketMatch[1]) {
        const dateText = bracketMatch[1].trim();
        result.displayName = dateText;
        
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
    const container = document.getElementById('life24-dropdown-container');
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
      if (window.life24Magazines) {
        renderLife24Magazines(window.life24Magazines, e.target.value);
      }
    });
    
    container.innerHTML = '';
    container.appendChild(dropdown);
    
    return dropdown;
  }
  
  /**
   * Render the magazine buttons in the container
   * @param {Array} magazines - Array of magazine objects
   * @param {string} sort - Sort order ('newest' or 'oldest')
   */
  function renderLife24Magazines(magazines, sort = 'newest') {
    const container = document.querySelector(life24Config.containerSelector);
    
    if (!container) {
      console.error(`Container not found: ${life24Config.containerSelector}`);
      return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Sort magazines by modifiedTime (last modified date)
    const sortedMagazines = [...magazines];
    if (sort === 'newest') {
      sortedMagazines.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
    } else {
      sortedMagazines.sort((a, b) => new Date(a.modifiedTime) - new Date(b.modifiedTime));
    }
    
    if (sortedMagazines.length === 0) {
      container.innerHTML = '<p class="text-center py-8 text-gray-400">No magazine issues are currently available.</p>';
      return;
    }
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8';
    container.appendChild(grid);
    
    // Create a button for each magazine
    sortedMagazines.forEach(magazine => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-lg text-center cursor-pointer transition-transform hover:scale-105';
      card.style.border = '2px solid #00a651';
      card.style.boxShadow = '4px 4px 0px #00a651';
      card.style.background = 'rgba(26, 26, 26, 0.7)';
      
      // Add click handler to open the PDF viewer
      card.addEventListener('click', () => openMagazineViewer(magazine));
      
      // Create card content with file name in center and formatted date below
      card.innerHTML = `
        <div class="relative mb-2" style="padding-bottom: 120%">
          <img 
            src="images/RetroFolder.png" 
            alt="${magazine.displayName || magazine.name}"
            class="absolute top-0 left-0 w-full h-full object-cover rounded"
          />
          <div class="absolute inset-0 flex items-center justify-center p-2">
            <div class="bg-black bg-opacity-70 text-white p-2 rounded max-w-full">
              <div class="break-words">${magazine.name.replace('.pdf', '')}</div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-400">
          ${formatDisplayDate(magazine.modifiedTime)}
        </p>
      `;
      
      grid.appendChild(card);
    });
  }
  
  /**
   * Open the magazine viewer modal
   * @param {Object} magazine - Magazine object
   */
  function openMagazineViewer(magazine) {
    // Create modal container if it doesn't exist
    let modal = document.getElementById('magazine-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'magazine-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center z-50';
      document.body.appendChild(modal);
    }
    
    // Set modal content
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black bg-opacity-90" id="modal-backdrop"></div>
      <div class="relative bg-gray-900 rounded-lg w-full h-screen mx-4 flex flex-col" style="border: 2px solid #00a651">
        <div class="flex justify-between items-center p-3 border-b border-gray-700">
          <h3 class="text-xl font-bold">${magazine.displayName || magazine.name.replace('.pdf', '')}</h3>
          <button id="close-modal-btn" class="text-gray-400 hover:text-white focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="flex-grow overflow-hidden">
          <iframe 
            src="${magazine.previewUrl}" 
            class="w-full h-full border-0"
            title="${magazine.name}"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
        
        <div class="flex justify-center p-2 border-t border-gray-700">
          <a 
            href="https://drive.google.com/file/d/${magazine.id}/view" 
            target="_blank" 
            rel="noopener noreferrer"
            class="px-4 py-2 bg-gray-800 text-white rounded mx-2 hover:bg-gray-700 transition-colors"
            style="border: 1px solid #00a651"
          >
            Open in Drive
          </a>
          <a 
            href="${magazine.downloadUrl}" 
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
    document.getElementById('modal-backdrop').addEventListener('click', closeMagazineViewer);
    document.getElementById('close-modal-btn').addEventListener('click', closeMagazineViewer);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Close the magazine viewer modal
   */
  function closeMagazineViewer() {
    const modal = document.getElementById('magazine-modal');
    if (modal) {
      modal.style.display = 'none';
      
      // Re-enable scrolling
      document.body.style.overflow = '';
    }
  }
  
  /**
   * Initialize the Life@24 section when the tab is activated
   * @param {string} sort - Sort order ('newest' or 'oldest')
   */
  async function initializeLife24Section(sort = 'newest') {
    const container = document.querySelector(life24Config.containerSelector);
    
    if (!container) {
      console.error(`Container not found: ${life24Config.containerSelector}`);
      return;
    }
    
    // Show loading indicator
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
        <p class="text-gray-400">Loading magazines...</p>
      </div>
    `;
    
    try {
      // Fetch magazines from Google Drive
      const magazines = await fetchLife24Magazines();
      
      // Save magazines in a global variable for sorting
      window.life24Magazines = magazines;
      
      // Create the dropdown after we have the data
      setTimeout(() => {
        const dropdown = createSortDropdown();
        if (dropdown) {
          dropdown.value = sort;
        }
      }, 100);
      
      // Render magazines
      renderLife24Magazines(magazines, sort);
    } catch (error) {
      console.error('Error initializing Life@24 section:', error);
      container.innerHTML = '<p class="text-center py-8 text-red-500">Error loading magazines. Please try again later.</p>';
    }
  }
  
  // Event handling for tab navigation
  document.addEventListener('DOMContentLoaded', function() {
    // Find the Life@24 tab link
    const tabLinks = document.querySelectorAll('a[href="#life"]');
    if (tabLinks.length > 0) {
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Initialize Life@24 section when tab is clicked
          setTimeout(() => {
            initializeLife24Section('newest');
          }, 100);
        });
      });
    }
    
    // Check if the Life@24 tab is active on page load
    const activeTab = document.querySelector('a.active[href="#life"], a[style*="color: #00a651"][href="#life"]');
    if (activeTab) {
      setTimeout(() => {
        initializeLife24Section('newest');
      }, 100);
    }
  });
  
  // Export functions for global access
  window.life24 = {
    initialize: initializeLife24Section,
    fetchMagazines: fetchLife24Magazines,
    renderMagazines: renderLife24Magazines,
    openViewer: openMagazineViewer,
    closeViewer: closeMagazineViewer
  };
