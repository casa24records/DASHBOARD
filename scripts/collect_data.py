import base64
import requests
import json
import pandas as pd
from datetime import datetime
import os
import re
import time

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
    }
]

# ------------------ FUNCTIONS ------------------

def get_spotify_token():
    """Gets an access token from Spotify API."""
    auth_url = 'https://accounts.spotify.com/api/token'
    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

    headers = {'Authorization': f'Basic {auth_header}'}
    data = {'grant_type': 'client_credentials'}

    response = requests.post(auth_url, headers=headers, data=data)
    response_data = response.json()
    
    return response_data['access_token']

def extract_monthly_listeners(html_content):
    """Extract monthly listeners from various patterns in the HTML."""
    
    # Pattern 1: Look for JSON-LD structured data
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
    
    # Pattern 2: Look for Spotify's internal data in script tags
    # Spotify often includes data in window.Spotify or similar objects
    script_pattern = r'<script[^>]*>(.*?)</script>'
    script_matches = re.findall(script_pattern, html_content, re.DOTALL)
    
    for script in script_matches:
        # Look for patterns like "monthly_listeners":12345 or similar
        listeners_patterns = [
            r'"monthly_listeners"\s*:\s*(\d+)',
            r'"monthlyListeners"\s*:\s*(\d+)',
            r'"listeners"\s*:\s*{\s*"monthly"\s*:\s*(\d+)',
            r'monthlyListeners["\']?\s*:\s*(\d+)',
            r'"stats"\s*:.*?"monthlyListeners"\s*:\s*(\d+)'
        ]
        
        for pattern in listeners_patterns:
            match = re.search(pattern, script)
            if match:
                return match.group(1)
    
    # Pattern 3: Look in meta tags
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
    
    # Pattern 4: Look for the number near "monthly listeners" text
    # This is less reliable but can work
    text_patterns = [
        r'(\d{1,3}(?:,\d{3})*|\d+)\s*monthly\s*listeners',
        r'monthly\s*listeners[:\s]*(\d{1,3}(?:,\d{3})*|\d+)',
        r'(\d{1,3}(?:\.\d{3})*|\d+)\s*monthly\s*listeners',  # For dot-separated numbers
        r'(\d{1,3}(?:\s\d{3})*|\d+)\s*monthly\s*listeners'   # For space-separated numbers
    ]
    
    for pattern in text_patterns:
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            # Clean the number (remove commas, dots, spaces)
            number = match.group(1).replace(',', '').replace('.', '').replace(' ', '')
            return number
    
    # Pattern 5: Look for data attributes
    data_attr_patterns = [
        r'data-monthly-listeners="(\d+)"',
        r'data-listeners="(\d+)"',
        r'data-stats=\'[^\']*"monthlyListeners"\s*:\s*(\d+)'
    ]
    
    for pattern in data_attr_patterns:
        match = re.search(pattern, html_content)
        if match:
            return match.group(1)
    
    return None

def scrape_monthly_listeners(artist_id):
    """Scrapes monthly listeners from Spotify's public artist page."""
    if not artist_id:
        return "N/A"
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        # Headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # Create a session to maintain cookies
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Try to extract monthly listeners
        monthly_listeners = extract_monthly_listeners(response.text)
        
        if monthly_listeners:
            print(f"Found monthly listeners: {monthly_listeners}")
            return monthly_listeners
        
        # If first attempt fails, try with different approach
        # Sometimes Spotify requires specific headers or cookies
        headers['Referer'] = 'https://open.spotify.com/'
        headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120"'
        headers['Sec-Ch-Ua-Mobile'] = '?0'
        headers['Sec-Ch-Ua-Platform'] = '"macOS"'
        
        # Small delay and retry
        time.sleep(2)
        response = session.get(url, headers=headers, timeout=15)
        monthly_listeners = extract_monthly_listeners(response.text)
        
        if monthly_listeners:
            print(f"Found monthly listeners on retry: {monthly_listeners}")
            return monthly_listeners
        
        print(f"Could not find monthly listeners for artist {artist_id}")
        return "N/A"
        
    except requests.RequestException as e:
        print(f"Network error scraping monthly listeners for {artist_id}: {e}")
        return "N/A"
    except Exception as e:
        print(f"Error scraping monthly listeners for {artist_id}: {e}")
        return "N/A"

def get_spotify_artist_data(artist_id, token):
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
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        artist_data = response.json()

        # Get artist's top tracks
        tracks_url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?market=US"
        tracks_response = requests.get(tracks_url, headers=headers)
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
        print(f"Scraping monthly listeners for {artist_name}...")
        monthly_listeners = scrape_monthly_listeners(artist_id)
        
        # Add a delay to be respectful to Spotify's servers
        time.sleep(2)

        return {
            'popularity_score': artist_data.get('popularity', 0),
            'followers': artist_data.get('followers', {}).get('total', 0),
            'monthly_listeners': monthly_listeners,
            'genres': artist_data.get('genres', []),
            'top_tracks': top_tracks
        }
    except Exception as e:
        print(f"Error getting Spotify data for {artist_id}: {e}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }

def get_youtube_channel_data(channel_id):
    """Gets YouTube channel stats: subscribers, views, video count."""
    if not channel_id:
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

    url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={YOUTUBE_API_KEY}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if 'items' in data and len(data['items']) > 0:
            stats = data['items'][0]['statistics']
            return {
                'subscribers': int(stats.get('subscriberCount', 0)),  
                'total_views': int(stats.get('viewCount', 0)),        
                'video_count': int(stats.get('videoCount', 0))        
            }
        else:
            print(f"No YouTube data found for channel {channel_id}")
            return {'subscribers': 0, 'total_views': 0, 'video_count': 0}
    except Exception as e:
        print(f"Error getting YouTube data for {channel_id}: {e}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

def collect_all_data():
    """Collects all artist data from multiple platforms."""
    today = datetime.now().strftime('%Y-%m-%d')
    spotify_token = get_spotify_token()
    
    all_artists_data = {
        'date': today,
        'artists': []
    }
    
    for artist in artists:
        print(f"\nCollecting data for {artist['name']}...")
        artist_data = {
            'name': artist['name'],
            'spotify': get_spotify_artist_data(artist.get('spotify_id'), spotify_token),
            'youtube': get_youtube_channel_data(artist.get('youtube_id'))
        }
        
        all_artists_data['artists'].append(artist_data)
        
        # Add a small delay between artists
        time.sleep(1)
    
    return all_artists_data

def save_data_as_json(data, filename):
    """Saves the collected data as JSON."""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Data saved to {filename}")

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
    
    print(f"CSV data saved to {csv_file}")

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
        
    except Exception as e:
        print(f"\nError during data collection: {e}")
        raise
