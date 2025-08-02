#!/usr/bin/env python3
"""
Robust Spotify and YouTube data collection script with improved monthly listeners extraction
"""

import base64
import requests
import json
import pandas
from datetime import datetime
import os
import re
import time
import random
import logging
from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import html

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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    
    @staticmethod
    def get_delay(base_delay: float = 1.0) -> float:
        """Generate random delay to mimic human behavior"""
        return random.uniform(base_delay, base_delay * 1.5)

# ------------------ SPOTIFY SCRAPING FUNCTIONS ------------------

def parse_listener_number(text: str) -> Optional[int]:
    """
    Parse monthly listeners from text, handling various formats:
    - "1,041 monthly listeners" -> 1041
    - "1.041 monthly listeners" -> 1041
    - "0 monthly listeners" -> 0
    - Just "1,041" -> 1041
    """
    if not text:
        return None
    
    # First, try to find a number with optional "monthly listeners" text
    patterns = [
        r'([\d,.\s]+)\s*monthly\s*listeners?',
        r'([\d,.\s]+)',  # Just the number
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.strip(), re.IGNORECASE)
        if match:
            number_str = match.group(1).strip()
            
            # Remove all separators (commas, periods, spaces)
            # But first, check if it's using periods as thousands separator (European style)
            # by looking for patterns like "1.041" (exactly 3 digits after period)
            if '.' in number_str and ',' not in number_str:
                # Check if periods are used as thousands separators
                parts = number_str.split('.')
                if len(parts) > 1 and all(len(part) == 3 for part in parts[1:]):
                    # European format: 1.041 means one thousand forty-one
                    clean_number = number_str.replace('.', '')
                else:
                    # It's a decimal, which shouldn't happen for listener counts
                    clean_number = number_str.split('.')[0]
            else:
                # Standard format with commas or spaces
                clean_number = re.sub(r'[,.\s]', '', number_str)
            
            try:
                value = int(clean_number)
                if value >= 0:  # Monthly listeners can be 0 or positive
                    return value
            except ValueError:
                continue
    
    return None

def extract_monthly_listeners_from_html(html_content: str, artist_name: str) -> Optional[int]:
    """
    Extract monthly listeners using multiple strategies, focusing on accuracy
    """
    
    # First, let's clean the HTML content
    # Sometimes Spotify uses non-breaking spaces or other Unicode characters
    html_content = html_content.replace('\u00a0', ' ')  # non-breaking space
    html_content = html_content.replace('\u202f', ' ')  # narrow non-breaking space
    
    # Strategy 1: Look for the exact pattern in the visible text
    # This is the most reliable for current Spotify pages
    patterns = [
        # Direct text patterns - these are most common
        r'([\d,.\s]+)\s*monthly\s+listeners',
        r'([\d,.\s]+)\s*monthly\s*listeners',
        r'([\d,.]+)\s*monthly\s*listeners',
        
        # Handle different separators
        r'(\d{1,3}(?:[,.\s]\d{3})*)\s*monthly\s*listeners',
        
        # JSON patterns in JavaScript
        r'"monthly_listeners"\s*:\s*(\d+)',
        r'"monthlyListeners"\s*:\s*(\d+)',
        r'monthlyListeners["\']?\s*:\s*(\d+)',
        r'"listeners"\s*:\s*{\s*"monthly"\s*:\s*(\d+)',
        
        # Data attributes
        r'data-testid="monthly-listeners"[^>]*>([^<]+)',
        r'data-monthly-listeners="(\d+)"',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, html_content, re.IGNORECASE | re.MULTILINE)
        if matches:
            # Process all matches and return the most likely one
            for match in matches:
                # If it's already a clean number (from JSON)
                if match.isdigit():
                    listeners = int(match)
                    if listeners >= 0:  # Valid listener count
                        logging.info(f"Found {artist_name} listeners in JSON: {listeners}")
                        return listeners
                else:
                    # Parse formatted number
                    listeners = parse_listener_number(match + " monthly listeners")
                    if listeners is not None:
                        logging.info(f"Found {artist_name} listeners in text: {listeners}")
                        return listeners
    
    # Strategy 2: Parse with BeautifulSoup for more structured extraction
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Look for text containing "monthly listeners"
        # Search in all text nodes
        for text in soup.stripped_strings:
            if 'monthly listener' in text.lower():
                listeners = parse_listener_number(text)
                if listeners is not None:
                    logging.info(f"Found {artist_name} listeners via BeautifulSoup text: {listeners}")
                    return listeners
            # Also check if we have a number followed by monthly listeners in nearby text
            elif text.strip().replace(',', '').replace('.', '').replace(' ', '').isdigit():
                # This might be a number, check if "monthly listeners" is nearby
                # Get the parent element
                parent = None
                for element in soup.find_all(text=text):
                    parent = element.parent
                    break
                
                if parent:
                    parent_text = parent.get_text(strip=True)
                    if 'monthly listener' in parent_text.lower():
                        listeners = parse_listener_number(parent_text)
                        if listeners is not None:
                            logging.info(f"Found {artist_name} listeners via parent element: {listeners}")
                            return listeners
        
        # Look for specific selectors
        selectors_to_try = [
            '[data-testid*="listener"]',
            '[class*="listener"]',
            '[aria-label*="listener"]',
            'span',
            'div',
        ]
        
        for selector in selectors_to_try:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)
                if 'monthly listener' in text.lower():
                    listeners = parse_listener_number(text)
                    if listeners is not None:
                        logging.info(f"Found {artist_name} listeners via selector {selector}: {listeners}")
                        return listeners
                
                # Also check parent
                parent = elem.parent
                if parent:
                    parent_text = parent.get_text(strip=True)
                    if 'monthly listener' in parent_text.lower():
                        listeners = parse_listener_number(parent_text)
                        if listeners is not None:
                            logging.info(f"Found {artist_name} listeners via parent of {selector}: {listeners}")
                            return listeners
    
    except Exception as e:
        logging.debug(f"BeautifulSoup parsing error for {artist_name}: {e}")
    
    # Strategy 3: More aggressive search - look for any number near "monthly listeners"
    # This helps when the number and text are in separate elements
    monthly_listener_regions = re.finditer(r'monthly\s*listeners?', html_content, re.IGNORECASE)
    for match in monthly_listener_regions:
        start = max(0, match.start() - 200)  # Look 200 chars before
        end = min(len(html_content), match.end() + 200)  # And 200 chars after
        region = html_content[start:end]
        
        # Look for numbers in this region
        number_patterns = [
            r'>\s*([\d,.\s]+)\s*<',  # Number between tags
            r'([\d,.\s]+)(?=\s*<)',  # Number before a tag
            r'(?<=>)\s*([\d,.\s]+)',  # Number after a tag
        ]
        
        for num_pattern in number_patterns:
            num_matches = re.findall(num_pattern, region)
            for num_match in num_matches:
                # Clean and parse the number
                cleaned = re.sub(r'[^\d,.]', '', num_match).strip()
                if cleaned and re.match(r'[\d,.]+', cleaned):
                    listeners = parse_listener_number(cleaned + " monthly listeners")
                    if listeners is not None and listeners > 0:
                        logging.info(f"Found {artist_name} listeners via proximity search: {listeners}")
                        return listeners
    
    # Strategy 4: Look for embedded JSON data
    json_patterns = [
        r'<script[^>]*type="application/json"[^>]*>(.*?)</script>',
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        r'<script[^>]*>window\.Spotify\s*=\s*({.*?});</script>',
        r'<script[^>]*>Spotify\s*=\s*({.*?});</script>',
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, html_content, re.DOTALL)
        for match in matches:
            try:
                # Try to parse as JSON
                data = json.loads(match)
                # Recursively search for monthly listeners in the JSON
                listeners = find_listeners_in_json(data)
                if listeners is not None:
                    logging.info(f"Found {artist_name} listeners in embedded JSON: {listeners}")
                    return listeners
            except:
                continue
    
    return None

def find_listeners_in_json(obj, depth=0, max_depth=10):
    """Recursively search for monthly listeners in JSON object"""
    if depth > max_depth:
        return None
    
    if isinstance(obj, dict):
        # Check for direct monthly listeners keys
        for key in ['monthly_listeners', 'monthlyListeners', 'listeners']:
            if key in obj:
                if isinstance(obj[key], int):
                    return obj[key]
                elif isinstance(obj[key], dict) and 'monthly' in obj[key]:
                    return obj[key]['monthly']
        
        # Recursively search
        for value in obj.values():
            result = find_listeners_in_json(value, depth + 1, max_depth)
            if result is not None:
                return result
    
    elif isinstance(obj, list):
        for item in obj:
            result = find_listeners_in_json(item, depth + 1, max_depth)
            if result is not None:
                return result
    
    return None

def create_session_with_retry():
    """Create a session with retry strategy"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=3,
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

def scrape_monthly_listeners(artist_id: str, artist_name: str) -> str:
    """
    Scrapes monthly listeners from Spotify's public artist page.
    Returns the number as a string, or "N/A" if not found.
    """
    if not artist_id:
        return "N/A"
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        # Create session with retries
        session = create_session_with_retry()
        
        # Use anti-detection headers
        headers = AntiDetectionManager.get_headers()
        headers.update({
            'Referer': 'https://open.spotify.com/',
            'Origin': 'https://open.spotify.com'
        })
        
        logging.info(f"Fetching Spotify page for {artist_name}...")
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Extract monthly listeners
        listeners = extract_monthly_listeners_from_html(response.text, artist_name)
        
        if listeners is not None:
            logging.info(f"✓ Successfully found {artist_name} monthly listeners: {listeners:,}")
            return str(listeners)
        
        # If not found in first attempt, try with a fresh request
        # Sometimes Spotify returns different content
        time.sleep(AntiDetectionManager.get_delay(0.5))
        
        # Try once more with slightly different headers
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        response = session.get(url, headers=headers, timeout=10)
        
        listeners = extract_monthly_listeners_from_html(response.text, artist_name)
        if listeners is not None:
            logging.info(f"✓ Found {artist_name} monthly listeners on retry: {listeners:,}")
            return str(listeners)
        
        # Debug: Save HTML for manual inspection if it's a known problematic artist
        if artist_name in ['Casa 24', 'ZACKO']:
            debug_file = f"debug_{artist_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            logging.warning(f"Could not find monthly listeners for {artist_name}. Debug HTML saved to {debug_file}")
            
            # Extra debugging for Casa 24
            if artist_name == 'Casa 24':
                # Look for any text containing numbers
                all_numbers = re.findall(r'\b\d{1,3}(?:[,.\s]\d{3})*\b', response.text)
                logging.info(f"All numbers found on Casa 24 page: {all_numbers[:20]}")  # First 20 numbers
                
                # Look for text around "monthly"
                monthly_matches = re.finditer(r'.{50}monthly.{50}', response.text, re.IGNORECASE)
                for i, match in enumerate(monthly_matches):
                    if i < 5:  # First 5 matches
                        logging.info(f"Context around 'monthly' #{i+1}: {repr(match.group())}")
        
        logging.warning(f"✗ Could not find monthly listeners for {artist_name}")
        return "N/A"
        
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error for {artist_name}: {e}")
        return "N/A"
    except Exception as e:
        logging.error(f"Unexpected error for {artist_name}: {e}")
        return "N/A"
    finally:
        if 'session' in locals():
            session.close()

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

def get_spotify_artist_data(artist_id, token, artist_name):
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
        logging.info(f"Scraping monthly listeners for {artist_name}...")
        monthly_listeners = scrape_monthly_listeners(artist_id, artist_name)
        
        # Add a small delay to be respectful
        time.sleep(AntiDetectionManager.get_delay(0.5))

        return {
            'popularity_score': artist_data.get('popularity', 0),
            'followers': artist_data.get('followers', {}).get('total', 0),
            'monthly_listeners': monthly_listeners,
            'genres': artist_data.get('genres', []),
            'top_tracks': top_tracks
        }
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.error(f"Spotify API authentication failed for {artist_name}")
        else:
            logging.error(f"HTTP error getting Spotify data for {artist_name}: {e}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }
    except Exception as e:
        logging.error(f"Error getting Spotify data for {artist_name}: {e}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }

# ------------------ YOUTUBE FUNCTIONS ------------------

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
            playlist_url = f"https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id={channel_id}&key={YOUTUBE_API_KEY}"
            playlist_response = requests.get(playlist_url, timeout=10)
            playlist_response.raise_for_status()
            playlist_data = playlist_response.json()
            
            if 'items' in playlist_data and len(playlist_data['items']) > 0:
                uploads_playlist_id = playlist_data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
                
                # Get videos from uploads playlist
                videos_url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={uploads_playlist_id}&maxResults=50&key={YOUTUBE_API_KEY}"
                videos_response = requests.get(videos_url, timeout=10)
                videos_response.raise_for_status()
                videos_data = videos_response.json()
                
                if 'items' in videos_data:
                    video_ids = [item['snippet']['resourceId']['videoId'] for item in videos_data['items']]
                    
                    # Get video statistics
                    if video_ids:
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
            
    except Exception as e:
        logging.error(f"Error getting YouTube data for {channel_id}: {e}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0, 'top_videos': []}

# ------------------ MAIN COLLECTION FUNCTION ------------------

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
    
    # Statistics
    stats = {
        'total': len(artists),
        'spotify_success': 0,
        'youtube_success': 0,
        'monthly_listeners_found': 0
    }
    
    for artist in artists:
        logging.info(f"\n{'='*50}")
        logging.info(f"Collecting data for {artist['name']}...")
        logging.info(f"{'='*50}")
        
        # Get Spotify data
        if spotify_token and artist.get('spotify_id'):
            spotify_data = get_spotify_artist_data(
                artist.get('spotify_id'), 
                spotify_token,
                artist['name']
            )
            if spotify_data['popularity_score'] > 0:
                stats['spotify_success'] += 1
            if spotify_data['monthly_listeners'] != "N/A":
                stats['monthly_listeners_found'] += 1
        else:
            logging.info(f"{artist['name']} has no Spotify ID, skipping Spotify data collection")
            spotify_data = {
                'popularity_score': 0,
                'followers': 0,
                'monthly_listeners': "N/A",
                'genres': [],
                'top_tracks': []
            }
        
        # Get YouTube data
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
        time.sleep(0.5)
    
    # Log summary statistics
    logging.info("\n" + "="*50)
    logging.info("COLLECTION SUMMARY")
    logging.info("="*50)
    logging.info(f"Total artists: {stats['total']}")
    logging.info(f"Spotify API success: {stats['spotify_success']}/{stats['total']}")
    logging.info(f"Monthly listeners found: {stats['monthly_listeners_found']}/{stats['total']}")
    logging.info(f"YouTube API success: {stats['youtube_success']}/{stats['total']}")
    logging.info("="*50)
    
    # Print monthly listeners summary
    print("\nMonthly Listeners Summary:")
    print("-" * 40)
    for artist in all_artists_data['artists']:
        name = artist['name']
        listeners = artist['spotify']['monthly_listeners']
        print(f"{name:<20} {listeners:>10}")
    print("-" * 40)
    
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
    
    df = pandas.DataFrame(artists_data)
    
    # Check if file exists to determine if we need headers
    file_exists = os.path.exists(csv_file)
    df.to_csv(csv_file, mode='a', header=not file_exists, index=False)
    
    logging.info(f"CSV data saved to {csv_file}")

# ------------------ MAIN PROCESS ------------------

if __name__ == "__main__":
    print("\n" + "="*60)
    print("SPOTIFY DATA COLLECTION SCRIPT v2.0")
    print("="*60)
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    try:
        # Collect all data
        collected_data = collect_all_data()
        
        # Update historical records
        update_historical_data(collected_data)
        
        print("\n" + "="*60)
        print("DATA COLLECTION COMPLETE!")
        print("="*60)
        print(f"Successfully collected data for {len(collected_data['artists'])} artists")
        print(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
    except Exception as e:
        print(f"\nERROR during data collection: {e}")
        logging.exception("Fatal error in main execution")
        raise
