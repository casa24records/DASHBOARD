  #!/usr/bin/env python3
"""
Robust Spotify and YouTube data collection script with comprehensive error handling
and anti-detection measures for all configured artists.
"""

import base64
import requests
import json
import pandas as pd
from datetime import datetime
import os
import re
import time
import random
import logging
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ------------------ CONFIGURATION ------------------

# Spotify API Credentials
CLIENT_ID = '737e719bb4c4413dab75709796eea4f5'
CLIENT_SECRET = '2257b35c9acb46ea817f4a99cf833a8c'

# YouTube API Key
YOUTUBE_API_KEY = 'AIzaSyCgffLM7bMJ2vqw-VBGaNNJWkMQPEfNfgk'

# List of artists with their platform IDs
artists = [
    {
        'name': 'Casa 24',
        'spotify_id': '2QpRYjtwNg9z6KwD4fhC5h',
        'youtube_id': 'UCshvYG0n1I_gXbM8htuANAg',
    },
    {
        'name': 'Chef Lino',
        'spotify_id': '56tisU5xMB4CYyzG99hyBN',
        'youtube_id': 'UCTH5Cs-r1YShzfARJLQ5Hzw',
    },
    {
        'name': 'PYRO',
        'spotify_id': '5BsYYsSnFsE9SoovY7aQV0',
        'youtube_id': None,
    },
    {
        'name': 'bo.wlie',
        'spotify_id': '2DqDBHhQzNE3KHZq6yKG96',
        'youtube_id': 'UCWnUHb8KCdprdkBBts9GxSA',
    },
    {
        'name': 'Mango Blade',
        'spotify_id': '4vYClJG7K1FGWMMalEW5Hg',
        'youtube_id': 'UCkKr9JaItuEsGRn8QEy5HjA',
    },
    {
        'name': 'ZACKO',
        'spotify_id': '3gXXs7vEDPmeJ2HAOCGi8e',
        'youtube_id': None,
    },
    {
        'name': 'pax',
        'spotify_id': '14UWYN8hKe7U5r0Vqe6ztL',
        'youtube_id': 'UCJfqzcZjdxhkgk3mV0GJITA',
    },
    {
        'name': 'ARANDA',
        'spotify_id': '7DFovnGo8GZX5PuEyXh6LV',
        'youtube_id': None,
    },
    {
        'name': 'Casa 24Beats',
        'spotify_id': None,  # No Spotify presence
        'youtube_id': 'UCg3IuQwjIBbkvEbDVJZd8VQ',
    }
]

# ------------------ HELPER CLASSES ------------------

class AntiDetectionManager:
    """Manages anti-detection measures for web scraping"""
    
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    ]
    
    @staticmethod
    def get_headers() -> Dict[str, str]:
        """Generate realistic browser headers"""
        return {
            'User-Agent': random.choice(AntiDetectionManager.USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Cache-Control': 'max-age=0'
        }
    
    @staticmethod
    def get_delay(base_delay: float = 2.0) -> float:
        """Generate random delay to mimic human behavior"""
        return random.uniform(base_delay, base_delay * 2.5)

class CircuitBreaker:
    """Circuit breaker pattern for handling persistent failures"""
    
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 300):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open
    
    def can_proceed(self) -> bool:
        """Check if requests can proceed"""
        if self.state == "closed":
            return True
        elif self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
                return True
            return False
        else:  # half-open
            return True
    
    def record_success(self):
        """Record successful operation"""
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logging.warning(f"Circuit breaker opened after {self.failure_count} failures")

# ------------------ FUNCTIONS ------------------

def get_spotify_token():
    """Gets an access token from Spotify API."""
    auth_url = 'https://accounts.spotify.com/api/token'
    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

    headers = {'Authorization': f'Basic {auth_header}'}
    data = {'grant_type': 'client_credentials'}

    try:
        response = requests.post(auth_url, headers=headers, data=data, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        
        return response_data['access_token']
    except Exception as e:
        logging.error(f"Failed to get Spotify token: {e}")
        raise

def extract_monthly_listeners(html_content):
    """Extract monthly listeners from various patterns in the HTML with enhanced strategies."""
    
    # Strategy 1: Look for JSON-LD structured data
    json_ld_pattern = r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>'
    json_matches = re.findall(json_ld_pattern, html_content, re.DOTALL)
    
    for match in json_matches:
        try:
            data = json.loads(match.strip())
            # Sometimes the data is nested
            if isinstance(data, dict):
                # Look for any numeric value that could be monthly listeners
                if 'interactionStatistic' in data:
                    for stat in data.get('interactionStatistic', []):
                        if 'userInteractionCount' in stat:
                            return str(stat['userInteractionCount'])
        except:
            continue
    
    # Strategy 2: Enhanced patterns for monthly listeners
    listeners_patterns = [
        # Standard patterns
        r'(\d{1,3}(?:,\d{3})*)\s*monthly\s*listeners',
        r'monthly\s*listeners[:\s]*(\d{1,3}(?:,\d{3})*)',
        r'(\d{1,3}(?:\.\d{3})*)\s*monthly\s*listeners',
        r'(\d{1,3}(?:\s\d{3})*)\s*monthly\s*listeners',
        
        # JSON patterns
        r'"monthly_listeners"\s*:\s*(\d+)',
        r'"monthlyListeners"\s*:\s*(\d+)',
        r'"listeners"\s*:\s*{\s*"monthly"\s*:\s*(\d+)',
        r'monthlyListeners["\']?\s*:\s*(\d+)',
        r'"stats"\s*:.*?"monthlyListeners"\s*:\s*(\d+)',
        
        # Alternative formats
        r'(\d{1,3}(?:,\d{3})*)\s*(?:monthly|/month|per month)',
        r'listeners["\']?\s*[>:]\s*["\']?(\d{1,3}(?:,\d{3})*)',
        
        # Data attributes
        r'data-monthly-listeners="(\d+)"',
        r'data-listeners="(\d+)"',
        r'data-stats=\'[^\']*"monthlyListeners"\s*:\s*(\d+)'
    ]
    
    for pattern in listeners_patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        if matches:
            # Take the largest number found (likely the monthly listeners)
            numbers = []
            for match in matches:
                # Clean the number (remove commas, dots, spaces)
                clean_number = match.replace(',', '').replace('.', '').replace(' ', '')
                if clean_number.isdigit():
                    numbers.append(int(clean_number)
            if numbers:
                # Return the largest number (most likely to be monthly listeners)
                return str(max(numbers))
    
    # Strategy 3: Look in script tags for Spotify's internal data
    script_pattern = r'<script[^>]*>(.*?)</script>'
    script_matches = re.findall(script_pattern, html_content, re.DOTALL)
    
    for script in script_matches:
        # Look for patterns in JavaScript objects
        js_patterns = [
            r'["\']\s*monthlyListeners\s*["\']\s*:\s*(\d+)',
            r'monthlyListeners\s*=\s*(\d+)',
            r'listeners.*?monthly.*?(\d{1,3}(?:,\d{3})*)'
        ]
        
        for pattern in js_patterns:
            match = re.search(pattern, script, re.IGNORECASE)
            if match:
                number = match.group(1).replace(',', '').replace('.', '').replace(' ', '')
                if number.isdigit():
                    return number
    
    # Strategy 4: Look in meta tags
    meta_patterns = [
        r'<meta[^>]*property="music:monthly_listeners"[^>]*content="(\d+)"',
        r'<meta[^>]*name="monthly_listeners"[^>]*content="(\d+)"',
        r'<meta[^>]*content="(\d+)"[^>]*property="music:monthly_listeners"',
        r'<meta[^>]*content="(\d+)"[^>]*name="monthly_listeners"'
    ]
    
    for pattern in meta_patterns:
        match = re.search(pattern, html_content)
        if match:
            return match.group(1)
    
    return None

def create_session_with_retry():
    """Create a session with retry strategy"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"],
        raise_on_status=False
    )
    
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_maxsize=10,
        pool_block=True
    )
    
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    return session

def scrape_monthly_listeners(artist_id, circuit_breaker=None):
    """Scrapes monthly listeners from Spotify's public artist page with enhanced error handling."""
    if not artist_id:
        return "N/A"
    
    # Use circuit breaker if provided
    if circuit_breaker and not circuit_breaker.can_proceed():
        logging.warning(f"Circuit breaker is open for artist {artist_id}")
        return "N/A"
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        # Create session with connection pooling
        session = create_session_with_retry()
        
        # Use anti-detection headers
        headers = AntiDetectionManager.get_headers()
        
        # Add specific headers that help with Spotify
        headers.update({
            'Referer': 'https://open.spotify.com/',
            'Origin': 'https://open.spotify.com'
        })
        
        # First request
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Try to extract monthly listeners
        monthly_listeners = extract_monthly_listeners(response.text)
        
        if monthly_listeners:
            if circuit_breaker:
                circuit_breaker.record_success()
            logging.info(f"Found monthly listeners: {monthly_listeners}")
            return monthly_listeners
        
        # If first attempt fails, try with different approach
        # Small delay before retry
        time.sleep(AntiDetectionManager.get_delay(1.5))
        
        # Try with updated headers
        headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120"'
        headers['Sec-Ch-Ua-Mobile'] = '?0'
        headers['Sec-Ch-Ua-Platform'] = '"macOS"'
        
        response = session.get(url, headers=headers, timeout=15)
        monthly_listeners = extract_monthly_listeners(response.text)
        
        if monthly_listeners:
            if circuit_breaker:
                circuit_breaker.record_success()
            logging.info(f"Found monthly listeners on retry: {monthly_listeners}")
            return monthly_listeners
        
        # Log content snippet for debugging (especially for Casa24)
        if artist_id == '2QpRYjtwNg9z6KwD4fhC5h':  # Casa24
            logging.debug(f"Casa24 page snippet: {response.text[:500]}")
        
        logging.warning(f"Could not find monthly listeners for artist {artist_id}")
        if circuit_breaker:
            circuit_breaker.record_failure()
        
        return "N/A"
        
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error scraping monthly listeners for {artist_id}: {e}")
        if circuit_breaker and e.response.status_code == 429:
            circuit_breaker.record_failure()
        return "N/A"
    except requests.exceptions.Timeout:
        logging.error(f"Timeout scraping monthly listeners for {artist_id}")
        if circuit_breaker:
            circuit_breaker.record_failure()
        return "N/A"
    except requests.exceptions.ConnectionError as e:
        logging.error(f"Connection error scraping monthly listeners for {artist_id}: {e}")
        if circuit_breaker:
            circuit_breaker.record_failure()
        return "N/A"
    except Exception as e:
        logging.error(f"Unexpected error scraping monthly listeners for {artist_id}: {e}")
        if circuit_breaker:
            circuit_breaker.record_failure()
        return "N/A"
    finally:
        if 'session' in locals():
            session.close()

def get_spotify_artist_data(artist_id, token, circuit_breaker=None):
    """Gets name, popularity, followers, and monthly listeners for a Spotify artist."""
    if not artist_id:
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }
        
    url = f"https://api.spotify.com/v1/artists/{artist_id}"
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        artist_data = response.json()

        # Get artist's top tracks
        tracks_url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?market=US"
        tracks_response = requests.get(tracks_url, headers=headers, timeout=10)
        tracks_response.raise_for_status()
        tracks_data = tracks_response.json()
        
        top_tracks = []
        if 'tracks' in tracks_data:
            for track in tracks_data['tracks'][:5]:  # Get top 5 tracks
                top_tracks.append({
                    'name': track['name'],
                    'popularity': track['popularity'],
                    'preview_url': track.get('preview_url', '')
                })

        # Scrape monthly listeners from the public page
        artist_name = artist_data.get('name', 'Unknown Artist')
        logging.info(f"Scraping monthly listeners for {artist_name}...")
        monthly_listeners = scrape_monthly_listeners(artist_id, circuit_breaker)
        
        # Add a delay to be respectful to Spotify's servers
        time.sleep(AntiDetectionManager.get_delay())

        return {
            'popularity_score': artist_data.get('popularity', 0),
            'followers': artist_data.get('followers', {}).get('total', 0),
            'monthly_listeners': monthly_listeners,
            'genres': artist_data.get('genres', []),
            'top_tracks': top_tracks
        }
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.error(f"Spotify API authentication failed for {artist_id}")
        else:
            logging.error(f"HTTP error getting Spotify data for {artist_id}: {e}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }
    except Exception as e:
        logging.error(f"Error getting Spotify data for {artist_id}: {e}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }

def get_youtube_channel_data(channel_id):
    """Gets YouTube channel stats and top videos."""
    if not channel_id:
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0, 'top_videos': []}

    # First, get channel statistics
    channel_url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={YOUTUBE_API_KEY}"
    
    try:
        response = requests.get(channel_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if 'items' in data and len(data['items']) > 0:
            stats = data['items'][0]['statistics']
            channel_data = {
                'subscribers': int(stats.get('subscriberCount', 0)),  
                'total_views': int(stats.get('viewCount', 0)),        
                'video_count': int(stats.get('videoCount', 0)),
                'top_videos': []
            }
            
            # Now get the top videos
            # Get uploads playlist ID
            playlist_url = f"https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id={channel_id}&key={YOUTUBE_API_KEY}"
            playlist_response = requests.get(playlist_url, timeout=10)
            playlist_response.raise_for_status()
            playlist_data = playlist_response.json()
            
            if 'items' in playlist_data and len(playlist_data['items']) > 0:
                uploads_playlist_id = playlist_data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
                
                # Get videos from uploads playlist (this gives us recent videos)
                videos_url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={uploads_playlist_id}&maxResults=50&key={YOUTUBE_API_KEY}"
                videos_response = requests.get(videos_url, timeout=10)
                videos_response.raise_for_status()
                videos_data = videos_response.json()
                
                if 'items' in videos_data:
                    video_ids = [item['snippet']['resourceId']['videoId'] for item in videos_data['items']]
                    
                    # Get video statistics for these videos
                    if video_ids:
                        # YouTube API allows up to 50 video IDs per request
                        video_stats_url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id={','.join(video_ids[:50])}&key={YOUTUBE_API_KEY}"
                        video_stats_response = requests.get(video_stats_url, timeout=10)
                        video_stats_response.raise_for_status()
                        video_stats_data = video_stats_response.json()
                        
                        if 'items' in video_stats_data:
                            videos_with_views = []
                            for video in video_stats_data['items']:
                                view_count = int(video['statistics'].get('viewCount', 0))
                                videos_with_views.append({
                                    'title': video['snippet']['title'],
                                    'views': view_count,
                                    'video_id': video['id'],
                                    'published_at': video['snippet']['publishedAt']
                                })
                            
                            # Sort by views and take top 5
                            videos_with_views.sort(key=lambda x: x['views'], reverse=True)
                            channel_data['top_videos'] = videos_with_views[:5]
            
            return channel_data
        else:
            logging.warning(f"No YouTube data found for channel {channel_id}")
            return {'subscribers': 0, 'total_views': 0, 'video_count': 0, 'top_videos': []}
            
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            logging.error(f"YouTube API quota exceeded or API key invalid for channel {channel_id}")
        else:
            logging.error(f"HTTP error getting YouTube data for {channel_id}: {e}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0, 'top_videos': []}
    except Exception as e:
        logging.error(f"Error getting YouTube data for {channel_id}: {e}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0, 'top_videos': []}

def collect_all_data():
    """Collects all artist data from multiple platforms."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        spotify_token = get_spotify_token()
    except Exception as e:
        logging.error(f"Failed to get Spotify token: {e}")
        spotify_token = None
    
    all_artists_data = {
        'date': today,
        'artists': []
    }
    
    # Create circuit breaker for scraping
    circuit_breaker = CircuitBreaker()
    
    # Statistics
    stats = {
        'total': len(artists),
        'spotify_success': 0,
        'youtube_success': 0,
        'monthly_listeners_found': 0
    }
    
    for artist in artists:
        logging.info(f"\nCollecting data for {artist['name']}...")
        
        # Get Spotify data (skip for artists without Spotify ID)
        if spotify_token and artist.get('spotify_id'):
            spotify_data = get_spotify_artist_data(artist.get('spotify_id'), spotify_token, circuit_breaker)
            if spotify_data['popularity_score'] > 0:
                stats['spotify_success'] += 1
            if spotify_data['monthly_listeners'] != "N/A":
                stats['monthly_listeners_found'] += 1
        else:
            # For artists without Spotify presence (like Casa 24Beats)
            logging.info(f"{artist['name']} has no Spotify ID, skipping Spotify data collection")
            spotify_data = {
                'popularity_score': 0,
                'followers': 0,
                'monthly_listeners': "N/A",
                'genres': [],
                'top_tracks': []
            }
        
        # Get YouTube data (now includes top videos)
        youtube_data = get_youtube_channel_data(artist.get('youtube_id'))
        if youtube_data['subscribers'] > 0:
            stats['youtube_success'] += 1
        
        artist_data = {
            'name': artist['name'],
            'spotify': spotify_data,
            'youtube': youtube_data
        }
        
        all_artists_data['artists'].append(artist_data)
        
        # Log progress
        logging.info(f"Progress: {len(all_artists_data['artists'])}/{stats['total']} artists processed")
        
        # Add a small delay between artists
        time.sleep(1)
    
    # Log summary statistics
    logging.info("\n" + "="*50)
    logging.info("COLLECTION SUMMARY")
    logging.info("="*50)
    logging.info(f"Total artists: {stats['total']}")
    logging.info(f"Spotify API success: {stats['spotify_success']}/{stats['total']}")
    logging.info(f"Monthly listeners found: {stats['monthly_listeners_found']}/{stats['total']}")
    logging.info(f"YouTube API success: {stats['youtube_success']}/{stats['total']}")
    logging.info("="*50)
    
    return all_artists_data

def save_data_as_json(data, filename):
    """Saves the collected data as JSON."""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    
    logging.info(f"Data saved to {filename}")

def update_historical_data(data):
    """Updates the historical data files."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Create directories if they don't exist
    os.makedirs('data/historical', exist_ok=True)
    
    # Save today's data in historical folder
    historical_file = f"data/historical/{today}.json"
    save_data_as_json(data, historical_file)
    
    # Update latest data file
    save_data_as_json(data, 'data/latest.json')
    
    # Also save as CSV for backward compatibility
    csv_file = 'data/popularity_scores.csv'
    artists_data = []
    
    for artist in data['artists']:
        artist_info = {
            'artist_name': artist['name'],
            'date': today,
            'popularity_score': artist['spotify']['popularity_score'],
            'followers': artist['spotify']['followers'],
            'monthly_listeners': artist['spotify']['monthly_listeners'],
            'youtube_subscribers': artist['youtube']['subscribers'],
            'youtube_total_views': artist['youtube']['total_views'],
            'youtube_video_count': artist['youtube']['video_count']
        }
        artists_data.append(artist_info)
    
    df = pd.DataFrame(artists_data)
    
    # Check if file exists to determine if we need headers
    file_exists = os.path.exists(csv_file)
    df.to_csv(csv_file, mode='a', header=not file_exists, index=False)
    
    logging.info(f"CSV data saved to {csv_file}")

# ------------------ MAIN PROCESS ------------------

if __name__ == "__main__":
    print("Starting data collection...")
    print(f"Current date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    try:
        # Collect all data
        collected_data = collect_all_data()
        
        # Update historical records
        update_historical_data(collected_data)
        
        print("\nData collection complete!")
        print(f"Successfully collected data for {len(collected_data['artists'])} artists")
        
        # Print any artists with missing monthly listeners
        missing_listeners = [
            artist['name'] 
            for artist in collected_data['artists'] 
            if artist['spotify']['monthly_listeners'] == "N/A"
        ]
        
        if missing_listeners:
            print(f"\nWarning: Could not get monthly listeners for: {', '.join(missing_listeners)}")
        
    except Exception as e:
        print(f"\nError during data collection: {e}")
        raise

