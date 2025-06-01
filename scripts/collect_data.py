import base64
import requests
import json
import pandas as pd
from datetime import datetime
import os
import re
from bs4 import BeautifulSoup
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

def safe_int_conversion(value):
    """Safely convert a string to integer, handling empty strings and errors."""
    if not value or value == 'N/A':
        return 0
    
    # Remove commas and whitespace
    cleaned_value = str(value).replace(',', '').strip()
    
    if not cleaned_value:
        return 0
    
    try:
        return int(cleaned_value)
    except ValueError:
        print(f"Warning: Could not convert '{value}' to integer")
        return 0

def scrape_monthly_listeners(artist_id):
    """Scrapes monthly listeners from Spotify's public artist page."""
    if not artist_id:
        return 0
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Look for the monthly listeners in the page content
        content = response.text
        
        # Method 1: Look for pattern like "123,456 monthly listeners"
        pattern = r'([\d,]+)\s*monthly\s*listeners'
        match = re.search(pattern, content, re.IGNORECASE)
        
        if match:
            listeners_str = match.group(1)
            return safe_int_conversion(listeners_str)
        
        # Method 2: Look for JSON data in the page
        # Spotify often includes data in JSON format within the HTML
        json_pattern = r'"monthlyListeners":\s*(\d+)'
        json_match = re.search(json_pattern, content)
        
        if json_match:
            return safe_int_conversion(json_match.group(1))
        
        # Method 3: Look for any occurrence of "monthly listeners" and nearby numbers
        soup = BeautifulSoup(content, 'html.parser')
        text_content = soup.get_text()
        
        # Split by "monthly listeners" and look for numbers before it
        if "monthly listeners" in text_content.lower():
            parts = text_content.lower().split("monthly listeners")
            if parts:
                # Look for numbers in the part before "monthly listeners"
                before_text = parts[0][-100:]  # Get last 100 chars before "monthly listeners"
                numbers = re.findall(r'[\d,]+', before_text)
                
                if numbers:
                    # Get the last number before "monthly listeners" (most likely to be the count)
                    for num in reversed(numbers):
                        if num.strip():
                            return safe_int_conversion(num)
        
        print(f"Could not find monthly listeners for artist {artist_id}")
        return 0
        
    except requests.RequestException as e:
        print(f"Network error scraping monthly listeners for {artist_id}: {e}")
        return 0
    except Exception as e:
        print(f"Error scraping monthly listeners for {artist_id}: {e}")
        return 0

def get_spotify_artist_data(artist_id, token):
    """Gets name, popularity, followers, and monthly listeners for a Spotify artist."""
    if not artist_id:
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': 0,
            'genres': [],
            'top_tracks': []
        }
        
    try:
        url = f"https://api.spotify.com/v1/artists/{artist_id}"
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(url, headers=headers)
        artist_data = response.json()

        # Get artist's top tracks
        tracks_url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?market=US"
        tracks_response = requests.get(tracks_url, headers=headers)
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
        
        # Add a small delay to be respectful to Spotify's servers
        time.sleep(1)

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
            'monthly_listeners': 0,
            'genres': [],
            'top_tracks': []
        }

def get_youtube_channel_data(channel_id):
    """Gets YouTube channel stats: subscribers, views, video count."""
    if not channel_id:
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

    try:
        url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={YOUTUBE_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if 'items' in data and len(data['items']) > 0:
            stats = data['items'][0]['statistics']
            return {
                'subscribers': int(stats.get('subscriberCount', 0)),  
                'total_views': int(stats.get('viewCount', 0)),        
                'video_count': int(stats.get('videoCount', 0))        
            }
        else:
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
        print(f"Collecting data for {artist['name']}...")
        artist_data = {
            'name': artist['name'],
            'spotify': get_spotify_artist_data(artist.get('spotify_id'), spotify_token),
            'youtube': get_youtube_channel_data(artist.get('youtube_id'))
        }
        
        all_artists_data['artists'].append(artist_data)
    
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
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    try:
        # Collect all data
        collected_data = collect_all_data()
        
        # Update historical records
        update_historical_data(collected_data)
        
        print("Data collection complete!")
        
        # Print summary of collected data
        print("\nSummary of collected data:")
        for artist in collected_data['artists']:
            print(f"\n{artist['name']}:")
            print(f"  Spotify - Popularity: {artist['spotify']['popularity_score']}, "
                  f"Followers: {artist['spotify']['followers']}, "
                  f"Monthly Listeners: {artist['spotify']['monthly_listeners']}")
            print(f"  YouTube - Subscribers: {artist['youtube']['subscribers']}, "
                  f"Views: {artist['youtube']['total_views']}")
    
    except Exception as e:
        print(f"Error during data collection: {e}")
        import traceback
        traceback.print_exc()
