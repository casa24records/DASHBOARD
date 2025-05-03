import os
import json
from datetime import datetime
import googleapiclient.errors

# For GitHub Actions environment
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from google.auth.transport.requests import Request
    google_libraries_imported = True
except ImportError:
    print("Google API libraries not found, will use dummy data")
    google_libraries_imported = False

# Constants
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
FOLDER_ID = '12p8iE_zMLkzFOgEifhOBGwgSnyla05-s'

def create_dummy_magazines():
    """Create dummy magazine data based on actual filenames."""
    magazines = [
        {
            'id': 'dummy-id-1',
            'name': 'Life @24 [Dic 02 - Dic 08].pdf',
            'date': '2024-12-02',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-2',
            'name': 'LIFE 24 [DIC 09 - DIC 15].pdf',
            'date': '2024-12-09',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-3',
            'name': 'LIFE 24 [DIC 16 - DIC 22].pdf',
            'date': '2024-12-16',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-4',
            'name': 'LIFE 24 [DIC 23 - DIC 29].pdf',
            'date': '2024-12-23',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-5',
            'name': 'LIFE 24 [DIC 30 - ENE 05].pdf',
            'date': '2024-12-30',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-6',
            'name': 'LIFE 24 [ENE 07 - ENE 12].pdf',
            'date': '2025-01-07',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-7',
            'name': 'LIFE 24 [ENE 13 - ENE 19].pdf',
            'date': '2025-01-13',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-8',
            'name': 'LIFE 24 [ENE 20 - ENE 26].pdf',
            'date': '2025-01-20',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-9',
            'name': 'LIFE 24 [ENE 27 - FEB 02].pdf',
            'date': '2025-01-27',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        },
        {
            'id': 'dummy-id-10',
            'name': 'LIFE 24 [FEB 03- FEB 09].pdf',
            'date': '2025-02-03',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': ''
        }
    ]
    
    # Sort by date (newest first)
    magazines.sort(key=lambda x: x['date'], reverse=True)
    return magazines

def get_credentials():
    """Get credentials from environment variables or files."""
    if not google_libraries_imported:
        print("Google libraries not imported, can't get credentials")
        return None
        
    creds = None
    
    # Check if credential files exist (created by GitHub Actions)
    try:
        if os.path.exists('credentials.json') and os.path.exists('token.json'):
            print("Using credentials from files")
            try:
                creds = Credentials.from_authorized_user_info(
                    json.loads(open('token.json').read()), SCOPES)
                    
                # If credentials are expired but we have a refresh token, refresh them
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
            except Exception as e:
                print(f"Error loading token.json: {e}")
                return None
        else:
            print("No credential files found")
            return None
    except Exception as e:
        print(f"Error checking for credential files: {e}")
        return None
    
    return creds

def get_files_from_folder(service, folder_id):
    """Get all PDF files from the specified Google Drive folder."""
    try:
        # Try first with standard mimeType query
        query = f"'{folder_id}' in parents and mimeType='application/pdf'"
        print(f"Querying for PDF files in folder: {folder_id}")
        
        results = service.files().list(
            q=query,
            pageSize=100,
            fields="nextPageToken, files(id, name, createdTime, webViewLink, thumbnailLink)"
        ).execute()
        
        items = results.get('files', [])
        print(f"Found {len(items)} PDF files")
        
        if not items:
            print('No PDF files found in the specified folder.')
            return []
        
        magazines = []
        for item in items:
            name = item['name']
            pub_date = None
            
            # Extract date from formats like "LIFE 24 [DIC 09 - DIC 15].pdf"
            try:
                if '[' in name and ']' in name:
                    date_part = name.split('[')[1].split(']')[0]
                    
                    # Handle month abbreviations
                    if 'DIC' in date_part.upper():
                        month = 12
                    elif 'ENE' in date_part.upper():
                        month = 1
                    elif 'FEB' in date_part.upper():
                        month = 2
                    else:
                        month = 1  # Default
                    
                    # Extract the first day
                    day_part = date_part.split('-')[0].strip()
                    day = int(''.join(filter(str.isdigit, day_part)))
                    
                    # Use 2024 for December, 2025 for January and February
                    year = 2024 if month == 12 else 2025
                    
                    pub_date = f"{year}-{month:02d}-{day:02d}"
                else:
                    # Use creation date as fallback
                    pub_date = item['createdTime'].split('T')[0]
            except Exception as e:
                print(f"Error extracting date from '{name}': {e}")
                # Default to created time if parsing fails
                pub_date = item['createdTime'].split('T')[0]
            
            print(f"Processing: {name} with date {pub_date}")
            
            magazines.append({
                'id': item['id'],
                'name': name,
                'date': pub_date,
                'url': item['webViewLink'],
                'thumbnail': item.get('thumbnailLink', '')
            })
        
        # Sort magazines by date (newest first)
        magazines.sort(key=lambda x: x['date'], reverse=True)
        return magazines
        
    except Exception as error:
        print(f"Error getting files: {error}")
        return []

def main():
    """Fetch all PDF magazines from the specified Google Drive folder."""
    # Create directory if it doesn't exist
    os.makedirs('data/magazines', exist_ok=True)
    today = datetime.now().strftime('%Y-%m-%d')
    output_path = 'data/magazines/latest.json'
    
    try:
        # Get credentials
        creds = get_credentials()
        
        if not creds:
            print("Failed to get valid credentials, using dummy magazine data")
            magazines = create_dummy_magazines()
        else:
            # Create drive service
            service = build('drive', 'v3', credentials=creds)
            
            # Fetch magazines
            magazines = get_files_from_folder(service, FOLDER_ID)
            
            # If no magazines found, use dummy data
            if not magazines:
                print("No magazines found, using dummy data instead")
                magazines = create_dummy_magazines()
    except Exception as e:
        print(f"Error occurred: {e}")
        print("Using dummy magazine data")
        magazines = create_dummy_magazines()
    
    # Save to JSON file
    with open(output_path, 'w') as f:
        json.dump({
            'date': today,
            'magazines': magazines
        }, f, indent=2)
    
    print(f"Saved {len(magazines)} magazines to {output_path}")

if __name__ == '__main__':
    main()