#!/usr/bin/env python3
"""
Script to download all required JavaScript libraries for the Casa 24 Records Dashboard.
This script creates the necessary folder structure and downloads all required files.
"""

import os
import urllib.request
import ssl

# Create a context that doesn't verify SSL certificates (only if needed)
ssl_context = ssl._create_unverified_context()

# URLs of libraries to download
LIBRARIES = {
    "react": {
        "react.production.min.js": "https://unpkg.com/react@17/umd/react.production.min.js"
    },
    "react-dom": {
        "react-dom.production.min.js": "https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"
    },
    "recharts": {
        "Recharts.js": "https://unpkg.com/recharts@2.5.0/umd/Recharts.js",
        "d3-array.min.js": "https://unpkg.com/d3-array@3.2.0/dist/d3-array.min.js",
        "d3-scale.min.js": "https://unpkg.com/d3-scale@4.0.2/dist/d3-scale.min.js",
        "d3-shape.min.js": "https://unpkg.com/d3-shape@3.1.0/dist/d3-shape.min.js"
    },
    "babel": {
        "babel.min.js": "https://unpkg.com/babel-standalone@6/babel.min.js"
    }
}

def main():
    # Create libs directory if it doesn't exist
    if not os.path.exists('libs'):
        os.mkdir('libs')
        print("Created 'libs' directory")
    
    # Download each library
    for lib_dir, files in LIBRARIES.items():
        # Create library subdirectory if it doesn't exist
        lib_path = os.path.join('libs', lib_dir)
        if not os.path.exists(lib_path):
            os.mkdir(lib_path)
            print(f"Created '{lib_path}' directory")
        
        # Download each file for this library
        for filename, url in files.items():
            file_path = os.path.join(lib_path, filename)
            
            # Skip if file already exists
            if os.path.exists(file_path):
                print(f"File already exists: {file_path}")
                continue
            
            try:
                print(f"Downloading {url} to {file_path}...")
                urllib.request.urlretrieve(url, file_path)
                print(f"Successfully downloaded {filename}")
            except Exception as e:
                print(f"Error downloading {url}: {e}")
    
    print("\nDownload complete! Your local libraries are ready to use.")
    print("Make sure to update your index.html to use these local files.")

if __name__ == "__main__":
    main()