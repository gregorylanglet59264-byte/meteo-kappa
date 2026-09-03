import urllib.request
import re
import json

# Check how meteofrance generates forecasts / API
req = urllib.request.Request('https://meteofrance.com', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=15) as r:
    html = r.read().decode('utf-8', errors='ignore')

# Extract all links and scripts
links = re.findall(r'href=[\"\']([^\"\']+)[\"\']', html)
previs_links = [l for l in links if 'prevision' in l.lower() or 'france' in l.lower() or 'bulletin' in l.lower()]
print("Prevision links:", set(previs_links[:20]))

# Search for drupalSettings or token in HTML
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
for s in scripts:
    if 'drupalSettings' in s:
        print("Found script with drupalSettings! Len:", len(s))
        m = re.search(r'window\.drupalSettings\s*=\s*(\{.*?\});', s, re.DOTALL)
        if m:
            with open('mf_drupal_settings.json', 'w', encoding='utf-8') as f:
                f.write(m.group(1))
            print("Saved mf_drupal_settings.json")
