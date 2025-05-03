from google_auth_oauthlib.flow import Flow
import json

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def main():
    flow = Flow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri='urn:ietf:wg:oauth:2.0:oob'  # Out-of-band method
    )

    auth_url, _ = flow.authorization_url(prompt='consent')

    print("Go to this URL and authorize access:")
    print(auth_url)

    code = input("Enter the authorization code: ")
    flow.fetch_token(code=code)

    creds = flow.credentials
    with open('token.json', 'w') as token_file:
        token_file.write(creds.to_json())

    print("Token generated and saved as token.json")

if __name__ == '__main__':
    main()