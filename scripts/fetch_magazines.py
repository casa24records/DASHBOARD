import os
import json
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

# If modifying these SCOPES, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
FOLDER_ID = '12p8iE_zMLkzFOgEifhOBGwgSnyla05-s'

def get_credentials():
    """Get and refresh user credentials from token file."""
    creds = None
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_info(
            json.loads(open('token.json').read()), SCOPES)
    
    # If there are no valid credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return creds

def get_files_from_folder(service, folder_id):
    """Get all PDF files from the specified Google Drive folder."""
    results = service.files().list(
        q=f"'{folder_id}' in parents and mimeType='application/pdf'",
        pageSize=100,
        fields="nextPageToken, files(id, name, createdTime, webViewLink, thumbnailLink)"
    ).execute()
    
    items = results.get('files', [])
    if not items:
        print('No PDF files found in the specified folder.')
        return []
    
    magazines = []
    for item in items:
        # Extract publication date from filename if possible
        # Assuming format like "Casa24_Issue_YYYY-MM-DD.pdf"
        name = item['name']
        pub_date = None
        
        try:
            # Try to extract date from filename
            parts = name.replace('.pdf', '').split('_')
            if len(parts) >= 3:
                pub_date = parts[-1]
            else:
                # Use creation date as fallback
                pub_date = item['createdTime'].split('T')[0]
        except:
            # Default to created time if parsing fails
            pub_date = item['createdTime'].split('T')[0]
        
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

def main():
    """Fetch all PDF magazines from the specified Google Drive folder."""
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)
    
    magazines = get_files_from_folder(service, FOLDER_ID)
    
    # Create directory if it doesn't exist
    os.makedirs('data/magazines', exist_ok=True)
    
    # Save to JSON file
    today = datetime.now().strftime('%Y-%m-%d')
    output_path = f'data/magazines/latest.json'
    
    with open(output_path, 'w') as f:
        json.dump({
            'date': today,
            'magazines': magazines
        }, f, indent=2)
    
    print(f"Saved {len(magazines)} magazines to {output_path}")

if __name__ == '__main__':
    main()