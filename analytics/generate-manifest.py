#!/usr/bin/env python3
"""
Generate a manifest of all JSON files in the data/historical folder.
This helps the dashboard know which files to load.
"""

import os
import json
from datetime import datetime

def generate_manifest():
    """Scan the historical folder and create a manifest of available files."""
    
    historical_path = 'data/historical'
    manifest = {
        'generated': datetime.now().isoformat(),
        'files': [],
        'date_range': {
            'start': None,
            'end': None
        },
        'total_files': 0
    }
    
    # Check if directory exists
    if not os.path.exists(historical_path):
        print(f"Error: Directory '{historical_path}' not found!")
        return
    
    # Get all JSON files
    json_files = []
    for filename in os.listdir(historical_path):
        if filename.endswith('.json'):
            try:
                # Extract date from filename (expecting format: YYYY-MM-DD.json)
                date_str = filename.replace('.json', '')
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                json_files.append({
                    'filename': filename,
                    'date': date_str,
                    'timestamp': date_obj.timestamp()
                })
            except ValueError:
                print(f"Warning: Skipping file with invalid date format: {filename}")
    
    # Sort by date
    json_files.sort(key=lambda x: x['timestamp'])
    
    # Build manifest
    if json_files:
        manifest['files'] = [f['filename'] for f in json_files]
        manifest['date_range']['start'] = json_files[0]['date']
        manifest['date_range']['end'] = json_files[-1]['date']
        manifest['total_files'] = len(json_files)
    
    # Save manifest
    manifest_path = os.path.join(historical_path, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Manifest generated successfully!")
    print(f"Found {manifest['total_files']} files")
    print(f"Date range: {manifest['date_range']['start']} to {manifest['date_range']['end']}")
    print(f"Manifest saved to: {manifest_path}")
    
    return manifest

def update_data_processor():
    """Update the data-processor.js to use the manifest."""
    
    update_code = """
    // Add this method to DataProcessor object in data-processor.js:
    
    async loadManifest() {
        try {
            const response = await fetch('data/historical/manifest.json');
            if (response.ok) {
                const manifest = await response.json();
                return manifest.files.map(f => `data/historical/${f}`);
            }
        } catch (error) {
            console.warn('Manifest not found, falling back to date range method');
        }
        return null;
    },
    
    // Then update loadHistoricalData() method to use manifest:
    
    async loadHistoricalData() {
        try {
            // Try to load from manifest first
            const manifestFiles = await this.loadManifest();
            
            let files;
            if (manifestFiles) {
                files = manifestFiles;
            } else {
                // Fallback to date range method
                const startDate = new Date('2025-04-26');
                const endDate = new Date();
                files = [];
                
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    files.push(`data/historical/${dateStr}.json`);
                }
            }
            
            // Continue with existing loading logic...
        """
    
    print("\n" + "="*50)
    print("To use the manifest, update your data-processor.js:")
    print("="*50)
    print(update_code)

if __name__ == "__main__":
    manifest = generate_manifest()
    if manifest['total_files'] > 0:
        update_data_processor()
