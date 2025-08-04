/**
 * Main Controller for Casa 24 Records Dashboard
 * Handles navigation and coordinates all section modules
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    sections: {
      collective: {
        id: 'collective',
        name: 'Collective Overview',
        module: 'CollectiveOverview',
        active: true
      },
      life: {
        id: 'life',
        name: 'LIFE@24',
        module: 'life24',
        active: true
      },
      unmastered: {
        id: 'unmastered',
        name: 'untitled unmastered',
        module: 'unmastered',
        active: true
      },
      drumMachine: {
        id: 'drum-machine',
        name: 'Drum Machine',
        module: 'drumMachinePro',
        active: true
      }
    },
    defaultSection: 'collective',
    accentColor: '#00a651'
  };

  // State
  let currentSection = config.defaultSection;
  let initialized = false;

  /**
   * Initialize the main controller
   */
  function initialize() {
    if (initialized) return;
    initialized = true;

    // Set up navigation
    setupNavigation();

    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    const initialSection = (hash && config.sections[hash]) ? hash : config.defaultSection;

    // Initialize default section
    showSection(initialSection);

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
  }

  /**
   * Set up navigation event listeners
   */
  function setupNavigation() {
    // Find all navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
      const sectionId = link.getAttribute('href').substring(1);
      
      // Only attach listeners for active sections
      if (config.sections[sectionId] && config.sections[sectionId].active) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          showSection(sectionId);
        });
      }
    });
  }

  /**
   * Show a specific section
   */
  function showSection(sectionId) {
    if (!config.sections[sectionId] || !config.sections[sectionId].active) {
      console.warn(`Section ${sectionId} is not active or doesn't exist`);
      return;
    }

    // Update current section
    currentSection = sectionId;

    // Update navigation active states
    updateNavigation(sectionId);

    // Hide all sections
    Object.keys(config.sections).forEach(id => {
      const container = document.querySelector(`[data-section="${id}"]`);
      if (container) {
        container.style.display = 'none';
      }
    });

    // Show current section
    const currentContainer = document.querySelector(`[data-section="${sectionId}"]`);
    if (currentContainer) {
      currentContainer.style.display = 'block';
    }

    // IMPORTANT: Force re-initialization for components that need visible containers
    setTimeout(() => {
      initializeSection(sectionId);
    }, 0);

    // Update URL without page reload
    history.pushState({ section: sectionId }, '', `#${sectionId}`);
  }

  /**
   * Update navigation active states
   */
  function updateNavigation(activeSectionId) {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
      const sectionId = link.getAttribute('href').substring(1);
      
      if (sectionId === activeSectionId) {
        link.classList.add('active');
        link.style.color = config.accentColor;
      } else {
        link.classList.remove('active');
        link.style.color = '';
      }
    });
  }

  /**
   * Initialize a specific section module
   */
  function initializeSection(sectionId) {
    const section = config.sections[sectionId];
    if (!section || !section.active) return;

    const module = window[section.module];
    
    if (module && typeof module.initialize === 'function') {
      // Special handling for sections with sort parameters
      if (sectionId === 'life' || sectionId === 'unmastered') {
        module.initialize('newest');
      } else if (sectionId === 'drum-machine') {
        // Force re-initialization for drum machine
        const container = document.getElementById('drum-machine-container');
        if (container) {
          container.innerHTML = ''; // Clear existing content
          module.initialize();
        }
      } else {
        module.initialize();
      }
    } else if (sectionId === 'collective') {
      // Collective Overview uses React and initializes automatically
      // Force a re-render
      if (window.CollectiveOverview && window.CollectiveOverview.refresh) {
        window.CollectiveOverview.refresh();
      } else if (window.CollectiveOverview && window.CollectiveOverview.initialize) {
        window.CollectiveOverview.initialize();
      }
    }
  }

  /**
   * Handle browser back/forward navigation
   */
  function handlePopState(event) {
    if (event.state && event.state.section) {
      showSection(event.state.section);
    } else {
      // Check URL hash
      const hash = window.location.hash.substring(1);
      if (hash && config.sections[hash]) {
        showSection(hash);
      }
    }
  }

  /**
   * Public API
   */
  window.MainController = {
    initialize: initialize,
    showSection: showSection,
    getCurrentSection: () => currentSection,
    getSections: () => config.sections,
    
    // Allow disabling sections dynamically
    disableSection: (sectionId) => {
      if (config.sections[sectionId]) {
        config.sections[sectionId].active = false;
      }
    },
    
    enableSection: (sectionId) => {
      if (config.sections[sectionId]) {
        config.sections[sectionId].active = true;
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
