import urllib.request
import re
import json

url = 'https://meteofrance.com/previsions-meteo-france/france'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print(f"Page fetched: {len(html)} bytes")
        
        # Look for drupalSettings
        m = re.search(r'window\.drupalSettings\s*=\s*(\{.*?\});\s*</script>', html, re.DOTALL)
        if m:
            print("Found drupalSettings!")
            try:
                ds = json.loads(m.group(1))
                with open('drupal_settings_extracted.json', 'w', encoding='utf-8') as f:
                    json.dump(ds, f, indent=2, ensure_ascii=False)
                print("Saved drupal_settings_extracted.json")
            except Exception as ex:
                print("JSON decode error:", ex)
        
        # Check all img tags or pictograms
        imgs = re.findall(r'<img[^>]+>', html)
        print(f"Total img tags: {len(imgs)}")
        for img in imgs:
            if any(k in img.lower() for k in ['picto', 'weather', 'temps', 'neige', 'snow', 'p12', 'p10', 'p1', 'p2', 'svg', 'bulletin']):
                print("IMG:", img)
except Exception as e:
    print("Fetch error:", e)
