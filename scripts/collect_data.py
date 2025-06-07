import base64
import requests
import json
import pandas as pd
from datetime import datetime
import os
import re
from bs4 import BeautifulSoup
import time
import traceback

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
    try:
        auth_url = 'https://accounts.spotify.com/api/token'
        auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

        headers = {'Authorization': f'Basic {auth_header}'}
        data = {'grant_type': 'client_credentials'}

        response = requests.post(auth_url, headers=headers, data=data)
        response.raise_for_status()
        response_data = response.json()
        
        return response_data['access_token']
    except Exception as e:
        print(f"Error getting Spotify token: {e}")
        raise

def clean_number_string(number_str):
    """Clean and convert number string to integer."""
    if not number_str:
        return 0
    
    # Remove all non-digit characters except commas
    cleaned = re.sub(r'[^\d,]', '', str(number_str))
    
    # Remove commas
    cleaned = cleaned.replace(',', '')
    
    if not cleaned:
        return 0
    
    try:
        return int(cleaned)
    except ValueError:
        return 0

def scrape_monthly_listeners(artist_id, artist_name):
    """Scrapes monthly listeners from Spotify's public artist page using multiple methods."""
    if not artist_id:
        print(f"No Spotify ID provided for {artist_name}")
        return "N/A"
    
    print(f"  → Scraping monthly listeners for {artist_name} (ID: {artist_id})")
    
    try:
        url = f"https://open.spotify.com/artist/{artist_id}"
        
        # Multiple user agents to try
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ]
        
        for attempt, user_agent in enumerate(user_agents, 1):
            print(f"    Attempt {attempt}: Trying to fetch page...")
            
            headers = {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
            
            try:
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                
                content = response.text
                print(f"    Page fetched successfully ({len(content)} characters)")
                
                # Method 1: Look for JSON data in script tags
                script_pattern = r'<script[^>]*>(.*?)</script>'
                scripts = re.findall(script_pattern, content, re.DOTALL)
                
                for script_content in scripts:
                    # Look for monthly listeners in various JSON formats
                    patterns = [
                        r'"monthlyListeners":\s*(\d+)',
                        r'"monthly_listeners":\s*(\d+)',
                        r'"stats":\s*{[^}]*"monthlyListeners":\s*(\d+)',
                        r'monthlyListeners["\']:\s*["\']?(\d+)',
                        r'monthly.listeners["\']?\s*:\s*["\']?(\d+)'
                    ]
                    
                    for pattern in patterns:
                        match = re.search(pattern, script_content, re.IGNORECASE)
                        if match:
                            listeners = clean_number_string(match.group(1))
                            if listeners > 0:
                                print(f"    ✓ Found monthly listeners in JSON: {listeners:,}")
                                return listeners
                
                # Method 2: Look for text patterns
                text_patterns = [
                    r'(\d{1,3}(?:,\d{3})*)\s*monthly\s*listeners',
                    r'(\d+)\s*monthly\s*listeners',
                    r'monthly\s*listeners[:\s]*(\d{1,3}(?:,\d{3})*)',
                    r'(\d{1,3}(?:,\d{3})*)\s*listeners\s*monthly'
                ]
                
                for pattern in text_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        for match in matches:
                            listeners = clean_number_string(match)
                            if listeners > 0:
                                print(f"    ✓ Found monthly listeners in text: {listeners:,}")
                                return listeners
                
                # Method 3: BeautifulSoup parsing for structured content
                soup = BeautifulSoup(content, 'html.parser')
                
                # Look for elements that might contain monthly listeners
                possible_selectors = [
                    '[data-testid*="monthly"]',
                    '[class*="monthly"]',
                    '[class*="listener"]',
                    'span:contains("monthly")',
                    'div:contains("monthly")',
                    'p:contains("monthly")'
                ]
                
                for selector in possible_selectors:
                    try:
                        elements = soup.select(selector)
                        for element in elements:
                            text = element.get_text()
                            if 'monthly' in text.lower() and 'listener' in text.lower():
                                numbers = re.findall(r'\d{1,3}(?:,\d{3})*', text)
                                for num in numbers:
                                    listeners = clean_number_string(num)
                                    if listeners > 100:  # Reasonable threshold
                                        print(f"    ✓ Found monthly listeners in element: {listeners:,}")
                                        return listeners
                    except:
                        continue
                
                # Method 4: Look for large numbers that could be monthly listeners
                all_numbers = re.findall(r'\b(\d{1,3}(?:,\d{3})+)\b', content)
                large_numbers = []
                
                for num_str in all_numbers:
                    num = clean_number_string(num_str)
                    if 1000 <= num <= 100000000:  # Reasonable range for monthly listeners
                        large_numbers.append(num)
                
                if large_numbers:
                    # Sort and take the most reasonable number
                    large_numbers.sort(reverse=True)
                    for num in large_numbers[:3]:  # Check top 3 largest numbers
                        # Look for context around this number
                        num_pattern = re.escape(f"{num:,}")
                        context_match = re.search(f'.{{0,50}}{num_pattern}.{{0,50}}', content, re.IGNORECASE)
                        if context_match:
                            context = context_match.group()
                            if any(word in context.lower() for word in ['monthly', 'listener', 'month']):
                                print(f"    ✓ Found monthly listeners by context: {num:,}")
                                return num
                
                print(f"    ⚠ No monthly listeners found in attempt {attempt}")
                
                # Wait before next attempt
                if attempt < len(user_agents):
                    time.sleep(2)
                    
            except requests.RequestException as e:
                print(f"    ✗ Request failed in attempt {attempt}: {e}")
                if attempt < len(user_agents):
                    time.sleep(3)
                continue
            except Exception as e:
                print(f"    ✗ Error in attempt {attempt}: {e}")
                if attempt < len(user_agents):
                    time.sleep(2)
                continue
        
        print(f"    ✗ All attempts failed for {artist_name}")
        return "N/A"
        
    except Exception as e:
        print(f"    ✗ Fatal error scraping monthly listeners for {artist_name}: {e}")
        return "N/A"

def get_spotify_artist_data(artist_id, token, artist_name):
    """Gets name, popularity, followers, and monthly listeners for a Spotify artist."""
    if not artist_id:
        print(f"No Spotify ID for {artist_name}")
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }
        
    try:
        print(f"  Getting Spotify API data for {artist_name}...")
        
        url = f"https://api.spotify.com/v1/artists/{artist_id}"
        headers = {'Authorization': f'Bearer {token}'}
        
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
        monthly_listeners = scrape_monthly_listeners(artist_id, artist_name)
        
        result = {
            'popularity_score': artist_data.get('popularity', 0),
            'followers': artist_data.get('followers', {}).get('total', 0),
            'monthly_listeners': monthly_listeners,
            'genres': artist_data.get('genres', []),
            'top_tracks': top_tracks
        }
        
        print(f"  ✓ Spotify data collected: Popularity: {result['popularity_score']}, "
              f"Followers: {result['followers']:,}, Monthly Listeners: {result['monthly_listeners']}")
        
        # Add a delay to be respectful to servers
        time.sleep(2)
        
        return result
    
    except Exception as e:
        print(f"  ✗ Error getting Spotify data for {artist_name}: {e}")
        traceback.print_exc()
        return {
            'popularity_score': 0,
            'followers': 0,
            'monthly_listeners': "N/A",
            'genres': [],
            'top_tracks': []
        }

def get_youtube_channel_data(channel_id, artist_name):
    """Gets YouTube channel stats: subscribers, views, video count."""
    if not channel_id:
        print(f"  No YouTube channel for {artist_name}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

    try:
        print(f"  Getting YouTube data for {artist_name}...")
        
        url = f"https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channel_id}&key={YOUTUBE_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if 'items' in data and len(data['items']) > 0:
            stats = data['items'][0]['statistics']
            result = {
                'subscribers': int(stats.get('subscriberCount', 0)),  
                'total_views': int(stats.get('viewCount', 0)),        
                'video_count': int(stats.get('videoCount', 0))        
            }
            print(f"  ✓ YouTube data collected: Subscribers: {result['subscribers']:,}, "
                  f"Views: {result['total_views']:,}, Videos: {result['video_count']}")
            return result
        else:
            print(f"  ⚠ No YouTube data found for {artist_name}")
            return {'subscribers': 0, 'total_views': 0, 'video_count': 0}
    
    except Exception as e:
        print(f"  ✗ Error getting YouTube data for {artist_name}: {e}")
        return {'subscribers': 0, 'total_views': 0, 'video_count': 0}

def collect_all_data():
    """Collects all artist data from multiple platforms."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    print("Getting Spotify API token...")
    spotify_token = get_spotify_token()
    print("✓ Spotify token obtained")
    
    all_artists_data = {
        'date': today,
        'artists': []
    }
    
    for i, artist in enumerate(artists, 1):
        print(f"\n[{i}/{len(artists)}] Collecting data for {artist['name']}...")
        print("=" * 50)
        
        artist_data = {
            'name': artist['name'],
            'spotify': get_spotify_artist_data(artist.get('spotify_id'), spotify_token, artist['name']),
            'youtube': get_youtube_channel_data(artist.get('youtube_id'), artist['name'])
        }
        
        all_artists_data['artists'].append(artist_data)
        
        print(f"✓ Completed data collection for {artist['name']}")
    
    return all_artists_data

def save_data_as_json(data, filename):
    """Saves the collected data as JSON."""
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✓ Data saved to {filename}")
    except Exception as e:
        print(f"✗ Error saving JSON to {filename}: {e}")

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
        # Convert monthly_listeners to string for CSV consistency
        monthly_listeners_str = artist['spotify']['monthly_listeners']
        if isinstance(monthly_listeners_str, int):
            monthly_listeners_str = str(monthly_listeners_str)
        
        artist_info = {
            'artist_name': artist['name'],
            'date': today,
            'popularity_score': artist['spotify']['popularity_score'],
            'followers': artist['spotify']['followers'],
            'monthly_listeners': monthly_listeners_str,
            'youtube_subscribers': artist['youtube']['subscribers'],
            'youtube_total_views': artist['youtube']['total_views'],
            'youtube_video_count': artist['youtube']['video_count']
        }
        artists_data.append(artist_info)
    
    try:
        df = pd.DataFrame(artists_data)
        
        # Check if file exists to determine if we need headers
        file_exists = os.path.exists(csv_file)
        df.to_csv(csv_file, mode='a', header=not file_exists, index=False)
        
        print(f"✓ CSV data saved to {csv_file}")
    except Exception as e:
        print(f"✗ Error saving CSV: {e}")

# ------------------ MAIN PROCESS ------------------

if __name__ == "__main__":
    print("🎵 Starting Casa 24 Records Data Collection 🎵")
    print("=" * 60)
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    try:
        # Collect all data
        collected_data = collect_all_data()
        
        # Update historical records
        print("\n" + "=" * 60)
        print("Saving collected data...")
        update_historical_data(collected_data)
        
        print("\n" + "=" * 60)
        print("🎉 Data collection completed successfully! 🎉")
        
        # Print summary of collected data
        print("\n📊 SUMMARY OF COLLECTED DATA:")
        print("=" * 60)
        for artist in collected_data['artists']:
            monthly_listeners = artist['spotify']['monthly_listeners']
            monthly_listeners_display = f"{monthly_listeners:,}" if isinstance(monthly_listeners, int) else monthly_listeners
            
            print(f"\n🎤 {artist['name']}:")
            print(f"   Spotify → Popularity: {artist['spotify']['popularity_score']}/100, "
                  f"Followers: {artist['spotify']['followers']:,}, "
                  f"Monthly Listeners: {monthly_listeners_display}")
            print(f"   YouTube → Subscribers: {artist['youtube']['subscribers']:,}, "
                  f"Views: {artist['youtube']['total_views']:,}, "
                  f"Videos: {artist['youtube']['video_count']}")
    
    except Exception as e:
        print(f"\n💥 Error during data collection: {e}")
        traceback.print_exc()
        print("\nPlease check your internet connection and API credentials.")
