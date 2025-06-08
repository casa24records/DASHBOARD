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

# List of artists with their platform IDs - matching your original list exactly
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

def scrape_monthly_listeners(artist_id):
    """Scrapes monthly listeners from Spotify's public artist page."""
    if not artist_id:
        return "N/A"
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        # Use headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for monthly listeners in various possible locations
        # Pattern 1: Look for text containing "monthly listeners"
        monthly_listeners_text = soup.find(string=re.compile(r'monthly listeners', re.IGNORECASE))
        
        if monthly_listeners_text:
            # Extract number from the text
            parent = monthly_listeners_text.parent
            if parent:
                # Look for numbers in the same element or nearby elements
                text_content = parent.get_text()
                numbers = re.findall(r'[\d,]+', text_content)
                if numbers:
                    # Get the largest number (likely the monthly listeners count)
                    monthly_listeners = max(numbers, key=lambda x: int(x.replace(',', '')))
                    return monthly_listeners.replace(',', '')
        
        # Pattern 2: Look in meta tags or JSON-LD data
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and 'aggregateRating' in data:
                    # Sometimes monthly listeners are in structured data
                    if 'ratingCount' in data['aggregateRating']:
                        return str(data['aggregateRating']['ratingCount'])
            except:
                continue
        
        # Pattern 3: Look for large numbers that could be monthly listeners
        # This is a fallback - look for any large number on the page
        all_text = soup.get_text()
        large_numbers = re.findall(r'\b[\d,]{6,}\b', all_text)
        if large_numbers:
            # Return the first large number found (this is less reliable)
            return large_numbers[0].replace(',', '')
        
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
    print(f"Scraping monthly listeners for {artist_data.get('name', 'Unknown Artist')}...")
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

def get_youtube_channel_data(channel_id):
    """Gets YouTube channel stats: subscribers, views, video count."""
    if not channel_id:
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

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
    
    # Also save as CSV for backward compatibility with your original script
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
    df.to_csv(csv_file, mode='a', header=not os.path.exists(csv_file), index=False)
    
    print(f"CSV data saved to {csv_file}")

# ------------------ MAIN PROCESS ------------------

if __name__ == "__main__":
    print("Starting data collection...")
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Collect all data
    collected_data = collect_all_data()
    
    # Update historical records
    update_historical_data(collected_data)
    
    print("Data collection complete!")
