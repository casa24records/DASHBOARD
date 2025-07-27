// Analytics Dashboard Module - Integrated version
window.AnalyticsDashboard = (function() {
    'use strict';

    // Module state
    const state = {
        charts: {
            followers: null,
            youtube: null,
            popularity: null,
            monthlyListeners: null
        },
        currentArtist: null,
        currentTimeRange: 'all',
        data: null,
        platformAvailability: null,
        initialized: false
    };

    // Chart.js default configuration
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0e0',
                    padding: 15,
                    font: {
                        family: "'Space Mono', monospace",
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 26, 26, 0.95)',
                borderColor: '#00a651',
                borderWidth: 2,
                titleColor: '#ffffff',
                bodyColor: '#e0e0e0',
                padding: 12,
                displayColors: true,
                titleFont: {
                    family: "'VT323', monospace",
                    size: 16
                },
                bodyFont: {
                    family: "'Space Mono', monospace",
                    size: 12
                },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += AnalyticsDataProcessor.formatNumber(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MMM d'
                    }
                },
                grid: {
                    color: 'rgba(224, 224, 224, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#e0e0e0',
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        family: "'Space Mono', monospace",
                        size: 10
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(224, 224, 224, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#e0e0e0',
                    font: {
                        family: "'Space Mono', monospace",
                        size: 10
                    },
                    callback: function(value) {
                        return AnalyticsDataProcessor.formatNumber(value);
                    }
                }
            }
        },
        spanGaps: true
    };

    // Initialize the dashboard
    async function init() {
        try {
            // Check if already initialized
            if (state.initialized) {
                // If switching back to tab, just refresh display
                renderDashboard();
                return;
            }

            showLoading(true);

            // Create container structure if it doesn't exist
            createContainerStructure();

            // Add animation styles
            injectAnimationStyles();

            // Load data
            await AnalyticsDataProcessor.loadHistoricalData();
            await AnalyticsDataProcessor.loadCSVData();

            // Populate artist dropdown
            populateArtistDropdown();

            // Set up event listeners
            setupEventListeners();

            // Update last updated time
            updateLastUpdated();

            // Select first artist by default
            const artists = AnalyticsDataProcessor.getArtistNames();
            if (artists.length > 0) {
                const dropdown = document.getElementById('analyticsArtistSelect');
                if (dropdown) {
                    dropdown.value = artists[0];
                    selectArtist(artists[0]);
                }
            }

            state.initialized = true;
            showLoading(false);
        } catch (error) {
            console.error('Analytics Dashboard initialization error:', error);
            showLoading(false);
            showError('Failed to load analytics data. Please refresh the page.');
        }
    }

    // Create container structure
    function createContainerStructure() {
        const container = document.getElementById('analytics-dashboard-container');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-dashboard">
                <!-- Header -->
                <div class="dashboard-header text-center mb-8">
                    <h2 class="text-4xl font-bold mb-2" style="color: #00a651">Analytics Dashboard</h2>
                    <p class="text-lg text-gray-400">Historical Performance Tracking</p>
                    <div class="artist-selector mt-6">
                        <label for="analyticsArtistSelect" class="text-sm text-gray-500 mr-2">Select Artist:</label>
                        <select id="analyticsArtistSelect" class="artist-dropdown bg-gray-800 border-2 text-white py-2 px-4 rounded"
                                style="border-color: #00a651; min-width: 200px;">
                            <option value="">Loading artists...</option>
                        </select>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="dashboard-main">
                    <!-- Overview Cards -->
                    <section class="metrics-grid stat-grid" id="analyticsMetricsGrid">
                        <!-- Metric cards will be dynamically created -->
                    </section>

                    <!-- Time Range Selector -->
                    <section class="controls-section">
                        <div class="time-range-selector">
                            <button class="time-range-btn retro-btn active" data-range="all">All Time</button>
                            <button class="time-range-btn retro-btn" data-range="90">90 Days</button>
                            <button class="time-range-btn retro-btn" data-range="30">30 Days</button>
                            <button class="time-range-btn retro-btn" data-range="7">7 Days</button>
                        </div>
                        <div class="last-updated text-sm text-gray-500">
                            Last updated: <span id="analyticsLastUpdated">--</span>
                        </div>
                    </section>

                    <!-- Charts Section -->
                    <section class="charts-grid">
                        <!-- Charts will be dynamically created -->
                    </section>

                    <!-- Top Tracks Section -->
                    <section class="top-tracks-section stat-box platform-section" id="analyticsTopTracksSection" data-platform="spotify" style="display: none;">
                        <h3 class="text-2xl font-bold mb-4">Top Tracks</h3>
                        <div class="tracks-grid" id="analyticsTracksGrid">
                            <!-- Tracks will be populated dynamically -->
                        </div>
                    </section>
                </div>

                <!-- Loading Overlay -->
                <div class="loading-overlay hidden" id="analyticsLoadingOverlay">
                    <div class="loading-spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            </div>
        `;
    }

    // Inject custom animation styles
    function injectAnimationStyles() {
        if (document.getElementById('analytics-dashboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'analytics-dashboard-styles';
        style.innerHTML = `
            /* Analytics Dashboard Specific Styles */
            .analytics-dashboard {
                position: relative;
            }
            
            .analytics-dashboard .controls-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .analytics-dashboard .time-range-selector {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .analytics-dashboard .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .analytics-dashboard .charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .analytics-dashboard .chart-card {
                position: relative;
                min-height: 350px;
            }
            
            .analytics-dashboard .chart-card canvas {
                max-height: 300px;
            }
            
            .analytics-dashboard .tracks-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .analytics-dashboard .track-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.3s ease;
            }
            
            .analytics-dashboard .track-item:hover {
                background-color: rgba(0, 166, 81, 0.1);
            }
            
            .analytics-dashboard .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(26, 26, 26, 0.95);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 100;
                border-radius: 0.5rem;
            }
            
            .analytics-dashboard .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid #2a2a3e;
                border-top-color: #00a651;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .analytics-dashboard .metrics-grid {
                    grid-template-columns: 1fr;
                }
                
                .analytics-dashboard .charts-grid {
                    grid-template-columns: 1fr;
                }
                
                .analytics-dashboard .controls-section {
                    justify-content: center;
                }
                
                .analytics-dashboard .time-range-selector {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Format artist names
    function formatArtistName(name) {
        if (name === 'Casa 24Beats') {
            return 'Casa 24 Beats';
        }
        return name;
    }

    // Populate artist dropdown
    function populateArtistDropdown() {
        const select = document.getElementById('analyticsArtistSelect');
        if (!select) return;

        const artists = AnalyticsDataProcessor.getArtistNames();

        select.innerHTML = '';
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = formatArtistName(artist);
            select.appendChild(option);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        // Artist selection
        const artistSelect = document.getElementById('analyticsArtistSelect');
        if (artistSelect) {
            artistSelect.addEventListener('change', (e) => {
                selectArtist(e.target.value);
            });
        }

        // Time range buttons
        document.querySelectorAll('.analytics-dashboard .time-range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                selectTimeRange(range);
            });
        });
    }

    // Select artist
    function selectArtist(artistName) {
        if (!artistName) return;

        state.currentArtist = artistName;
        state.data = AnalyticsDataProcessor.processArtistData(artistName, state.currentTimeRange);
        state.platformAvailability = state.data.platformAvailability;
        
        updateSectionVisibility();
        
        const main = document.querySelector('.analytics-dashboard .dashboard-main');
        if (main) {
            main.classList.add('fade-in');
            setTimeout(() => main.classList.remove('fade-in'), 400);
        }

        updateMetricsCards();
        updateCharts();
        updateTopTracks();
    }

    // Select time range
    function selectTimeRange(range) {
        state.currentTimeRange = range;

        document.querySelectorAll('.analytics-dashboard .time-range-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.analytics-dashboard [data-range="${range}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        if (state.currentArtist) {
            selectArtist(state.currentArtist);
        }
    }

    // Update section visibility
    function updateSectionVisibility() {
        const availability = state.platformAvailability;
        
        updateMetricCardVisibility();
        
        const chartsGrid = document.querySelector('.analytics-dashboard .charts-grid');
        if (chartsGrid) {
            chartsGrid.innerHTML = '';
            
            if (availability.hasSpotify) {
                chartsGrid.appendChild(createChartCard('Followers Growth', 'followersChart', 'spotify'));
                chartsGrid.appendChild(createChartCard('Popularity Trend', 'popularityChart', 'spotify'));
            }
            
            if (availability.hasYouTube) {
                chartsGrid.appendChild(createChartCard('YouTube Performance', 'youtubeChart', 'youtube'));
            }
            
            if (availability.hasMonthlyListeners) {
                chartsGrid.appendChild(createChartCard('Monthly Listeners', 'monthlyListenersChart', 'monthly_listeners'));
            }
        }
        
        const topTracksSection = document.getElementById('analyticsTopTracksSection');
        if (topTracksSection) {
            topTracksSection.style.display = availability.hasSpotify ? 'block' : 'none';
        }
    }

    // Create chart card
    function createChartCard(title, canvasId, type) {
        const card = document.createElement('div');
        card.className = 'chart-card stat-box platform-section';
        card.setAttribute('data-chart', type);
        card.style.border = '2px solid #00a651';
        card.style.boxShadow = '4px 4px 0px #00a651';
        card.style.background = 'rgba(26, 26, 26, 0.7)';
        card.style.padding = '1.5rem';
        card.style.borderRadius = '0.5rem';
        
        card.innerHTML = `
            <h3 class="text-2xl font-bold mb-4">${title}</h3>
            <canvas id="${canvasId}"></canvas>
        `;
        
        return card;
    }

    // Update metric card visibility
    function updateMetricCardVisibility() {
        const availability = state.platformAvailability;
        const metricsGrid = document.getElementById('analyticsMetricsGrid');
        if (!metricsGrid) return;
        
        metricsGrid.innerHTML = '';
        
        if (availability.hasSpotify) {
            metricsGrid.appendChild(createMetricCard(
                'Spotify Followers',
                'analyticsSpotifyFollowers',
                '#1DB954'
            ));
        }
        
        if (availability.hasYouTube) {
            metricsGrid.appendChild(createMetricCard(
                'YouTube Subscribers',
                'analyticsYoutubeSubscribers',
                '#FF0000'
            ));
            
            metricsGrid.appendChild(createMetricCard(
                'YouTube Total Views',
                'analyticsYoutubeTotalViews',
                '#FF0000'
            ));
        }
        
        if (availability.hasSpotify) {
            metricsGrid.appendChild(createMetricCard(
                'Popularity Score',
                'analyticsPopularityScore',
                '#9B59B6',
                true
            ));
        }
        
        if (availability.hasMonthlyListeners) {
            metricsGrid.appendChild(createMetricCard(
                'Monthly Listeners',
                'analyticsMonthlyListeners',
                '#1DB954'
            ));
        }
    }

    // Create metric card
    function createMetricCard(title, metricId, dotColor, isScore = false) {
        const card = document.createElement('div');
        card.className = 'metric-card stat-box';
        card.style.border = '2px solid #00a651';
        card.style.boxShadow = '4px 4px 0px #00a651';
        card.style.background = 'rgba(26, 26, 26, 0.7)';
        card.style.padding = '1.5rem';
        card.style.borderRadius = '0.5rem';
        
        card.innerHTML = `
            <h3 class="text-lg text-gray-400 mb-1">${title}</h3>
            <div class="stat-content">
                <div class="stat-dot" style="background: ${dotColor}"></div>
                <div class="metric-value stat-value text-3xl font-bold">
                    <span id="${metricId}">--</span>
                    ${isScore ? '<span class="text-xl ml-1">/100</span>' : ''}
                </div>
            </div>
            <div class="metric-change text-sm font-medium mt-2" id="${metricId}Change">--</div>
        `;
        
        return card;
    }

    // Update metrics cards
    function updateMetricsCards() {
        const data = state.data;
        if (!data) return;

        const availability = state.platformAvailability;

        if (availability.hasSpotify) {
            updateMetricValue('analyticsSpotifyFollowers', data.latestMetrics.spotifyFollowers, data.previousMetrics.spotifyFollowers);
        }

        if (availability.hasYouTube) {
            updateMetricValue('analyticsYoutubeSubscribers', data.latestMetrics.youtubeSubscribers, data.previousMetrics.youtubeSubscribers);
            updateMetricValue('analyticsYoutubeTotalViews', data.latestMetrics.youtubeTotalViews, data.previousMetrics.youtubeTotalViews);
        }

        if (availability.hasSpotify) {
            const popScore = document.getElementById('analyticsPopularityScore');
            const popChange = document.getElementById('analyticsPopularityScoreChange');
            
            if (popScore) {
                popScore.textContent = data.latestMetrics.popularityScore;
                
                const change = data.latestMetrics.popularityScore - data.previousMetrics.popularityScore;
                if (popChange) {
                    if (change > 0) {
                        popChange.textContent = `+${change} pts`;
                        popChange.className = 'metric-change text-sm font-medium mt-2 text-green-500';
                    } else if (change < 0) {
                        popChange.textContent = `${change} pts`;
                        popChange.className = 'metric-change text-sm font-medium mt-2 text-red-500';
                    } else {
                        popChange.textContent = 'No change';
                        popChange.className = 'metric-change text-sm font-medium mt-2 text-gray-500';
                    }
                }
            }
        }

        if (availability.hasMonthlyListeners) {
            updateMetricValue('analyticsMonthlyListeners', data.latestMetrics.monthlyListeners, data.previousMetrics.monthlyListeners);
        }
    }

    // Update metric value
    function updateMetricValue(elementId, currentValue, previousValue) {
        const valueElement = document.getElementById(elementId);
        const changeElement = document.getElementById(elementId + 'Change');
        
        if (valueElement) {
            valueElement.textContent = AnalyticsDataProcessor.formatNumber(currentValue);
        }
        
        if (changeElement) {
            const changePercent = AnalyticsDataProcessor.calculateChange(currentValue, previousValue);
            
            if (changePercent > 0) {
                changeElement.textContent = `+${changePercent}% vs 7 days ago`;
                changeElement.className = 'metric-change text-sm font-medium mt-2 text-green-500';
            } else if (changePercent < 0) {
                changeElement.textContent = `${changePercent}% vs 7 days ago`;
                changeElement.className = 'metric-change text-sm font-medium mt-2 text-red-500';
            } else {
                changeElement.textContent = 'No change';
                changeElement.className = 'metric-change text-sm font-medium mt-2 text-gray-500';
            }
        }
    }

    // Update all charts
    function updateCharts() {
        const availability = state.platformAvailability;
        
        // Need to wait for DOM to update
        setTimeout(() => {
            if (availability.hasSpotify) {
                updateFollowersChart();
                updatePopularityChart();
            }
            
            if (availability.hasYouTube) {
                updateYouTubeChart();
            }
            
            if (availability.hasMonthlyListeners) {
                updateMonthlyListenersChart();
            }
        }, 100);
    }

    // Update followers chart
    function updateFollowersChart() {
        const canvas = document.getElementById('followersChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = state.data;

        if (state.charts.followers) {
            state.charts.followers.destroy();
        }

        const filteredData = filterChartData(data.dates, data.spotifyFollowers);

        state.charts.followers = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredData.dates,
                datasets: [{
                    label: 'Spotify Followers',
                    data: filteredData.values,
                    borderColor: '#1DB954',
                    backgroundColor: 'rgba(29, 185, 84, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#1DB954',
                    pointHoverBorderColor: '#1DB954',
                    pointHoverBorderWidth: 2,
                    spanGaps: true
                }]
            },
            options: chartDefaults
        });
    }

    // Update YouTube chart
    function updateYouTubeChart() {
        const canvas = document.getElementById('youtubeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = state.data;

        if (state.charts.youtube) {
            state.charts.youtube.destroy();
        }

        const subscribersData = filterChartData(data.dates, data.youtubeSubscribers);
        const viewsData = filterChartData(data.dates, data.youtubeTotalViews);

        state.charts.youtube = new Chart(ctx, {
            type: 'line',
            data: {
                labels: subscribersData.dates,
                datasets: [
                    {
                        label: 'Subscribers',
                        data: subscribersData.values,
                        borderColor: '#FF0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#FF0000',
                        pointHoverBorderColor: '#FF0000',
                        pointHoverBorderWidth: 2,
                        yAxisID: 'y',
                        spanGaps: true
                    },
                    {
                        label: 'Total Views',
                        data: viewsData.values,
                        borderColor: '#FF6B6B',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#FF6B6B',
                        pointHoverBorderColor: '#FF6B6B',
                        pointHoverBorderWidth: 2,
                        yAxisID: 'y1',
                        spanGaps: true
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    y: {
                        ...chartDefaults.scales.y,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Subscribers',
                            color: '#e0e0e0',
                            font: {
                                family: "'Space Mono', monospace",
                                size: 12
                            }
                        }
                    },
                    y1: {
                        ...chartDefaults.scales.y,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Total Views',
                            color: '#e0e0e0',
                            font: {
                                family: "'Space Mono', monospace",
                                size: 12
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    // Update popularity chart
    function updatePopularityChart() {
        const canvas = document.getElementById('popularityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = state.data;

        if (state.charts.popularity) {
            state.charts.popularity.destroy();
        }

        const filteredData = filterChartData(data.dates, data.popularityScore);

        state.charts.popularity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredData.dates,
                datasets: [{
                    label: 'Popularity Score',
                    data: filteredData.values,
                    borderColor: '#9B59B6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#9B59B6',
                    pointHoverBorderColor: '#9B59B6',
                    pointHoverBorderWidth: 2,
                    spanGaps: true
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    ...chartDefaults.scales,
                    y: {
                        ...chartDefaults.scales.y,
                        max: 100,
                        ticks: {
                            ...chartDefaults.scales.y.ticks,
                            callback: function(value) {
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Update monthly listeners chart
    function updateMonthlyListenersChart() {
        const canvas = document.getElementById('monthlyListenersChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = state.data;

        if (state.charts.monthlyListeners) {
            state.charts.monthlyListeners.destroy();
        }

        const filteredData = filterChartData(data.dates, data.monthlyListeners);

        state.charts.monthlyListeners = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredData.dates,
                datasets: [{
                    label: 'Monthly Listeners',
                    data: filteredData.values,
                    borderColor: '#3498DB',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#3498DB',
                    pointHoverBorderColor: '#3498DB',
                    pointHoverBorderWidth: 2,
                    spanGaps: true
                }]
            },
            options: chartDefaults
        });
    }

    // Filter chart data
    function filterChartData(dates, values) {
        let firstValidIndex = -1;
        for (let i = 0; i < values.length; i++) {
            if (values[i] !== null && values[i] !== undefined) {
                firstValidIndex = i;
                break;
            }
        }

        if (firstValidIndex === -1) {
            return { dates: [], values: [] };
        }

        return {
            dates: dates.slice(firstValidIndex),
            values: values.slice(firstValidIndex)
        };
    }

    // Update top tracks
    function updateTopTracks() {
        const data = state.data;
        const tracksGrid = document.getElementById('analyticsTracksGrid');
        const tracksSection = document.getElementById('analyticsTopTracksSection');

        if (!tracksSection || !state.platformAvailability.hasSpotify) return;

        if (!data.topTracks || data.topTracks.length === 0) {
            tracksSection.style.display = 'none';
            return;
        }

        tracksSection.style.display = 'block';
        if (tracksGrid) {
            tracksGrid.innerHTML = '';

            data.topTracks.forEach((track, index) => {
                const trackElement = document.createElement('div');
                trackElement.className = 'track-item';
                trackElement.innerHTML = `
                    <span class="track-number text-gray-500 text-sm">${index + 1}</span>
                    <span class="track-name text-sm flex-1">${track.name}</span>
                    <span class="track-popularity text-green-500 text-xs font-medium">${track.popularity}</span>
                `;
                tracksGrid.appendChild(trackElement);
            });
        }
    }

    // Update last updated time
    function updateLastUpdated() {
        const lastUpdated = document.getElementById('analyticsLastUpdated');
        const latestDate = AnalyticsDataProcessor.getLatestUpdateDate();
        
        if (lastUpdated && latestDate) {
            const formatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });
            lastUpdated.textContent = formatter.format(latestDate);
        }
    }

    // Show/hide loading overlay
    function showLoading(show) {
        const overlay = document.getElementById('analyticsLoadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
                const loadingText = overlay.querySelector('p');
                if (loadingText) {
                    loadingText.innerHTML = `
                        <div class="text-2xl font-bold mb-2" style="color: #00a651; font-family: 'VT323', monospace;">LOADING ANALYTICS...</div>
                        <div class="text-sm text-gray-400">Analyzing the data vibes...</div>
                    `;
                }
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    // Show error message
    function showError(message) {
        const container = document.getElementById('analytics-dashboard-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-500 text-lg mb-2">Error</div>
                    <div class="text-gray-400">${message}</div>
                </div>
            `;
        }
    }

    // Render dashboard
    function renderDashboard() {
        const container = document.getElementById('analytics-dashboard-container');
        if (!container || !state.initialized) return;

        // Re-select current artist to refresh display
        if (state.currentArtist) {
            selectArtist(state.currentArtist);
        }
    }

    // Public API
    return {
        init: init
    };
})();
