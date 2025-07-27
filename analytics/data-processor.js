// Data Processor Module - Updated for proper metric handling
const DataProcessor = {
    // Cache for loaded data
    cache: {
        jsonFiles: [],
        csvData: null,
        processedData: {},
        metricAvailability: null,
        manifest: null
    },

    // Load metric availability data
    async loadMetricAvailability() {
        try {
            const response = await fetch('data/metric_availability.json');
            if (response.ok) {
                const data = await response.json();
                this.cache.metricAvailability = data.artists;
                console.log('Loaded metric availability data');
            }
        } catch (error) {
            console.warn('Metric availability data not found:', error);
        }
    },

    // Load manifest file
    async loadManifest() {
        try {
            const response = await fetch('data/historical/manifest.json');
            if (response.ok) {
                this.cache.manifest = await response.json();
                return this.cache.manifest.files.map(f => `data/historical/${f}`);
            }
        } catch (error) {
            console.warn('Manifest not found, falling back to date range method');
        }
        return null;
    },

    // Load all JSON files from the historical folder
    async loadHistoricalData() {
        try {
            // Load metric availability first
            await this.loadMetricAvailability();

            // Try to load from manifest
            const manifestFiles = await this.loadManifest();
            
            let files;
            if (manifestFiles) {
                console.log('Loading files from manifest...');
                files = manifestFiles;
            } else {
                // Fallback to date range method
                console.log('No manifest found, generating file list...');
                const startDate = new Date('2025-04-26');
                const endDate = new Date();
                files = [];

                // Generate file paths for each day
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    files.push(`data/historical/${dateStr}.json`);
                }
            }

            // Load files in parallel
            const promises = files.map(async (file) => {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        const data = await response.json();
                        return this.cleanDataValues(data);
                    }
                } catch (error) {
                    console.warn(`Failed to load ${file}:`, error);
                }
                return null;
            });

            const results = await Promise.all(promises);
            this.cache.jsonFiles = results.filter(data => data !== null);
            
            console.log(`Loaded ${this.cache.jsonFiles.length} historical files`);
            return this.cache.jsonFiles;
        } catch (error) {
            console.error('Error loading historical data:', error);
            return [];
        }
    },

    // Clean data values, converting invalid entries to null
    cleanDataValues(data) {
        if (!data || !data.artists) return data;

        data.artists.forEach(artist => {
            // Clean Spotify data
            if (artist.spotify) {
                const spotify = artist.spotify;
                
                // Handle monthly_listeners
                if ('monthly_listeners' in spotify) {
                    const listeners = spotify.monthly_listeners;
                    if (listeners === "N/A" || listeners === "" || listeners === null || listeners === undefined) {
                        spotify.monthly_listeners = null;
                    } else if (typeof listeners === 'string') {
                        const parsed = parseInt(listeners.replace(/,/g, ''));
                        spotify.monthly_listeners = isNaN(parsed) ? null : parsed;
                    }
                }

                // Clean numeric fields
                ['followers', 'popularity_score'].forEach(field => {
                    if (field in spotify) {
                        const value = spotify[field];
                        if (value === null || value === undefined || value === "N/A" || value === "") {
                            spotify[field] = null;
                        } else if (typeof value === 'string') {
                            const parsed = parseInt(value.replace(/,/g, ''));
                            spotify[field] = isNaN(parsed) ? null : parsed;
                        }
                    }
                });
            }

            // Clean YouTube data
            if (artist.youtube) {
                const youtube = artist.youtube;
                
                ['subscribers', 'total_views', 'video_count'].forEach(field => {
                    if (field in youtube) {
                        const value = youtube[field];
                        if (value === null || value === undefined || value === "N/A" || value === "") {
                            youtube[field] = null;
                        } else if (typeof value === 'string') {
                            const parsed = parseInt(value.replace(/,/g, ''));
                            youtube[field] = isNaN(parsed) ? null : parsed;
                        }
                    }
                });
            }
        });

        return data;
    },

    // Load CSV data if available
    async loadCSVData() {
        try {
            const response = await fetch('data/popularity_scores.csv');
            if (response.ok) {
                const text = await response.text();
                this.cache.csvData = this.parseCSV(text);
            }
        } catch (error) {
            console.warn('CSV file not found, using JSON data only');
        }
    },

    // Simple CSV parser
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            data.push(entry);
        }

        return data;
    },

    // Get unique artist names
    getArtistNames() {
        const artistSet = new Set();
        this.cache.jsonFiles.forEach(file => {
            if (file && file.artists) {
                file.artists.forEach(artist => {
                    artistSet.add(artist.name);
                });
            }
        });
        return Array.from(artistSet).sort();
    },

    // Check if a metric is available for an artist at a given date
    isMetricAvailable(artistName, platform, metric, date) {
        if (!this.cache.metricAvailability || !this.cache.metricAvailability[artistName]) {
            return false;
        }

        const availability = this.cache.metricAvailability[artistName];
        const firstDate = availability[platform]?.[metric];
        
        if (!firstDate) return false;
        
        return date >= firstDate;
    },

    // Get platform availability for an artist
    getPlatformAvailability(artistName) {
        const availability = {
            hasSpotify: false,
            hasYouTube: false,
            hasMonthlyListeners: false,
            spotifyMetrics: [],
            youtubeMetrics: []
        };

        if (!this.cache.metricAvailability || !this.cache.metricAvailability[artistName]) {
            // Fallback: check from actual data
            this.cache.jsonFiles.forEach(file => {
                if (!file || !file.artists) return;
                
                const artist = file.artists.find(a => a.name === artistName);
                if (!artist) return;

                // Check Spotify
                if (artist.spotify && (artist.spotify.followers > 0 || artist.spotify.popularity_score > 0)) {
                    availability.hasSpotify = true;
                }

                // Check YouTube
                if (artist.youtube && (artist.youtube.subscribers > 0 || artist.youtube.total_views > 0)) {
                    availability.hasYouTube = true;
                }

                // Check monthly listeners
                if (artist.spotify?.monthly_listeners && artist.spotify.monthly_listeners !== null) {
                    availability.hasMonthlyListeners = true;
                }
            });
        } else {
            const metrics = this.cache.metricAvailability[artistName];
            
            // Check Spotify availability
            if (metrics.spotify) {
                availability.spotifyMetrics = Object.keys(metrics.spotify)
                    .filter(key => metrics.spotify[key] !== null);
                availability.hasSpotify = availability.spotifyMetrics.length > 0;
                availability.hasMonthlyListeners = metrics.spotify.monthly_listeners !== null;
            }

            // Check YouTube availability
            if (metrics.youtube) {
                availability.youtubeMetrics = Object.keys(metrics.youtube)
                    .filter(key => metrics.youtube[key] !== null);
                availability.hasYouTube = availability.youtubeMetrics.length > 0;
            }
        }

        return availability;
    },

    // Process data for a specific artist
    processArtistData(artistName, timeRange = 'all') {
        const data = {
            dates: [],
            spotifyFollowers: [],
            youtubeSubscribers: [],
            youtubeTotalViews: [],
            youtubeVideoCount: [],
            popularityScore: [],
            monthlyListeners: [],
            hasSpotifyData: false,
            hasYouTubeData: false,
            hasMonthlyListeners: false,
            latestMetrics: {},
            previousMetrics: {},
            topTracks: [],
            platformAvailability: this.getPlatformAvailability(artistName)
        };

        // Filter data by time range
        const now = new Date();
        const cutoffDate = new Date();
        
        switch(timeRange) {
            case '7':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case '90':
                cutoffDate.setDate(now.getDate() - 90);
                break;
            default:
                cutoffDate.setFullYear(2000); // Include all data
        }

        // Process each file
        this.cache.jsonFiles.forEach(file => {
            if (!file || !file.artists) return;

            const fileDate = new Date(file.date);
            if (fileDate < cutoffDate) return;

            const artist = file.artists.find(a => a.name === artistName);
            if (!artist) return;

            // Add date
            data.dates.push(file.date);

            // Process Spotify data
            if (artist.spotify) {
                // Only add values if the metric was available at this date
                if (this.isMetricAvailable(artistName, 'spotify', 'followers', file.date)) {
                    data.spotifyFollowers.push(artist.spotify.followers);
                    data.hasSpotifyData = true;
                } else {
                    data.spotifyFollowers.push(null);
                }

                if (this.isMetricAvailable(artistName, 'spotify', 'popularity_score', file.date)) {
                    data.popularityScore.push(artist.spotify.popularity_score);
                } else {
                    data.popularityScore.push(null);
                }
                
                if (this.isMetricAvailable(artistName, 'spotify', 'monthly_listeners', file.date)) {
                    const listeners = artist.spotify.monthly_listeners;
                    if (listeners !== null && listeners !== undefined) {
                        data.monthlyListeners.push(listeners);
                        data.hasMonthlyListeners = true;
                    } else {
                        data.monthlyListeners.push(null);
                    }
                } else {
                    data.monthlyListeners.push(null);
                }
            } else {
                data.spotifyFollowers.push(null);
                data.popularityScore.push(null);
                data.monthlyListeners.push(null);
            }

            // Process YouTube data
            if (artist.youtube) {
                if (this.isMetricAvailable(artistName, 'youtube', 'subscribers', file.date)) {
                    data.youtubeSubscribers.push(artist.youtube.subscribers);
                    data.hasYouTubeData = true;
                } else {
                    data.youtubeSubscribers.push(null);
                }

                if (this.isMetricAvailable(artistName, 'youtube', 'total_views', file.date)) {
                    data.youtubeTotalViews.push(artist.youtube.total_views);
                } else {
                    data.youtubeTotalViews.push(null);
                }

                if (this.isMetricAvailable(artistName, 'youtube', 'video_count', file.date)) {
                    data.youtubeVideoCount.push(artist.youtube.video_count);
                } else {
                    data.youtubeVideoCount.push(null);
                }
            } else {
                data.youtubeSubscribers.push(null);
                data.youtubeTotalViews.push(null);
                data.youtubeVideoCount.push(null);
            }
        });

        // Get latest non-null metrics
        if (data.dates.length > 0) {
            const latestIndex = data.dates.length - 1;
            
            // Find latest non-null values
            data.latestMetrics = {
                spotifyFollowers: this.findLatestValue(data.spotifyFollowers) || 0,
                youtubeSubscribers: this.findLatestValue(data.youtubeSubscribers) || 0,
                youtubeTotalViews: this.findLatestValue(data.youtubeTotalViews) || 0,
                popularityScore: this.findLatestValue(data.popularityScore) || 0,
                monthlyListeners: this.findLatestValue(data.monthlyListeners) || 0
            };

            // Find values from 7 days ago (or closest non-null)
            const targetIndex = Math.max(0, latestIndex - 7);
            data.previousMetrics = {
                spotifyFollowers: this.findValueNearIndex(data.spotifyFollowers, targetIndex) || 0,
                youtubeSubscribers: this.findValueNearIndex(data.youtubeSubscribers, targetIndex) || 0,
                youtubeTotalViews: this.findValueNearIndex(data.youtubeTotalViews, targetIndex) || 0,
                popularityScore: this.findValueNearIndex(data.popularityScore, targetIndex) || 0,
                monthlyListeners: this.findValueNearIndex(data.monthlyListeners, targetIndex) || 0
            };

            // Get latest top tracks
            const latestFile = this.cache.jsonFiles.find(f => f.date === data.dates[latestIndex]);
            if (latestFile) {
                const artist = latestFile.artists.find(a => a.name === artistName);
                if (artist && artist.spotify && artist.spotify.top_tracks) {
                    data.topTracks = artist.spotify.top_tracks.slice(0, 5);
                }
            }
        }

        return data;
    },

    // Find the latest non-null value in an array
    findLatestValue(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i] !== null && array[i] !== undefined) {
                return array[i];
            }
        }
        return null;
    },

    // Find a non-null value near a specific index
    findValueNearIndex(array, targetIndex) {
        // First try the exact index
        if (array[targetIndex] !== null && array[targetIndex] !== undefined) {
            return array[targetIndex];
        }

        // Search backwards for the nearest non-null value
        for (let i = targetIndex - 1; i >= 0; i--) {
            if (array[i] !== null && array[i] !== undefined) {
                return array[i];
            }
        }

        // Search forwards if nothing found backwards
        for (let i = targetIndex + 1; i < array.length; i++) {
            if (array[i] !== null && array[i] !== undefined) {
                return array[i];
            }
        }

        return null;
    },

    // Calculate percentage change
    calculateChange(current, previous) {
        if (previous === 0 || previous === null) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    },

    // Format numbers with K/M suffixes
    formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Get the latest update date
    getLatestUpdateDate() {
        if (this.cache.jsonFiles.length === 0) return null;
        
        const dates = this.cache.jsonFiles
            .filter(f => f && f.date)
            .map(f => new Date(f.date));
        
        return new Date(Math.max(...dates));
    }
};
