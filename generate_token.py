from google_auth_oauthlib.flow import Flow
import json
import os
import socket

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

def find_free_port():
    """Find a free port on the system to avoid conflicts."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]

def main():
    if not os.path.exists('credentials.json'):
        print("Error: credentials.json file not found in the current directory")
        print("Please download your OAuth client credentials from Google Cloud Console")
        return
    
    flow = Flow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri='urn:ietf:wg:oauth:2.0:oob'  # Out-of-band method for non-web apps
    )

    try:
        # Try with browser-based authentication first
        port = find_free_port()
        print(f"Starting authorization flow on port {port}")
        
        # First try local server
        try:
            # Override the redirect URI for local server flow
            flow = Flow.from_client_secrets_file(
                'credentials.json',
                scopes=SCOPES,
            )
            creds = flow.run_local_server(port=port)
            print("Authorization successful through browser flow!")
        except Exception as e:
            print(f"Local server flow failed: {e}")
            print("Falling back to manual authorization...")
            
            # Fall back to manual authorization
            flow = Flow.from_client_secrets_file(
                'credentials.json',
                scopes=SCOPES,
                redirect_uri='urn:ietf:wg:oauth:2.0:oob'
            )
            auth_url, _ = flow.authorization_url(prompt='consent')
            
            print("\nGo to this URL and authorize access:")
            print(auth_url)
            
            code = input("\nEnter the authorization code: ")
            flow.fetch_token(code=code)
            creds = flow.credentials
            print("Manual authorization successful!")
        
        # Save token to file
        with open('token.json', 'w') as token_file:
            token_file.write(creds.to_json())
        
        print("Token generated and saved as token.json")
        
        # Print token expiry information
        if hasattr(creds, 'expiry'):
            print(f"Token will expire at: {creds.expiry}")
        
        # Confirm scopes
        print(f"Token has the following scopes: {creds.scopes}")
        
        # Check if we have a refresh token
        if hasattr(creds, 'refresh_token') and creds.refresh_token:
            print("✅ Refresh token obtained - token can be automatically refreshed")
        else:
            print("⚠️ No refresh token - token cannot be automatically refreshed")

    except Exception as e:
        print(f"Error during authorization: {e}")
        return

if __name__ == '__main__':
    main()