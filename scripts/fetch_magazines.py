import os
import json
from datetime import datetime
import googleapiclient.errors
import io
from googleapiclient.http import MediaIoBaseDownload

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
PDF_FOLDER = 'data/magazines/pdfs'  # Folder to store downloaded PDFs

def create_dummy_magazines():
    """Create dummy magazine data based on actual filenames."""
    magazines = [
        {
            'id': 'dummy-id-1',
            'name': 'Life @24 [Dic 02 - Dic 08].pdf',
            'date': '2024-12-02',
            'url': 'https://docs.google.com/viewer?embedded=true',
            'thumbnail': '',
            'local_path': 'data/magazines/pdfs/Life @24 [Dic 02 - Dic 08].pdf'
        },
        # ... other magazines ...
    ]
    
    # Sort by date (newest first)
    magazines.sort(key=lambda x: x['date'], reverse=True)
    return magazines

def get_credentials():
    """Get credentials with token refresh capability."""
    if not google_libraries_imported:
        print("Google libraries not imported, can't get credentials")
        return None
        
    creds = None
    
    # Check if token.json exists (created by GitHub Actions from secrets)
    try:
        if os.path.exists('token.json'):
            print("Using token from file")
            try:
                creds = Credentials.from_authorized_user_info(
                    json.loads(open('token.json').read()), SCOPES)
                    
                # If credentials are expired but we have a refresh token, refresh them
                if creds and creds.expired and creds.refresh_token:
                    print("Token expired, refreshing...")
                    creds.refresh(Request())
                    
                    # Save the refreshed token
                    with open('token.json', 'w') as token_file:
                        token_file.write(creds.to_json())
                    print("Token refreshed and saved")
            except Exception as e:
                print(f"Error with token.json: {e}")
                return None
        else:
            print("No token.json file found")
            return None
    except Exception as e:
        print(f"Error checking for token.json: {e}")
        return None
    
    return creds

def get_files_from_folder(service, folder_id):
    """Get all PDF files from the specified Google Drive folder and download them."""
    try:
        # Create the PDF folder if it doesn't exist
        os.makedirs(PDF_FOLDER, exist_ok=True)
        
        # Try with standard mimeType query for PDFs
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
            file_id = item['id']
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
            
            # Download the file
            local_path = os.path.join(PDF_FOLDER, name)
            
            try:
                print(f"Downloading file: {name}")
                request = service.files().get_media(fileId=file_id)
                file_handle = io.BytesIO()
                downloader = MediaIoBaseDownload(file_handle, request)
                
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    print(f"Download {int(status.progress() * 100)}%")
                
                # Save the file
                with open(local_path, 'wb') as f:
                    f.write(file_handle.getvalue())
                print(f"File saved to {local_path}")
                
                # Add magazine info
                magazines.append({
                    'id': item['id'],
                    'name': name,
                    'date': pub_date,
                    'url': item['webViewLink'],
                    'thumbnail': item.get('thumbnailLink', ''),
                    'local_path': local_path
                })
                
            except Exception as e:
                print(f"Error downloading file '{name}': {e}")
                # Still add the magazine but without local path
                magazines.append({
                    'id': item['id'],
                    'name': name,
                    'date': pub_date,
                    'url': item['webViewLink'],
                    'thumbnail': item.get('thumbnailLink', ''),
                    'local_path': None
                })
        
        # Sort magazines by date (newest first)
        magazines.sort(key=lambda x: x['date'], reverse=True)
        return magazines
        
    except Exception as error:
        print(f"Error getting files: {error}")
        return []

def main():
    """Fetch all PDF magazines from the specified Google Drive folder."""
    # Create directories if they don't exist
    os.makedirs('data/magazines', exist_ok=True)
    os.makedirs(PDF_FOLDER, exist_ok=True)
    
    today = datetime.now().strftime('%Y-%m-%d')
    output_path = 'data/magazines/latest.json'
    
    try:
        # Get credentials with auto-refresh capability
        creds = get_credentials()
        
        if not creds:
            print("Failed to get valid credentials, using dummy magazine data")
            magazines = create_dummy_magazines()
        else:
            # Create drive service
            service = build('drive', 'v3', credentials=creds)
            
            # Fetch magazines and download PDFs
            magazines = get_files_from_folder(service, FOLDER_ID)
            
            # If no magazines found, use dummy data
            if not magazines:
                print("No magazines found, using dummy data instead")
                magazines = create_dummy_magazines()
    except Exception as e:
        print(f"Error occurred: {e}")
        print("Using dummy magazine data")
        magazines = create_dummy_magazines()
    
    # Save magazine metadata to JSON file (without local_path to avoid exposing server paths)
    magazines_json = []
    for mag in magazines:
        mag_copy = mag.copy()
        if 'local_path' in mag_copy:
            # Remove the local_path from the JSON output
            del mag_copy['local_path']
        magazines_json.append(mag_copy)
    
    # Save to JSON file
    with open(output_path, 'w') as f:
        json.dump({
            'date': today,
            'magazines': magazines_json
        }, f, indent=2)
    
    print(f"Saved {len(magazines)} magazines to {output_path}")
    print(f"PDF files are stored in {PDF_FOLDER}")

if __name__ == '__main__':
    main()